"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const attachConfig = require("../scripts/events/lib/config-schema");
const { ConfigSchemaError, parseStellarConfig } = require("../scripts/lib/config-schema");
const { toRenderRegions } = require("../scripts/lib/layout-config");

function assertDeepFrozen(value) {
  if (value == null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  Object.values(value).forEach(assertDeepFrozen);
}

function hasIssue(error, path, code) {
  assert.ok(error instanceof ConfigSchemaError);
  assert.equal(error.issues.some(issue => issue.path === path && issue.code === code), true);
  return true;
}

test("Theme config loads complete frozen defaults", () => {
  const config = parseStellarConfig({ source: "themes/stellar/_config.yml", themeConfig: {} });
  for (const key of ["brand", "profiles", "article", "appearance", "features", "services"]) {
    assert.equal(Object.hasOwn(config, key), true, key);
  }
  assertDeepFrozen(config);
});

test("Theme config normalizes overrides without mutating open provider bags", () => {
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      preconnect: ["https://cdn.example.com"],
      article: { listing: { excerpt_length: 42 } },
      comments: {
        provider: "giscus",
        giscus: { "data-repo": "owner/repo", nested_option: { enabled: true } }
      },
      canonical: { host: null }
    }
  });
  assert.deepEqual(config.preconnect, ["https://cdn.example.com"]);
  assert.equal(config.article.listing.excerptLength, 42);
  assert.deepEqual(config.comments.giscus.nested_option, { enabled: true });
  assert.equal(config.canonical.host, null);
});

test("Theme config rejects unknown, mistyped, and unsafe values with sourced issues", () => {
  assert.throws(
    () => parseStellarConfig({ source: "custom.yml", themeConfig: { unknown: true } }),
    error => hasIssue(error, "unknown", "unknown_field")
  );
  assert.throws(
    () => parseStellarConfig({ themeConfig: { preconnect: "https://example.com" } }),
    error => hasIssue(error, "preconnect", "invalid_type")
  );
  assert.throws(
    () => parseStellarConfig({ themeConfig: { appearance: { colors: { primary: "red; display:none" } } } }),
    error => hasIssue(error, "appearance.colors.primary", "invalid_value")
  );
});

test("Theme config recovery warns, keeps valid list items, and replaces unsafe overrides", () => {
  const issues = [];
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    mode: "recover",
    onIssues: current => issues.push(...current),
    themeConfig: {
      unknown: true,
      appearance: { preset: "unsupported", colors: { primary: "red; display:none" } },
      article: { category_colors: { "release.v2": "red; display:none", stable: "blue" } },
      menu: {
        items: [
          { id: "home", title: "Home", url: "/" },
          { id: "unsafe", title: "Unsafe", url: "javascript:alert(1)" },
          { type: "search" },
          { type: "search" }
        ]
      }
    }
  });
  assert.equal(config.appearance.preset, "card");
  assert.equal(config.appearance.colors.primary, "hsl(192 98% 55%)");
  assert.equal(config.article.categoryColors.stable, "blue");
  assert.equal(config.article.categoryColors["release.v2"], undefined);
  assert.deepEqual(config.menu.items.map(item => item.type || item.id), ["home", "search"]);
  assert.equal(config.profiles.home.activeMenu, null);
  assert.equal(issues.some(item => item.path === "unknown" && item.action === "忽略字段"), true);
  assert.equal(issues.some(item => item.path === "menu.items[1].url" && item.action === "忽略无效列表项"), true);
  assert.equal(issues.some(item => item.path === "appearance.colors.primary" && item.action === "使用默认值或上一层有效配置"), true);
});

test("Region inheritance preserves explicit overrides and empty lists", () => {
  const config = parseStellarConfig({
    themeConfig: {
      topbar: { widgets: ["site_brand", "menu"] },
      rightbar: { widgets: ["toc"] },
      profiles: { post: { rightbar: { widgets: [] } } }
    }
  });
  const regions = toRenderRegions(config, config.profiles.post);
  assert.deepEqual(regions.topbar.widgets, ["site_brand", "menu"]);
  assert.deepEqual(regions.rightbar.widgets, []);
});

test("Build config event exposes one frozen runtime config", () => {
  const ctx = { config: { theme_config: { appearance: { preset: "minimal" } } } };
  attachConfig(ctx);
  assert.equal(ctx.stellar.config.appearance.preset, "minimal");
  assert.equal(Object.isFrozen(ctx.stellar.config), true);
});

test("Build config event logs one grouped warning and exposes recovered config", () => {
  const warnings = [];
  const ctx = {
    config: { theme_config: { mystery: true, appearance: { preset: "unsupported" } } },
    log: { warn(message) { warnings.push(message); } }
  };
  attachConfig(ctx);
  assert.equal(ctx.stellar.config.appearance.preset, "card");
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /已忽略 2 项不支持的配置/);
  assert.match(warnings[0], /mystery/);
  assert.match(warnings[0], /appearance\.preset/);
});
