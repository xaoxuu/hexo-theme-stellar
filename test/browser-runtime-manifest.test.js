"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  RUNTIME_CONFIG_ID,
  RUNTIME_VERSION,
  buildBrowserRuntimeManifest,
  serializeBrowserRuntimeManifest
} = require("../scripts/lib/browser-runtime");
const INTERNAL_CONSTANTS = require("../scripts/lib/internal-constants");

function fixture(overrides = {}) {
  return Object.assign({
    root: "/docs",
    profile: "wiki",
    colorScheme: "auto",
    render: {},
    comments: { service: "giscus", options: { "data-repo": "x/y" }, pageTitle: "Docs" },
    messages: {
      copy: { idle: "Copy", success: "Copied!", denied: "Denied", unsupported: "Unsupported", toast: "Copied!" },
      colorScheme: { light: "Light", dark: "Dark", auto: "Auto" }
    },
    extensions: {
      search: { provider: "local", providers: { local: { indexPath: "/search.json", lazy: true } } },
      comments: {},
      services: { siteInfo: { provider: "site_info_api", providers: { site_info_api: { endpoint: "https://example.com/?url={href}" } } } },
      cache: { enabled: true, defaultTtl: 60, ttl: { siteinfo: 30 }, maxEntries: 20 },
      features: {
        colorSchemeSwitch: { enabled: false },
        linkPrefetch: { enabled: true },
        lightbox: { enabled: true, selector: ".custom" },
        reveal: { enabled: true },
        math: { provider: null, providers: {} },
        diagrams: { provider: null, providers: { mermaid: { theme: "neutral" } } },
        cardHover: { enabled: false },
        heti: { enabled: false }
      }
    },
    assets: {
      runtime: INTERNAL_CONSTANTS.assets.runtime,
      dependencies: { marked: "https://cdn.example/marked.js", lazyLoading: "https://cdn.example/lazy.js" },
      search: Object.assign({}, INTERNAL_CONSTANTS.assets.search, { algolia: "https://cdn.example/algolia.js" }),
      comments: { giscus: { js: "https://giscus.app/client.js" } },
      features: { linkPrefetch: "https://cdn.example/prefetch.js", lightbox: {}, codeCopy: {}, adaptiveText: {}, swiper: {} },
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
    "search", "lazy-loading", "deferred-icons", "dropdown", "services", "comments", "settings", "link-prefetch", "lightbox",
    "reveal", "code-copy", "adaptive-text", "swiper"
  ]);
  assert.equal(manifest.extensions.find(item => item.id === "services").config.siteInfoEndpoint, "https://example.com/?url={href}");
  assert.deepEqual(manifest.extensions.find(item => item.id === "search").config.assets, {
    client: null,
    provider: "/js/search/local-search.js",
    shortcut: "/js/search/shortcut.js"
  });
  assert.equal(manifest.extensions.find(item => item.id === "code-copy").config.messages.denied, "Denied");
  assert.equal(manifest.extensions.some(item => item.id === "ai-summary"), false);
  assert.equal(manifest.policy.cache.defaultTtl, 3600);
  assert.equal(manifest.policy.request.timeoutMs, 5000);
  assert.equal(manifest.extensions.find(item => item.id === "lightbox").when.selector.includes(".with-fancybox"), true);
  assert.equal(manifest.extensions.find(item => item.id === "lightbox").when.selector.includes(".custom"), true);
  const reveal = manifest.extensions.find(item => item.id === "reveal");
  assert.equal(reveal.module, "/js/runtime/extensions/reveal.mjs");
  assert.equal("asset" in reveal.config, false);
  assert.deepEqual(reveal.config, { feature: "reveal", enabled: true });
  assert.equal(Object.isFrozen(manifest), true);
  assert.equal(Object.isFrozen(manifest.extensions[0].config), true);
  assert.equal(Object.isFrozen(manifest.policy), true);
});

test("Runtime Manifest 按 render 选择 Math 与 diagrams", () => {
  const input = fixture({ profile: "post", render: { math: "mathjax", diagrams: { theme: "dark" } } });
  input.extensions.features.math = { provider: null, providers: { mathjax: {} } };
  const manifest = buildBrowserRuntimeManifest(input);
  const ids = manifest.extensions.map(item => item.id);
  assert.equal(ids.includes("mathjax"), true);
  assert.equal(ids.includes("diagrams"), true);
  assert.equal(manifest.extensions.find(item => item.id === "diagrams").config.theme, "dark");
});

test("Color Scheme Switch 仅在显式启用时进入 Runtime Manifest", () => {
  const disabled = buildBrowserRuntimeManifest(fixture());
  assert.equal(disabled.extensions.some(item => item.id === "color-scheme-switch"), false);

  const input = fixture();
  input.extensions.features.colorSchemeSwitch.enabled = true;
  const enabled = buildBrowserRuntimeManifest(input);
  const extension = enabled.extensions.find(item => item.id === "color-scheme-switch");
  assert.equal(extension.module, "/js/runtime/extensions/color-scheme-switch.mjs");
  assert.deepEqual(extension.when, { always: true });
  assert.deepEqual(extension.config.messages, { light: "Light", dark: "Dark", auto: "Auto" });
});

test("Runtime Manifest 不投影未选中的 Site Info provider 参数袋", () => {
  const input = fixture();
  input.extensions.services.siteInfo.provider = null;
  input.extensions.services.siteInfo.providers.site_info_api.endpoint = "https://unselected.example/?url={href}";
  const manifest = buildBrowserRuntimeManifest(input);
  const services = manifest.extensions.find(item => item.id === "services");
  assert.equal(services.config.siteInfoEndpoint, null);
  assert.doesNotMatch(JSON.stringify(manifest), /unselected\.example/);
});

test("KaTeX 只由服务端输出配套 CSS，不建立浏览器 Extension", () => {
  const input = fixture({ render: { math: "katex" } });
  const manifest = buildBrowserRuntimeManifest(input);
  assert.equal(manifest.extensions.some(item => item.id === "katex"), false);
});

test("render.diagrams=false 显式关闭全局 Mermaid provider", () => {
  const input = fixture({ render: { diagrams: false } });
  input.extensions.features.diagrams.provider = "mermaid";
  assert.equal(buildBrowserRuntimeManifest(input).extensions.some(item => item.id === "diagrams"), false);
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
