"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { load } = require("cheerio");
const { parseStellarConfig } = require("../scripts/lib/config-schema");
const { buildBrowserRuntimeManifest } = require("../scripts/lib/browser-runtime");
const { pageViewModelsFor } = require("../scripts/lib/page-view-model-registry");
const { processNavigation } = require("../scripts/lib/partial-navigation");
const navigation = () => import(pathToFileURL(path.resolve(__dirname, "../source/js/runtime/extensions/partial-navigation.js")).href);

test("collection navigation follows normalized configuration and declared lifetimes", () => {
  for (const enabled of [undefined, true, false]) {
    const config = parseStellarConfig({ themeConfig: enabled === undefined ? {} : { features: { partial_navigation: { enabled } } } });
    assert.equal(config.features.partialNavigation.enabled, enabled !== false);
    const manifest = buildBrowserRuntimeManifest({ extensions: config, assets: {}, messages: {}, comments: {} });
    assert.equal(manifest.extensions.some(entry => entry.id === "partial-navigation"), enabled !== false);
    assert.ok(manifest.extensions.every(entry => ["document", "region"].includes(entry.scope)));
  }
  assert.throws(() => parseStellarConfig({ themeConfig: { features: { partial_navigation: { enabled: 1 } } } }));
});

test("navigation eligibility derives from members and fails closed for unmanaged execution", () => {
  const ctx = { config: { url: "https://example.com/sub/", root: "/sub/" }, stellar: { config: { features: { partialNavigation: { enabled: true } } } } };
  const registry = pageViewModelsFor(ctx);
  registry.setNavigationMembers([
    { page: { path: "one/index.html" }, profile: "wiki", collectionId: "same" },
    { page: { path: "two/index.html" }, profile: "wiki", collectionId: "same" },
    { page: { path: "three/index.html" }, profile: "wiki", collectionId: "other" }
  ]);
  const page = { path: "one/index.html", permalink: "https://example.com/sub/one/" };
  registry.setPageViewModel(page, { collection: { profile: "wiki", id: "same" }, item: { route: { permalink: page.permalink } } });
  const html = '<html><head><title data-stellar-page-meta>Page</title></head><body><main id="main"><a href="../two/">member</a><a href="../three/">other</a><a href="/sub/">index</a><a href="https://elsewhere.test/sub/two/">external</a><a href="%XX">malformed</a></main><script type="application/json" id="stellar-runtime-config">{"extensions":[],"policy":{}}</script></body></html>';
  const output = processNavigation.call(ctx, html, { page });
  const $ = load(output);
  assert.deepEqual($("a[data-stellar-navigation]").map((_, node) => $(node).text()).get(), ["member"]);
  assert.equal(JSON.parse($("#stellar-navigation-config").text()).collection, JSON.stringify(["wiki", "same"]));
  assert.equal(processNavigation.call(ctx, html.replace('</body>', '<script>run()</script></body>'), { page }).includes('id="stellar-navigation-config"'), false);
  assert.equal(processNavigation.call(ctx, html, { page: { path: "missing" } }), html);
});

test("navigation requires matching collection and preserved-shell compatibility", async () => {
  const { navigationMatches } = await navigation();
  const current = { collection: 'one', signature: 'shell' };
  assert.equal(navigationMatches(current, { ...current }), true);
  assert.equal(navigationMatches(current, { ...current, collection: 'other' }), false);
  assert.equal(navigationMatches(current, { ...current, signature: 'changed' }), false);
  assert.equal(navigationMatches(current, null), false);
});

test("navigation transactions serialize commits and discard superseded pending work", async () => {
  const { createNavigationQueue } = await navigation();
  const queue = createNavigationQueue();
  const events = [];
  let finish;
  const first = queue.begin();
  const committing = queue.commit(first.signal, async () => {
    events.push('start');
    await new Promise(resolve => { finish = resolve; });
    events.push('finish');
  });
  await Promise.resolve();
  const second = queue.begin();
  const skipped = queue.commit(second.signal, () => events.push('stale'));
  const third = queue.begin();
  const latest = queue.commit(third.signal, () => events.push('latest'));
  assert.equal(first.signal.aborted, true);
  finish();
  await Promise.all([committing, skipped, latest]);
  assert.deepEqual(events, ['start', 'finish', 'latest']);
  queue.stop();
  assert.equal(third.signal.aborted, true);
});
