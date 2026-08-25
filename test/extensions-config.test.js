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
        tags: {
          emoji: { default_source: "qq", sources: { qq: "https://example.com/{name}.gif" } },
          gallery: { aspect_ratio: "portrait" }
        },
        features: {
          reveal: { enabled: false, distance: "12px", duration_ms: 800 },
          link_prefetch: { enabled: false },
          diagrams: { provider: "mermaid", providers: { mermaid: { theme: "dark" } } },
          card_hover: { enabled: true },
          heti: { enabled: true }
        },
        services: {
          site_info: { endpoint: "https://example.com/site?url={href}" },
          contributors: { repositories: [{ source_prefix: "wiki/", repository: "owner/docs", branch: "v2" }] },
          github: { raw_url: "https://raw.example.com" },
          github_card: { endpoint: "https://cards.example.com" }
        }
      }
    }
  });

  assert.equal(config.extensions.search.provider, "algolia");
  assert.equal(config.extensions.search.providers.algolia.appId, "app");
  assert.equal(config.extensions.comments.providers.giscus["data-repo"], "owner/repo");
  assert.equal(config.extensions.comments.providers.giscus.customOption, true);
  assert.equal(config.extensions.tags.emoji.defaultSource, "qq");
  assert.equal(config.extensions.tags.emoji.sources.qq, "https://example.com/{name}.gif");
  assert.equal(config.extensions.tags.gallery.aspectRatio, "portrait");
  assert.equal(config.extensions.features.reveal.enabled, false);
  assert.equal(config.extensions.features.reveal.durationMs, 800);
  assert.equal(config.extensions.features.linkPrefetch.enabled, false);
  assert.equal(config.extensions.features.diagrams.provider, "mermaid");
  assert.equal(config.extensions.features.cardHover.enabled, true);
  assert.equal(config.extensions.features.heti.enabled, true);
  assert.equal(config.extensions.services.siteInfo.endpoint, "https://example.com/site?url={href}");
  assert.equal(config.extensions.services.contributors.repositories[0].repository, "owner/docs");
  assert.equal(config.extensions.services.github.rawUrl, "https://raw.example.com");
  assert.equal(config.extensions.services.githubCard.endpoint, "https://cards.example.com");
  assert.equal("cache" in config.extensions, false);
  assert.equal(Object.isFrozen(config.extensions), true);
  assert.equal(Object.isFrozen(config.extensions.comments.providers.giscus), true);
});

test("自部署服务提供公共默认值，并保留自定义与显式关闭", () => {
  const defaults = parseStellarConfig({ source: "_config.stellar.yml", themeConfig: {} });
  assert.equal(defaults.extensions.services.siteInfo.endpoint, "https://api.xaox.cc/site_info/v1?url={href}");
  assert.equal(defaults.extensions.services.rating.endpoint, "https://star-vote.xaox.cc/api/rating");
  assert.equal(defaults.extensions.services.vote.endpoint, "https://star-vote.xaox.cc/api/vote");

  const configured = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      extensions: {
        services: {
          site_info: { endpoint: null },
          rating: { endpoint: "https://rating.example.com" },
          vote: { endpoint: null }
        }
      }
    }
  });
  assert.equal(configured.extensions.services.siteInfo.endpoint, null);
  assert.equal(configured.extensions.services.rating.endpoint, "https://rating.example.com");
  assert.equal(configured.extensions.services.vote.endpoint, null);
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
    assert.match(error.message, /data_cache 已移除，期望 internalized/);
    assert.match(error.message, /api_host 已移除，期望 extensions\.services\.github/);
    assert.match(error.message, /extensions\.search\.provider 的值不在/);
    assert.match(error.message, /extensions\.comments\.provider 的值不在/);
    assert.match(error.message, /extensions\.comments\.custom_css 已移除/);
    assert.match(error.message, /extensions\.comments\.providers\.giscus\.src 已移除/);
    assert.match(error.message, /extensions\.comments\.providers\.waline\.meta_css 已移除/);
    assert.match(error.message, /extensions\.features\.lightbox\.js 已移除/);
    assert.match(error.message, /extensions\.features\.lightbox\.provider 已移除/);
    assert.match(error.message, /extensions\.features\.reveal\.provider 已移除/);
    assert.match(error.message, /extensions\.features\.ai_summary 已移除/);
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

test("Extension 最终字段执行 endpoint、Emoji 与 contributors 严格校验", () => {
  const parse = themeConfig => parseStellarConfig({ source: "_config.stellar.yml", themeConfig });
  assert.throws(() => parse({ extensions: { services: { rating: { endpoint: "rating.example.com" } } } }), /absolute HTTP\(S\) URL/);
  assert.throws(() => parse({ extensions: { tags: { emoji: { default_source: "qq", sources: { blobcat: "https:\/\/cdn.example\/{name}.gif" } } } } }), /key declared in emoji\.sources/);
  assert.throws(() => parse({ extensions: { tags: { emoji: { sources: { blobcat: "https:\/\/cdn.example\/fixed.gif" } } } } }), /containing \{name\}/);
  assert.throws(() => parse({ extensions: { services: { contributors: { repositories: [{ source_prefix: "wiki/", repository: "invalid" }] } } } }), /GitHub owner\/repository/);
  assert.throws(() => parse({ extensions: { comments: { providers: { mystery: {} } } } }), /未知字段 extensions\.comments\.providers\.mystery/);
});
