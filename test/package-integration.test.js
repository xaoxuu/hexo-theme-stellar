"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { assertRuntime } = require("../ci/check-package-integration");
const { RUNTIME_CONFIG_ID, RUNTIME_VERSION } = require("../scripts/lib/browser-runtime");
const INTERNAL = require("../scripts/lib/internal-constants");

const manifest = `<script id=${RUNTIME_CONFIG_ID} type="application/json">${JSON.stringify({
  version: RUNTIME_VERSION, extensions: []
})}</script>`;
const entry = `<script src="/nested${INTERNAL.assets.runtime.bootstrap}?v=1" type=module></script>`;

test("包集成检查读取压缩后的 Runtime 协议，不依赖组件 DOM", () => {
  assert.doesNotThrow(() => assertRuntime(`${manifest}${entry}`, "page.html"));
});

test("包集成检查拒绝缺失或重复的 Runtime 引导入口", () => {
  for (const html of [entry, manifest + manifest + entry]) {
    assert.throws(() => assertRuntime(html, "page.html"), /one Runtime Manifest/);
  }
  for (const html of [manifest, manifest + entry + entry]) {
    assert.throws(() => assertRuntime(html, "page.html"), /one Runtime ESM entry/);
  }
  assert.throws(() => assertRuntime(
    `<script id=${RUNTIME_CONFIG_ID} type="application/json">{}</script>${entry}`, "page.html"
  ), /invalid Runtime Manifest/);
});
