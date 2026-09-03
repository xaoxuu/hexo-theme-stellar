"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  ContentConfigError,
  getCollectionId,
  isListed,
  isSearchable,
  parseCollectionConfig,
  parsePageConfig
} = require("../scripts/lib/content-config");

test("Collection config normalizes public fields and freezes open parameter bags", () => {
  const parsed = parseCollectionConfig({
    name: "Docs",
    route: { path: "/wiki/docs/" },
    leftbar: { widgets: ["tree", { layout: "custom", option: true }] },
    comments: { provider: "custom", options: { nested_value: { enabled: true } } }
  }, "source/_data/wiki/docs.yml");
  assert.equal(parsed.route.path, "wiki/docs/");
  assert.equal(parsed.comments.options.nested_value.enabled, true);
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(Object.isFrozen(parsed.comments.options), true);
});

test("Front Matter parser preserves Hexo fields and normalizes Stellar fields", () => {
  const parsed = parsePageConfig({
    title: "Page",
    date: "2026-08-23 00:00",
    collection: { profile: "wiki", id: "docs" },
    render: { math: "katex" },
    seo: { open_graph: { image: "/cover.webp" } },
    inject: { head_end: "<meta name=\"example\">" }
  }, "source/wiki/docs/index.md");
  assert.equal(parsed.title, "Page");
  assert.deepEqual(parsed.collection, { profile: "wiki", id: "docs" });
  assert.equal(parsed.seo.openGraph.image, "/cover.webp");
  assert.equal(parsed.inject.headEnd, "<meta name=\"example\">");
  assert.equal(Object.isFrozen(parsed), true);
});

test("Content regions distinguish inheritance from explicit empty lists", () => {
  const collection = parseCollectionConfig({ name: "Docs", rightbar: { widgets: ["toc"] } });
  const page = parsePageConfig({ leftbar: { widgets: [] } });
  assert.equal(collection.leftbar, undefined);
  assert.deepEqual(collection.rightbar.widgets, ["toc"]);
  assert.deepEqual(page.leftbar.widgets, []);
  assert.equal(page.rightbar, undefined);
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
    leftbar: { widgets: ["tree", "search"] },
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

  const allInvalid = parsePageConfig({ leftbar: { widgets: ["search"] } }, "page.md", { mode: "recover" });
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
