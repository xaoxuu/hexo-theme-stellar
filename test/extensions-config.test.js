"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { parseStellarConfig } = require("../scripts/lib/config-schema");
const assets = require("../scripts/lib/extension-assets");

test("Extension 配置使用最终路径并投影 camelCase 运行时", () => {
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      extensions: {
        search: {
          provider: "algolia",
          providers: { algolia: { appId: "app", apiKey: "key", indexName: "docs" } }
        },
        comments: {
          provider: "giscus",
          title: "讨论",
          providers: { giscus: { "data-repo": "owner/repo", customOption: true } }
        },
        tags: { timeline: { max_height: "60vh" }, chat: { endpoint: "https://example.com/chat" } },
        features: {
          reveal: { enabled: false, distance: "12px" },
          ai_summary: { enabled: true, max_length: 800 },
          card_hover: { enabled: true, max_tilt: 0 }
        },
        services: {
          site_info: { endpoint: "https://example.com/site?url={href}" },
          github: { raw_url: "https://raw.example.com" }
        },
        cache: { enabled: false, ttl: { custom_service: 42 }, max_entries: 0 }
      }
    }
  });

  assert.equal(config.extensions.search.provider, "algolia");
  assert.equal(config.extensions.search.providers.algolia.appId, "app");
  assert.equal(config.extensions.comments.providers.giscus["data-repo"], "owner/repo");
  assert.equal(config.extensions.comments.providers.giscus.customOption, true);
  assert.equal(config.extensions.tags.timeline.maxHeight, "60vh");
  assert.equal(config.extensions.tags.chat.endpoint, "https://example.com/chat");
  assert.equal(config.extensions.features.reveal.enabled, false);
  assert.equal(config.extensions.features.aiSummary.maxLength, 800);
  assert.equal(config.extensions.features.cardHover.maxTilt, 0);
  assert.equal(config.extensions.services.siteInfo.endpoint, "https://example.com/site?url={href}");
  assert.equal(config.extensions.services.github.rawUrl, "https://raw.example.com");
  assert.equal(config.extensions.cache.enabled, false);
  assert.equal(config.extensions.cache.ttl.custom_service, 42);
  assert.equal(config.extensions.cache.maxEntries, 0);
  assert.equal(Object.isFrozen(config.extensions), true);
  assert.equal(Object.isFrozen(config.extensions.comments.providers.giscus), true);
});

test("Extension Schema 拒绝旧根、旧命名、未知能力和官方资源覆盖", () => {
  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      search: { service: "local_search" },
      comments: { service: "giscus" },
      plugins: { fancybox: { enable: true } },
      data_services: { siteinfo: { api: "https://example.com" } },
      data_cache: { enable: true },
      api_host: { ghraw: "raw.example.com" },
      extensions: {
        search: { provider: "local_search" },
        comments: {
          provider: "unknown_comments",
          custom_css: "giscus",
          providers: {
            giscus: { src: "https://example.com/client.js" },
            waline: { meta_css: "https://example.com/waline-meta.css" }
          }
        },
        features: {
          lightbox: { provider: "unknown_lightbox", js: "https://example.com/lightbox.js" },
          reveal: { provider: "unknown_reveal" },
          ai_summary: { provider: "unknown_ai" },
          math: { providers: { katex: { inject: "<script></script>" } } },
          diagrams: { provider: "unknown_diagrams" },
          mystery: { enabled: true }
        },
        services: {
          site_info: { js: "/siteinfo.js" },
          github: { api_url: "api.github.com" }
        }
      }
    }
  }), error => {
    assert.match(error.message, /search 已移除，期望 extensions\.search/);
    assert.match(error.message, /comments 已移除，期望 extensions\.comments/);
    assert.match(error.message, /plugins 已移除，期望 extensions\.features/);
    assert.match(error.message, /data_services 已移除，期望 extensions\.services/);
    assert.match(error.message, /data_cache 已移除，期望 extensions\.cache/);
    assert.match(error.message, /api_host 已移除，期望 extensions\.services\.github/);
    assert.match(error.message, /extensions\.search\.provider 的值不在/);
    assert.match(error.message, /extensions\.comments\.provider 的值不在/);
    assert.match(error.message, /extensions\.comments\.custom_css 已移除/);
    assert.match(error.message, /extensions\.comments\.providers\.giscus\.src 已移除/);
    assert.match(error.message, /extensions\.comments\.providers\.waline\.meta_css 已移除/);
    assert.match(error.message, /extensions\.features\.lightbox\.js 已移除/);
    assert.match(error.message, /extensions\.features\.lightbox\.provider 的值不在/);
    assert.match(error.message, /extensions\.features\.reveal\.provider 的值不在/);
    assert.match(error.message, /extensions\.features\.ai_summary\.provider 的值不在/);
    assert.match(error.message, /extensions\.features\.math\.providers\.katex\.inject 已移除/);
    assert.match(error.message, /extensions\.features\.diagrams\.provider 的值不在/);
    assert.match(error.message, /未知字段 extensions\.features\.mystery/);
    assert.match(error.message, /未知字段 extensions\.services\.site_info\.js/);
    assert.match(error.message, /extensions\.services\.github\.api_url 的值不在 absolute HTTP\(S\) URL 中/);
    return true;
  });
});

test("Algolia 参数袋保留上游键但拒绝官方资源覆盖", () => {
  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      extensions: {
        search: {
          provider: "algolia",
          providers: {
            algolia: { appId: "app", apiKey: "key", indexName: "docs", js: "https://example.com/algolia.js" }
          }
        }
      }
    }
  }), /extensions\.search\.providers\.algolia\.js 已移除/);
});

test("官方 Extension 资源由内部冻结注册表提供", () => {
  assert.equal(Object.isFrozen(assets), true);
  assert.match(assets.dependencies.marked, /marked/);
  assert.match(assets.comments.giscus.js, /giscus\.app/);
  assert.match(assets.features.lightbox.js, /fancybox/);
  assert.match(assets.features.reveal, /scrollreveal/);
  assert.equal(assets.services.siteinfo.js, "/js/services/siteinfo.js");
});
