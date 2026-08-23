"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  RUNTIME_CONFIG_ID,
  RUNTIME_VERSION,
  buildBrowserRuntimeManifest,
  serializeBrowserRuntimeManifest
} = require("../scripts/lib/browser-runtime");

function fixture(overrides = {}) {
  return Object.assign({
    root: "/docs",
    profile: "wiki",
    colorScheme: "auto",
    render: {},
    comments: { service: "giscus", options: { "data-repo": "x/y" }, pageTitle: "Docs" },
    extensions: {
      search: { provider: "local", providers: { local: { indexPath: "/search.json", lazy: true } } },
      comments: {},
      services: { siteInfo: { endpoint: "https://example.com/?url={href}" } },
      cache: { enabled: true, defaultTtl: 60, ttl: { siteinfo: 30 }, maxEntries: 20 },
      features: {
        preload: { enabled: true },
        lightbox: { enabled: true, mode: "auto", selector: ".custom" },
        reveal: { enabled: true },
        aiSummary: { enabled: true, scope: "wiki" },
        math: { provider: null, providers: {} },
        diagrams: { enabled: false },
        codeCopy: { enabled: true },
        adaptiveText: { enabled: true },
        cardHover: { enabled: false },
        cjkTypography: { enabled: false }
      }
    },
    assets: {
      dependencies: { marked: "https://cdn.example/marked.js", lazyLoading: "https://cdn.example/lazy.js" },
      search: { algolia: "https://cdn.example/algolia.js" },
      comments: { giscus: { js: "https://giscus.app/client.js" } },
      features: { preload: "https://cdn.example/preload.js", lightbox: {}, reveal: "https://cdn.example/reveal.js", aiSummary: "https://cdn.example/ai.js", swiper: {} },
      services: { siteinfo: { js: "/js/services/siteinfo.js" } }
    }
  }, overrides);
}

test("Runtime Manifest 投影页面需要的 Extension 并深度冻结", () => {
  const manifest = buildBrowserRuntimeManifest(fixture());
  assert.equal(RUNTIME_VERSION, 1);
  assert.equal(RUNTIME_CONFIG_ID, "stellar-runtime-config");
  assert.equal(manifest.root, "/docs/");
  assert.deepEqual(manifest.extensions.map(item => item.id), [
    "search", "lazy-loading", "services", "comments", "preload", "lightbox",
    "reveal", "ai-summary", "code-copy", "adaptive-text", "swiper"
  ]);
  assert.equal(manifest.extensions.find(item => item.id === "services").config.siteInfoEndpoint, "https://example.com/?url={href}");
  assert.equal(manifest.extensions.find(item => item.id === "lightbox").when.selector.includes(".with-fancybox"), true);
  assert.equal(manifest.extensions.find(item => item.id === "lightbox").when.selector.includes(".custom"), true);
  assert.equal(Object.isFrozen(manifest), true);
  assert.equal(Object.isFrozen(manifest.extensions[0].config), true);
});

test("Runtime Manifest 按 profile/render 选择 AI、Math 与 diagrams", () => {
  const input = fixture({ profile: "post", render: { math: "mathjax", diagrams: { theme: "dark" } } });
  input.extensions.features.aiSummary.scope = "wiki";
  input.extensions.features.math = { provider: null, providers: { mathjax: { v3: true } } };
  const manifest = buildBrowserRuntimeManifest(input);
  const ids = manifest.extensions.map(item => item.id);
  assert.equal(ids.includes("ai-summary"), false);
  assert.equal(ids.includes("mathjax"), true);
  assert.equal(ids.includes("diagrams"), true);
  assert.equal(manifest.extensions.find(item => item.id === "diagrams").config.theme, "dark");
});

test("KaTeX 只由服务端输出配套 CSS，不建立浏览器 Extension", () => {
  const input = fixture({ render: { math: "katex" } });
  const manifest = buildBrowserRuntimeManifest(input);
  assert.equal(manifest.extensions.some(item => item.id === "katex"), false);
});

test("Runtime Manifest 序列化阻断 HTML/script 注入", () => {
  const manifest = buildBrowserRuntimeManifest(fixture({ comments: { service: "giscus", options: { value: "</script><script>alert(1)</script>&" } } }));
  const json = serializeBrowserRuntimeManifest(manifest);
  assert.doesNotMatch(json, /<\/script>/);
  assert.doesNotMatch(json, /&/);
  assert.equal(json.includes("\\u003c/script\\u003e"), true);
});

test("Runtime Manifest 拒绝非法 Extension 声明", () => {
  assert.throws(() => buildBrowserRuntimeManifest({ extensions: [], assets: {} }), /extensions must be an object/);
  assert.throws(() => buildBrowserRuntimeManifest({ extensions: {}, assets: [], render: {}, comments: {} }), /assets must be an object/);
});
