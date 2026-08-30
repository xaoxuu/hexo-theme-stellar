"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const attachConfig = require("../scripts/events/lib/config-schema");
const { ConfigSchemaError, parseStellarConfig } = require("../scripts/lib/config-schema");
const { toRenderRegions } = require("../scripts/lib/layout-config");
const { resolveServiceProvider } = require("../scripts/lib/service-provider");

const ROOT_KEYS = [
  "brand", "menu", "settings", "footer", "topbar", "leftbar", "rightbar", "profiles", "article", "notebook",
  "appearance", "canonical", "openGraph", "structuredData", "preconnect", "fallbacks",
  "errorPage", "search", "comments", "tags", "features", "services", "inject"
];

function assertDeepFrozen(value) {
  if (value == null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  Object.values(value).forEach(assertDeepFrozen);
}

function issueFor(error, path, code) {
  assert.ok(error instanceof ConfigSchemaError);
  assert.equal(error.issues.some(issue => issue.path === path && issue.code === code), true);
  return true;
}

test("手写 _config.yml 提供适度扁平的完整默认对象并深度冻结", () => {
  const config = parseStellarConfig({ source: "themes/stellar/_config.yml", themeConfig: {} });
  assert.deepEqual(Object.keys(config), ROOT_KEYS);
  assert.equal(config.brand.name, null);
  assert.equal(config.appearance.preset, "card");
  assert.equal(config.appearance.colorScheme, "auto");
  assert.deepEqual(config.topbar.widgets, []);
  assert.deepEqual(config.rightbar.widgets, []);
  assert.deepEqual(config.profiles.wiki.topbar.widgets, []);
  assert.equal(config.profiles.wiki.activeMenu, "wiki");
  assert.equal(config.profiles.wiki.leftbar.footerActions, false);
  assert.equal("site" in config, false);
  assert.equal("layout" in config, false);
  assert.equal("extensions" in config, false);
  assert.equal(config.inject.headEnd, "");
  assertDeepFrozen(config);
});

test("用户覆盖只做 snake_case 到 camelCase，数组整体替换", () => {
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      preconnect: ["https://cdn.example.com"],
      article: { listing: { excerpt_length: 42 } },
      profiles: { post: { rightbar: { widgets: [] } } },
      services: {
        site_info: {
          provider: "site_info_api",
          site_info_api: { endpoint: "https://example.com/site?url={href}" }
        }
      }
    }
  });
  assert.deepEqual(config.preconnect, ["https://cdn.example.com"]);
  assert.equal(config.article.listing.excerptLength, 42);
  assert.deepEqual(config.profiles.post.rightbar.widgets, []);
  assert.equal(config.services.siteInfo.provider, "site_info_api");
  assert.equal(config.services.siteInfo.site_info_api.endpoint, "https://example.com/site?url={href}");
});

test("合法 null 保留语义，非 nullable 空键回退默认值", () => {
  const config = parseStellarConfig({
    themeConfig: {
      canonical: { host: null },
      search: { provider: null },
      profiles: { post: { topbar: { widgets: null } } },
      appearance: { shape: { corner: null } }
    }
  });
  assert.equal(config.canonical.host, null);
  assert.equal(config.search.provider, null);
  assert.equal(config.profiles.post.topbar.widgets, null);
  assert.equal(config.appearance.shape.corner, "superellipse(1.25)");
});

test("顶层封闭并直接拒绝已删除的分组根和未知字段", () => {
  for (const root of ["site", "layout", "content", "seo", "resources", "extensions"]) {
    assert.throws(
      () => parseStellarConfig({ themeConfig: { [root]: {} } }),
      error => issueFor(error, root, "unknown_field")
    );
  }
  assert.throws(
    () => parseStellarConfig({ themeConfig: { unknown: true } }),
    error => issueFor(error, "unknown", "unknown_field")
  );
});

test("类型、枚举和特殊 validator 由轻量规则表约束", () => {
  assert.throws(
    () => parseStellarConfig({ themeConfig: { appearance: { preset: "unknown" } } }),
    error => issueFor(error, "appearance.preset", "invalid_value")
  );
  assert.throws(
    () => parseStellarConfig({ themeConfig: { article: { listing: { excerpt_length: -1 } } } }),
    error => issueFor(error, "article.listing.excerpt_length", "invalid_value")
  );
  assert.throws(
    () => parseStellarConfig({ themeConfig: { preconnect: "https://example.com" } }),
    error => issueFor(error, "preconnect", "invalid_type")
  );
});

test("动态记录受约束，第三方参数袋原样保留", () => {
  const config = parseStellarConfig({
    themeConfig: {
      article: { category_colors: { Demo: "#123456" } },
      comments: {
        provider: "giscus",
        giscus: { "data-repo": "owner/repo", custom_upstream_key: { nested_value: true } }
      }
    }
  });
  assert.deepEqual(config.article.categoryColors, { "探索号": "#f44336", Demo: "#123456" });
  assert.deepEqual(config.comments.giscus.custom_upstream_key, { nested_value: true });
  assert.throws(
    () => parseStellarConfig({ themeConfig: { article: { category_colors: { Demo: "not-a-color" } } } }),
    error => issueFor(error, "article.category_colors.Demo", "invalid_value")
  );
});

test("Region 对象、Profile 继承与显式清空保持一致", () => {
  const config = parseStellarConfig({
    themeConfig: {
      topbar: { widgets: ["site_brand", "menu"] },
      leftbar: { footer_actions: true, widgets: ["recent"] },
      rightbar: { widgets: ["toc"] },
      profiles: {
        post: { rightbar: { widgets: [] } },
        page: { leftbar: { footer_actions: false } }
      }
    }
  });
  assert.deepEqual(toRenderRegions(config, config.profiles.post), {
    topbar: { widgets: ["site_brand", "menu"] },
    leftbar: {
      enabled: true,
      brand: "site_brand",
      menu: true,
      footer: { actions: true },
      widgets: ["related", "recent"]
    },
    rightbar: { widgets: [] }
  });
  assert.equal(toRenderRegions(config, config.profiles.page).leftbar.footer.actions, false);
});

test("旧 regions 包装和 Region 数组简写提供明确迁移诊断", () => {
  assert.throws(
    () => parseStellarConfig({ themeConfig: { regions: { topbar: ["menu"] } } }),
    error => issueFor(error, "regions", "removed_field")
  );
  assert.throws(
    () => parseStellarConfig({ themeConfig: { topbar: ["menu"] } }),
    error => issueFor(error, "topbar", "invalid_type")
  );
  assert.throws(
    () => parseStellarConfig({ themeConfig: { profiles: { post: { rightbar: ["toc"] } } } }),
    error => issueFor(error, "profiles.post.rightbar", "invalid_type")
  );
  assert.throws(
    () => parseStellarConfig({ themeConfig: { profiles: { post: { regions: { rightbar: { widgets: ["toc"] } } } } } }),
    error => issueFor(error, "profiles.post.regions", "removed_field")
  );
});

test("Search、Comments、Feature 与 Service provider 直接读取同级参数", () => {
  const config = parseStellarConfig({
    themeConfig: {
      search: { provider: "algolia", algolia: { appId: "app", arbitrary: true } },
      comments: { provider: "artalk", artalk: { server: "https://comments.example.com" } },
      features: {
        math: { provider: "mathjax", mathjax: { tex: { inlineMath: [["$", "$"]] } } },
        diagrams: { provider: "mermaid", mermaid: { theme: "dark" } }
      },
      services: {
        rating: { provider: "star_vote", star_vote: { endpoint: "https://example.com/rating" } }
      }
    }
  });
  assert.equal(config.search.algolia.arbitrary, true);
  assert.equal(config.comments.artalk.server, "https://comments.example.com");
  assert.deepEqual(config.features.math.mathjax.tex.inlineMath, [["$", "$"]]);
  assert.equal(config.features.diagrams.mermaid.theme, "dark");
  assert.equal(resolveServiceProvider(config.services.rating).endpoint, "https://example.com/rating");
  assert.equal("providers" in config.services.rating, false);
});

test("构建事件把适度扁平的冻结配置挂载到 hexo.stellar.config", () => {
  const ctx = { config: { theme_config: { appearance: { preset: "minimal" } } } };
  attachConfig(ctx);
  assert.equal(ctx.stellar.config.appearance.preset, "minimal");
  assert.equal(Object.isFrozen(ctx.stellar.config), true);
});
