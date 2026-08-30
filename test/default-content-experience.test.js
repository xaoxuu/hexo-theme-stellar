"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { buildBrowserRuntimeManifest } = require("../scripts/lib/browser-runtime");
const { parseStellarConfig } = require("../scripts/lib/config-schema");
const { parsePageConfig } = require("../scripts/lib/content-config");
const INTERNAL = require("../scripts/lib/internal-constants");
const { buildPostPageViewModel } = require("../scripts/lib/models");

test("Schema 默认值为无可选元数据 Post 提供完整确定性降级", () => {
  const stellarConfig = parseStellarConfig({ themeConfig: {}, siteConfig: { title: "Example" } });
  const viewModel = buildPostPageViewModel({
    source: "source/_posts/minimal.md",
    themeSource: "Stellar Schema defaults",
    siteConfig: { title: "Example", url: "https://example.com" },
    runtimeData: {},
    stellarConfig,
    frontMatter: parsePageConfig({ title: "Minimal" }, "source/_posts/minimal.md"),
    page: {
      _id: "minimal",
      source: "_posts/minimal.md",
      path: "minimal/",
      permalink: "https://example.com/minimal/",
      title: "Minimal",
      layout: "post",
      content: "<p>Plain paragraph.</p>",
      excerpt: "",
      tags: [],
      categories: []
    }
  });

  assert.equal(viewModel.item.title, "Minimal");
  assert.equal(viewModel.item.date, null);
  assert.deepEqual(viewModel.item.tags, []);
  assert.equal(viewModel.render.listing.excerpt, "Plain paragraph.");
  assert.equal(viewModel.render.listing.cover, "");
  assert.equal(viewModel.render.listing.authorId, "");
  assert.equal(viewModel.render.collection, undefined);
  assert.equal(viewModel.render.seo.title, "Minimal - Example");
  assert.equal(viewModel.render.seo.description, "Plain paragraph.");
  assert.deepEqual(viewModel.render.seo.keywords, []);
  assert.equal(viewModel.render.seo.jsonLd.image[0], stellarConfig.resources.fallbacks.cover);
  assert.equal(viewModel.render.article.footer.license, viewModel.item.presentation.footer.license);
  assert.equal(viewModel.render.article.comments.enabled, false);
  assert.equal(viewModel.item.navigation.menu, "post");
  assert.equal(Object.isFrozen(viewModel), true);
});

test("空配置 Runtime Manifest 保持冻结、版本化且 Extension 激活条件确定", () => {
  const config = parseStellarConfig({ themeConfig: {} });
  const manifest = buildBrowserRuntimeManifest({
    root: "/",
    extensions: config.extensions,
    assets: INTERNAL.assets,
    render: {},
    messages: {},
    comments: {},
    colorScheme: config.appearance.colorScheme
  });
  assert.equal(manifest.version, 1);
  assert.equal(manifest.root, "/");
  assert.deepEqual(manifest.extensions.map(item => item.id), [
    "search", "lazy-loading", "deferred-icons", "dropdown", "services", "settings",
    "link-prefetch", "lightbox", "reveal", "code-copy", "adaptive-text", "swiper"
  ]);
  assert.equal(manifest.extensions.every(item => (
    item.when.always === true || typeof item.when.selector === "string"
  )), true);
  assert.equal(Object.isFrozen(manifest), true);
});
