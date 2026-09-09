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
        card_hover: { spotlight: true, tilt: false },
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
  assert.equal(config.features.cardHover.spotlight, true);
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

test("内部资源冻结，资源提取保留上游选项且不修改输入", () => {
  const { splitResources } = require("../scripts/lib/resource-assets");
  assert.equal(Object.isFrozen(assets), true);
  const input = Object.freeze({ js: null, meta_css: "vendor/meta.css", upstream: true });
  assert.deepEqual(splitResources(input, { js: "/default.js" }, ["js", "meta_css"]), {
    options: { upstream: true }, assets: { js: "/default.js", metaCss: "/vendor/meta.css" }
  });
  assert.deepEqual(splitResources({ js: "/custom.js" }, { js: "/default.js" }, ["js"]).assets, { js: "/custom.js" });
});

test("资源字段复用安全校验，参数袋与配置实例保持隔离", () => {
  const parse = themeConfig => parseStellarConfig({ themeConfig });
  for (const js of ["", "javascript:alert(1)", 42]) {
    assert.throws(() => parse({ comments: { waline: { js } } }));
  }
  const configured = parse({ comments: { waline: { js: "/custom.js", upstream_name: true } } });
  assert.equal(configured.comments.waline.js, "/custom.js");
  assert.equal(configured.comments.waline.upstream_name, true);
  assert.notEqual(parse({}).comments.waline.js, "/custom.js");
  assert.equal(Object.isFrozen(configured.comments.waline), true);
});

test("评论资源使用最终服务地址及页面覆盖，不泄漏到上游选项", () => {
  const { resolveCommentsModel } = require("../scripts/lib/comments");
  const config = parseStellarConfig({ themeConfig: { comments: {
    provider: "artalk", artalk: { server: "https://example.com/old", js: "/old.js" }
  } } });
  for (const server of ["https://example.com/atk", "https://example.com/atk/"]) {
    const model = resolveCommentsModel(config, { options: { server, js: null } });
    assert.equal(model.assets.js, "https://example.com/atk/dist/Artalk.js");
    assert.equal(model.assets.css, "https://example.com/atk/dist/Artalk.css");
    assert.equal(model.options.js, undefined);
  }
  assert.equal(resolveCommentsModel(config, { options: { js: "/custom.js" } }).assets.js, "/custom.js");
});

test("样式地址与完整性配置成对合并", () => {
  const parse = katex => parseStellarConfig({ themeConfig: { features: { math: { katex } } } }).features.math.katex;
  const defaults = require("../scripts/schema/config-schema").CONFIG_DEFAULTS.features.math.katex;
  assert.equal(parse({}).css_integrity, defaults.css_integrity);
  assert.equal(parse({ css: null }).css_integrity, defaults.css_integrity);
  assert.equal(parse({ css: "/custom.css" }).css_integrity, null);
  assert.equal(parse({ css: "/custom.css", css_integrity: "sha384-custom" }).css_integrity, "sha384-custom");
  assert.equal(parse({ css_integrity: null }).css_integrity, null);
});
