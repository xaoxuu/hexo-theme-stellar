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
