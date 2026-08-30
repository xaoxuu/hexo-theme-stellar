"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  RUNTIME_CONFIG_ID,
  RUNTIME_VERSION,
  buildBrowserRuntimeManifest,
  serializeBrowserRuntimeManifest
} = require("../scripts/lib/browser-runtime");
const { CONTRIBUTIONS } = require("../scripts/lib/contribution-registry");

const MANIFEST_OWNED_IDS = ["search", "lightbox", "mathjax", "diagrams", "code-copy", "swiper"];

function fixture(overrides = {}) {
  return Object.assign({
    root: "/docs",
    extensions: { features: {} },
    assets: { dependencies: {} },
    render: {},
    comments: {},
    messages: {}
  }, overrides);
}

test("Runtime Manifest validates and freezes the extension protocol", () => {
  const registered = new Set(CONTRIBUTIONS.map(item => item.id));
  assert.equal(MANIFEST_OWNED_IDS.every(id => registered.has(id)), true);
  const manifest = buildBrowserRuntimeManifest(fixture());
  assert.equal(RUNTIME_VERSION, 1);
  assert.equal(RUNTIME_CONFIG_ID, "stellar-runtime-config");
  assert.equal(manifest.root, "/docs/");
  assert.equal(Object.isFrozen(manifest), true);
  assert.equal(Object.isFrozen(manifest.policy), true);
  assert.ok(manifest.extensions.length > 0);

  const ids = new Set();
  for (const extension of manifest.extensions) {
    assert.match(extension.id, /^[a-z][a-z0-9-]*$/);
    assert.match(extension.module, /^\/js\/runtime\/.*\.mjs$/);
    assert.equal(Object.keys(extension.when).length, 1);
    assert.equal(Object.isFrozen(extension.config), true);
    assert.equal(ids.has(extension.id), false);
    ids.add(extension.id);
  }
});

test("Runtime Manifest serialization is safe for inline script data", () => {
  const manifest = buildBrowserRuntimeManifest(fixture({
    assets: { dependencies: { unsafe: "</script><script>alert(1)</script>&" } }
  }));
  const json = serializeBrowserRuntimeManifest(manifest);
  assert.doesNotMatch(json, /<\/script>|&/);
  assert.match(json, /\\u003c\/script\\u003e/);
});

test("Runtime Manifest rejects malformed top-level inputs", () => {
  assert.throws(() => buildBrowserRuntimeManifest({ extensions: [], assets: {} }), /extensions must be an object/);
  assert.throws(
    () => buildBrowserRuntimeManifest({ extensions: {}, assets: [], render: {}, comments: {} }),
    /assets must be an object/
  );
});
