"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  RUNTIME_CONFIG_ID,
  RUNTIME_VERSION,
  buildBrowserRuntimeManifest,
  serializeBrowserRuntimeManifest
} = require("../scripts/lib/browser-runtime");
const { CONTRIBUTIONS } = require("../scripts/lib/contribution-registry");

const MANIFEST_OWNED_IDS = ["search", "lightbox", "mathjax", "diagrams", "code-copy", "swiper"];
const RUNTIME_SOURCE = path.resolve(__dirname, "../source/js/runtime");

function runtimeFiles(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(root, entry.name);
    return entry.isDirectory() ? runtimeFiles(file) : [file];
  });
}

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
    assert.match(extension.module, /^\/js\/runtime\/.*\.js$/);
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

test("Runtime browser assets use conventional .js module URLs end to end", () => {
  const files = runtimeFiles(RUNTIME_SOURCE);
  assert.ok(files.length > 0);
  for (const file of files) {
    assert.equal(path.extname(file), ".js", path.relative(RUNTIME_SOURCE, file));
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), /\.mjs\b/, path.relative(RUNTIME_SOURCE, file));
  }
});

test("Runtime Manifest rejects malformed top-level inputs", () => {
  assert.throws(() => buildBrowserRuntimeManifest({ extensions: [], assets: {} }), /extensions must be an object/);
  assert.throws(
    () => buildBrowserRuntimeManifest({ extensions: {}, assets: [], render: {}, comments: {} }),
    /assets must be an object/
  );
});
