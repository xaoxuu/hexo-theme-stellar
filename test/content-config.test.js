"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  ContentConfigError,
  getCollectionId,
  isListed,
  isSearchable,
  parseCollectionConfig,
  parsePageConfig,
  validateCollectionProfileConfig,
  validatePageProfileConfig
} = require("../scripts/lib/content-config");
const { getProfileAdapter } = require("../scripts/lib/collection-pipeline/registry");
const { SHARE_SERVICE_IDS } = require("../scripts/lib/share-services");

test("Collection config normalizes public fields and freezes open parameter bags", () => {
  const parsed = parseCollectionConfig({
    name: "Docs",
    icon: "/docs.svg",
    cover: "/docs.webp",
    route: { path: "/wiki/docs/" },
    topbar: { enabled: true, brand: { name: "Docs", href: "/wiki/docs/" }, menu: [] },
    leftbar: {
      brand: { source: "collection", style: "compact", back_button: false, search: true },
      footer: { actions: [] },
      widgets: ["tree", { layout: "custom", option: true }]
    },
    rightbar: { enabled: false },
    comments: { provider: "custom", options: { nested_value: { enabled: true } } }
  }, "source/_data/wiki/docs.yml");
  assert.equal(parsed.route.path, "wiki/docs/");
  assert.equal(parsed.icon, "/docs.svg");
  assert.equal(parsed.cover, "/docs.webp");
  assert.equal(parsed.topbar.brand.name, "Docs");
  assert.deepEqual(parsed.leftbar.brand, {
    source: "collection",
    style: "compact",
    backButton: false,
    search: true
  });
  assert.equal(parsed.rightbar.enabled, false);
  assert.equal(parsed.comments.options.nested_value.enabled, true);
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(Object.isFrozen(parsed.comments.options), true);
});

test("Front Matter parser preserves Hexo fields and normalizes Stellar fields", () => {
  const parsed = parsePageConfig({
    title: "Page",
    date: "2026-08-23 00:00",
    collection: { profile: "wiki", id: "docs" },
    cover: "/page.webp",
    tagline: "Page tagline",
    render: { math: "katex" },
    seo: { open_graph: { image: "/cover.webp" } },
    inject: { head_end: "<meta name=\"example\">" }
  }, "source/wiki/docs/index.md");
  assert.equal(parsed.title, "Page");
  assert.deepEqual(parsed.collection, { profile: "wiki", id: "docs" });
  assert.equal(parsed.cover, "/page.webp");
  assert.equal(parsed.tagline, "Page tagline");
  assert.equal(parsed.seo.openGraph.image, "/cover.webp");
  assert.equal(parsed.inject.headEnd, "<meta name=\"example\">");
  assert.equal(Object.isFrozen(parsed), true);
});

test("Content override navigation is flat and Collection banner cascades through the public schema", () => {
  const collection = parseCollectionConfig({
    name: "Docs",
    active_menu: "wiki",
    breadcrumb: false,
    banner: { image: "/collection.webp", headline: "Collection" }
  }, "collection.yml");
  const page = parsePageConfig({
    active_menu: "post",
    breadcrumb: true,
    banner: { headline: "Page" }
  }, "page.md");
  assert.equal(collection.activeMenu, "wiki");
  assert.equal(collection.breadcrumb, false);
  assert.equal(collection.banner.image, "/collection.webp");
  assert.equal(page.activeMenu, "post");
  assert.equal(page.breadcrumb, true);
});

test("Content config rejects 1.44 fields with current migration targets", () => {
  assert.throws(
    () => parseCollectionConfig({ name: "Docs", title: "Legacy" }, "collection.yml"),
    /title 已移除，期望 name/
  );
  assert.throws(
    () => parsePageConfig({ wiki: "docs" }, "page.md"),
    /wiki 已移除，期望 collection\.id/
  );
});

test("Content footer share accepts only registered service IDs", () => {
  const collection = parseCollectionConfig({ name: "Docs", footer: { share: SHARE_SERVICE_IDS } }, "collection.yml");
  const page = parsePageConfig({ footer: { share: SHARE_SERVICE_IDS } }, "page.md");
  assert.deepEqual(collection.footer.share, SHARE_SERVICE_IDS);
  assert.deepEqual(page.footer.share, SHARE_SERVICE_IDS);
  assert.throws(
    () => parsePageConfig({ footer: { share: ["unknown"] } }, "page.md"),
    error => {
      assert.ok(error instanceof ContentConfigError);
      assert.equal(error.issues.some(issue => issue.path === "footer.share[0]" && issue.code === "invalid_value"), true);
      return true;
    }
  );
});

test("Collection registry capabilities reject profile fields without runtime consumers", () => {
  const validateCollection = (profile, config) => validateCollectionProfileConfig(
    parseCollectionConfig({ name: "Collection", ...config }, `${profile}.yml`),
    `${profile}.yml`,
    profile,
    getProfileAdapter(profile).config
  );
  validateCollection("wiki", { hero: { enabled: true }, listing: { priority: 1, order: 2 }, navigation: { tree: [] } });
  validateCollection("topic", { route: { path: "topic/example", start: "topic/example/start" }, listing: { excerpt_length: 80, sort: { field: "date", direction: "desc" } } });
  validateCollection("notebook", { listing: { order: 1, excerpt_length: 80, per_page: 10, sort: { field: "updated", direction: "desc" } } });
  assert.throws(() => validateCollection("topic", { hero: { enabled: true } }), /hero/);
  assert.throws(() => validateCollection("wiki", { route: { path: "wiki/example", start: "start" } }), /route\.start/);
  assert.throws(() => validateCollection("notebook", { navigation: { tree: [] } }), /navigation\.tree/);
  assert.throws(() => validateCollection("wiki", { listing: { excerpt_length: 80 } }), /listing\.excerpt_length/);

  for (const profile of ["post", "topic", "notebook"]) {
    validatePageProfileConfig({ listing: { priority: 1 } }, "page.md", profile, getProfileAdapter(profile).config);
  }
  assert.throws(
    () => validatePageProfileConfig({ listing: { priority: 1 } }, "page.md", "wiki", getProfileAdapter("wiki").config),
    /listing\.priority/
  );
  assert.throws(
    () => validatePageProfileConfig({ listing: { priority: 1 } }, "page.md", "page", null),
    /listing\.priority/
  );
});

test("Content regions distinguish inheritance from explicit empty lists", () => {
  const collection = parseCollectionConfig({ name: "Docs", rightbar: { widgets: ["toc"] } });
  const page = parsePageConfig({ leftbar: { widgets: [] } });
  assert.equal(collection.leftbar, undefined);
  assert.deepEqual(collection.rightbar.widgets, ["toc"]);
  assert.deepEqual(page.leftbar.widgets, []);
  assert.equal(page.rightbar, undefined);
});

test("Content Region schemas enforce fixed field value boundaries", () => {
  for (const [config, pattern] of [
    [{ name: "Docs", leftbar: { brand: "invalid" } }, /leftbar\.brand 应为 object \| boolean \| null/],
    [{ name: "Docs", leftbar: { footer: { actions: true } } }, /leftbar\.footer\.actions 应为 array \| null/]
  ]) {
    assert.throws(() => parseCollectionConfig(config, "collection.yml"), pattern);
  }
  for (const field of ["source", "back_button", "search"]) {
    assert.throws(
      () => parsePageConfig({ leftbar: { brand: { [field]: field === "source" ? "site" : true } } }, "page.md"),
      new RegExp(`leftbar\\.brand\\.${field}`)
    );
  }
  assert.throws(
    () => parseCollectionConfig({ name: "Docs", topbar: { brand: { style: "compact" } } }, "collection.yml"),
    /topbar\.brand\.style/
  );
  for (const [field, value] of [
    ["source", "profile"],
    ["style", "dense"],
    ["back_button", "yes"],
    ["search", "yes"]
  ]) {
    assert.throws(
      () => parseCollectionConfig({ name: "Docs", leftbar: { brand: { [field]: value } } }, "collection.yml"),
      new RegExp(`leftbar\\.brand\\.${field}`)
    );
  }
});

test("Content schemas aggregate unknown, type, enum, and range diagnostics", () => {
  assert.throws(() => parseCollectionConfig({
    name: "Docs",
    mystery: true,
    leftbar: { widgets: "tree" },
    listing: { priority: -1 }
  }, "collection.yml"), error => {
    assert.ok(error instanceof ContentConfigError);
    assert.match(error.message, /未知字段 mystery/);
    assert.match(error.message, /leftbar\.widgets 应为 array/);
    assert.match(error.message, /number >= 0/);
    return true;
  });
  assert.throws(
    () => parsePageConfig({ collection: { profile: "unknown", id: "" } }),
    /collection\.profile.*wiki \| topic \| notebook/
  );
});

test("Content config recovery omits invalid overrides and filters invalid list items", () => {
  const issues = [];
  const collection = parseCollectionConfig({
    name: "Docs",
    mystery: true,
    article: { style: "unsupported" },
    leftbar: { widgets: ["tree", 42] },
    listing: { priority: -1 }
  }, "collection.yml", {
    mode: "recover",
    onIssues: current => issues.push(...current)
  });
  assert.equal(collection.mystery, undefined);
  assert.deepEqual(collection.article, {});
  assert.deepEqual(collection.leftbar.widgets, ["tree"]);
  assert.deepEqual(collection.listing, {});
  assert.equal(issues.some(item => item.path === "leftbar.widgets[1]"), true);

  const allInvalid = parsePageConfig({ leftbar: { widgets: [42] } }, "page.md", { mode: "recover" });
  const explicitEmpty = parsePageConfig({ leftbar: { widgets: [] } }, "page.md", { mode: "recover" });
  assert.deepEqual(allInvalid.leftbar, {});
  assert.deepEqual(explicitEmpty.leftbar.widgets, []);
});

test("Content config recovery keeps structural identity failures fatal", () => {
  const issues = [];
  assert.throws(
    () => parsePageConfig({ collection: { profile: "wiki" }, article: { style: "unsupported" } }, "page.md", {
      mode: "recover",
      onIssues: current => issues.push(...current)
    }),
    error => error instanceof ContentConfigError && error.issues.length === 1 && error.issues[0].path === "collection.id"
  );
  assert.equal(issues.some(item => item.path === "article.style"), true);
  assert.throws(
    () => parseCollectionConfig({ route: { path: "docs" } }, "collection.yml", { mode: "recover" }),
    /缺少必填字段 name/
  );
});

test("Content visibility and ownership helpers keep independent semantics", () => {
  const page = { collection: { profile: "wiki", id: "docs" } };
  assert.equal(getCollectionId(page, "wiki"), "docs");
  assert.equal(getCollectionId(page, "topic"), null);
  assert.equal(isListed({ visibility: { listed: false, searchable: true } }), false);
  assert.equal(isSearchable({ visibility: { listed: false, searchable: true } }), true);
  assert.equal(isListed({}), true);
  assert.equal(isSearchable({}), true);
});
