"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = relative => fs.readFileSync(path.join(ROOT, relative), "utf8");

test("页面使用单一 Runtime Manifest 与 ESM bootstrap", () => {
  const scripts = read("layout/_partial/scripts.ejs");
  const runtime = read("layout/_partial/scripts/runtime.ejs");
  assert.match(scripts, /partial\('scripts\/runtime'/);
  assert.match(runtime, /type="application\/json" id="stellar-runtime-config"/);
  assert.match(runtime, /type="module" src="<%- url_for\(runtimeAssets\.runtime\.bootstrap\)/);
  assert.match(runtime, /&runtime=1/);
  assert.match(runtime, /runtimeMathProvider = runtimeRender\.math \|\| runtimeExtensions\.features\.math\.provider/);
  assert.match(runtime, /runtimeMathProvider === 'katex'/);
  assert.match(runtime, /runtimeAssets\.features\.katexCss/);
  assert.match(runtime, /integrity="sha384-/);
  assert.match(runtime, /crossorigin="anonymous"/);
  assert.doesNotMatch(scripts, /comments\/script|_plugins\/index|services\.js/);
  assert.doesNotMatch(scripts, /\/js\/icons\.js|\/js\/plugins\/dropdown\.js/);
  const builder = read("scripts/lib/browser-runtime.js");
  assert.match(builder, /"deferred-icons".*selector: "svg\.icon\[data-icon\]"/s);
  assert.match(builder, /"dropdown".*selector: "details\.dropdown"/s);
});

test("ESM 入口把版本查询参数传给全部静态与动态子模块", () => {
  const runtime = read("source/js/runtime/index.mjs");
  assert.match(runtime, /new URL\(import\.meta\.url\)\.search/);
  assert.match(runtime, /import\(`\.\/asset-loader\.mjs\$\{RUNTIME_QUERY\}`\)/);
  assert.match(runtime, /version: RUNTIME_QUERY/);
  assert.match(runtime, /`\$\{assets\.resolve\(declaration\.module\)\}\$\{RUNTIME_QUERY\}`/);
  const loader = read("source/js/runtime/asset-loader.mjs");
  assert.match(loader, /versionAsset\(src, resolveAsset\(root, src\), version\)/);
});

test("旧同步补载、插件队列和网络 monkey patch 已删除", () => {
  const files = [
    "layout/_partial/scripts.ejs",
    "layout/_partial/scripts/defines.ejs",
    "layout/_partial/main/pin_slider.ejs",
    "source/js/utils.js",
    "source/js/runtime/index.mjs"
  ].map(read).join("\n");
  assert.doesNotMatch(files, /document\.write|_pluginQueue|initPlugin|_flushPlugins/);
  assert.doesNotMatch(files, /window\.fetch\s*=|XMLHttpRequest\.prototype\.(?:open|send)\s*=/);
  assert.match(files, /stellar:request-start/);
  assert.match(files, /stellar:request-end/);
  assert.match(files, /__stellarRequestBridge/);
  assert.match(files, /requestBridge\.ready\.then/);
});

test("Search、services、comments 与 Feature 只消费 manifest context", () => {
  const adapters = [
    "source/js/runtime/extensions/search.mjs",
    "source/js/runtime/extensions/services.mjs",
    "source/js/runtime/extensions/comments.mjs",
    "source/js/runtime/extensions/feature.mjs"
  ].map(read).join("\n");
  assert.match(adapters, /context\.extension\.config/);
  assert.match(adapters, /export (?:async )?function mount/);
  assert.doesNotMatch(adapters, /theme\.config|stellar_config\(|_pluginQueue|initPlugin/);
  const services = read("source/js/runtime/extensions/services.mjs");
  assert.match(services, /context\.assets/);
  assert.match(services, /await Promise\.all\(loads\)/);
  assert.match(services, /requires a document root/);
  assert.doesNotMatch(services, /\bsearchFunc\b/);
  assert.doesNotMatch(services, /utils\.js\(/);
  const comments = read("source/js/runtime/extensions/comments.mjs");
  assert.match(comments, /callback\(\(\) => active\)/);
  assert.match(comments, /context\.reportError\(error\)/);
  assert.match(comments, /if \(!isActive\(\)\) return/);
  assert.match(comments, /comment embed failed to load/);
  assert.match(comments, /addEventListener\('error', onError/);
  assert.match(comments, /clearTimeout\(historyTimer\)/);
  assert.doesNotMatch(comments, /document\.(?:querySelector|getElementById)/);
  const search = read("source/js/runtime/extensions/search.mjs");
  assert.match(search, /providerCleanup/);
  assert.match(search, /shortcutCleanup/);
  assert.match(search, /return \(\) =>/);
  const feature = read("source/js/runtime/extensions/feature.mjs");
  assert.doesNotMatch(feature, /case 'katex'/);
  assert.match(feature, /context\.assets\.resolve\(config\.assets\.localCss\)/);
  assert.match(feature, /stellarAdaptiveText\?\.mount/);
  assert.match(feature, /case 'deferred-icons': return mountLegacyAsset\(root, context, config\.asset, 'deferredIcons'\)/);
  assert.match(feature, /case 'dropdown': return mountLegacyAsset\(root, context, config\.asset, 'dropdown'\)/);
  assert.doesNotMatch(feature, /context\.assets\.(?:style|script)\(['"]\//);
  assert.match(feature, /stellar:legacy-feature-ready/);
  assert.doesNotMatch(feature, /__stellarLegacyFeatures/);
  assert.match(feature, /AI summary compatibility adapter requires a document root/);
  const adaptive = read("source/js/plugins/adaptive-text.js");
  assert.doesNotMatch(adaptive, /adaptiveText(?:Elements|Observer|Active)/);
  assert.match(adaptive, /var mountedElements =/);
  assert.match(adaptive, /var observer = null/);
  assert.match(services, /timeouts\.forEach/);
  assert.doesNotMatch(services, /document\.getElementById/);
});

test("动态数据服务在执行前由 Lazy Extension 提供图片包装工具", () => {
  const builder = read("scripts/lib/browser-runtime.js");
  const feature = read("source/js/runtime/extensions/feature.mjs");
  assert.ok(builder.indexOf('"lazy-loading", true') < builder.indexOf('id: "services"'));
  assert.match(builder, /selector: "\.lazy, \.data-service, \[class\*='ds-'\]"/);
  assert.match(feature, /window\.wrapLazyloadImages = wrapLazyloadImages/);
  assert.match(feature, /lazy-loading compatibility adapter requires a document root/);
  assert.match(feature, /instance\?\.update\?\.\(\)/);
  assert.match(feature, /catch \(error\) \{\s*cleanup\(\);\s*throw error;/);
});

test("Runtime 启动失败启用正文显示兜底，Extension 失败以事件隔离", () => {
  const runtime = read("source/js/runtime/index.mjs");
  const registry = read("source/js/runtime/extension-registry.mjs");
  assert.match(runtime, /classList\.add\('sr-fallback'\)/);
  assert.match(runtime, /stellar:extension-error/);
  assert.match(registry, /continue;/);
  assert.match(registry, /await unmount\(root\)/);
});
