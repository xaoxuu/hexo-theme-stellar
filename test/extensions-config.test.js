"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { parseStellarConfig } = require("../scripts/lib/config-schema");
const assets = require("../scripts/lib/internal-constants").assets;
const { resolveServiceProvider } = require("../scripts/lib/service-provider");

test("Extension 顶层配置与 provider 参数投影为扁平运行时", () => {
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      search: { provider: "algolia", algolia: { appId: "app", apiKey: "key", indexName: "docs" } },
      comments: { provider: "giscus", title: "讨论", giscus: { "data-repo": "owner/repo", customOption: true } },
      tags: {
        emoji: { default_source: "qq", sources: { qq: "https://example.com/{name}.gif" } },
        gallery: { aspect_ratio: "portrait" }
      },
      features: {
        reveal: { enabled: false },
        link_prefetch: { enabled: false },
        diagrams: { provider: "mermaid", mermaid: { theme: "dark" } },
        card_hover: { enabled: true },
        heti: { enabled: true }
      },
      services: {
        site_info: { site_info_api: { endpoint: "https://example.com/site?url={href}" } },
        contributors: { github: { repositories: [{ source_prefix: "wiki/", repository: "owner/docs", branch: "v2" }] } },
        github: { raw_url: "https://raw.example.com" },
        github_card: { github_readme_stats: { endpoint: "https://cards.example.com" } }
      }
    }
  });

  assert.equal(config.search.algolia.appId, "app");
  assert.equal(config.comments.giscus["data-repo"], "owner/repo");
  assert.equal(config.comments.giscus.customOption, true);
  assert.equal(config.tags.emoji.defaultSource, "qq");
  assert.equal(config.tags.gallery.aspectRatio, "portrait");
  assert.equal(config.features.diagrams.mermaid.theme, "dark");
  assert.equal(config.features.cardHover.enabled, true);
  assert.equal(resolveServiceProvider(config.services.siteInfo).endpoint, "https://example.com/site?url={href}");
  assert.equal(resolveServiceProvider(config.services.contributors).repositories[0].repository, "owner/docs");
  assert.equal(resolveServiceProvider(config.services.githubCard).endpoint, "https://cards.example.com");
  assert.equal(Object.isFrozen(config.comments.giscus), true);
});

test("自部署服务提供默认值，并保留自定义与显式关闭", () => {
  const defaults = parseStellarConfig({ themeConfig: {} });
  assert.equal(resolveServiceProvider(defaults.services.siteInfo).endpoint, "https://api.xaox.cc/site_info/v1?url={href}");
  assert.equal(resolveServiceProvider(defaults.services.rating).endpoint, "https://star-vote.xaox.cc/api/rating");
  assert.equal(resolveServiceProvider(defaults.services.vote).endpoint, "https://star-vote.xaox.cc/api/vote");
  assert.equal(Object.isFrozen(resolveServiceProvider(defaults.services.contributors).repositories), true);

  const configured = parseStellarConfig({
    themeConfig: {
      services: {
        site_info: { provider: null },
        rating: { star_vote: { endpoint: "https://rating.example.com" } },
        vote: { provider: null }
      }
    }
  });
  assert.equal(resolveServiceProvider(configured.services.siteInfo), null);
  assert.equal(resolveServiceProvider(configured.services.rating).endpoint, "https://rating.example.com");
  assert.equal(resolveServiceProvider(configured.services.vote), null);
});

test("服务 resolver 读取选中 provider 的同级参数袋", () => {
  const selected = { provider: "second", first: { endpoint: "https://first.example" }, second: { endpoint: "https://second.example" } };
  assert.deepEqual(resolveServiceProvider(selected), { endpoint: "https://second.example" });
  assert.equal(resolveServiceProvider({ ...selected, provider: null }), null);
  assert.equal(resolveServiceProvider({ ...selected, provider: "missing" }), null);
});

test("Extension 规则拒绝非法枚举、URL、Emoji 与 contributor", () => {
  const parse = themeConfig => parseStellarConfig({ source: "_config.stellar.yml", themeConfig });
  assert.throws(() => parse({ search: { provider: "local_search" } }), /search\.provider 的值不在/);
  assert.throws(() => parse({ services: { rating: { star_vote: { endpoint: "rating.example.com" } } } }), /absolute HTTP\(S\) URL/);
  assert.throws(() => parse({ services: { site_info: { provider: "unknown" } } }), /services\.site_info\.provider 的值不在/);
  assert.throws(() => parse({ tags: { emoji: { default_source: "missing" } } }), /key declared in emoji\.sources/);
  assert.throws(() => parse({ tags: { emoji: { sources: { blobcat: "https:\/\/cdn.example\/fixed.gif" } } } }), /containing \{name\}/);
  assert.throws(() => parse({ services: { contributors: { github: { repositories: [{ source_prefix: "wiki/", repository: "invalid" }] } } } }), /GitHub owner\/repository/);
  assert.throws(() => parse({ comments: { mystery: {} } }), /未知字段 comments\.mystery/);
});

test("第三方参数袋开放，主题服务参数对象保持封闭", () => {
  const open = parseStellarConfig({
    themeConfig: {
      search: { provider: "algolia", algolia: { arbitraryUpstreamOption: true } },
      comments: { provider: "giscus", giscus: { arbitraryUpstreamOption: true } },
      features: { math: { provider: "mathjax", mathjax: { arbitraryUpstreamOption: true } } }
    }
  });
  assert.equal(open.search.algolia.arbitraryUpstreamOption, true);
  assert.equal(open.comments.giscus.arbitraryUpstreamOption, true);
  assert.equal(open.features.math.mathjax.arbitraryUpstreamOption, true);
  assert.throws(
    () => parseStellarConfig({ themeConfig: { services: { rating: { star_vote: { endpoint: "https://rating.example", mystery: true } } } } }),
    /未知字段 services\.rating\.star_vote\.mystery/
  );
});

test("官方 Extension 资源由内部冻结注册表提供", () => {
  assert.equal(Object.isFrozen(assets), true);
  assert.match(assets.dependencies.marked, /marked/);
  assert.match(assets.comments.giscus.js, /giscus\.app/);
  assert.match(assets.features.lightbox.js, /fancybox/);
  assert.equal(assets.features.reveal, undefined);
  assert.equal(assets.runtime.bootstrap, "/js/runtime/index.js");
  assert.equal(assets.runtime.reveal, "/js/runtime/extensions/reveal.js");
  assert.equal(assets.services.siteinfo.js, "/js/services/siteinfo.js");
});
