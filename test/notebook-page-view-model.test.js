"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildNotebookPageViewModel } = require("../scripts/lib/models");
const processContentConfig = require("../scripts/events/lib/content-config");

const COLLECTION_MODEL_KEYS = [
  "id",
  "profile",
  "identity",
  "source",
  "route",
  "navigation",
  "listing",
  "presentation",
  "visibility"
];

function assertDeepFrozenPlain(value) {
  if (value == null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  if (!Array.isArray(value)) {
    assert.equal(Object.getPrototypeOf(value), Object.prototype);
  }
  Object.values(value).forEach(assertDeepFrozenPlain);
}

function notebookInput(overrides = {}) {
  const collectionConfig = {
    name: "开发笔记",
    headline: "Development Notes",
    tagline: "持续整理",
    description: "Web、Node.js 与工具链笔记。",
    identity: { icon: "/images/notebook.svg" },
    source: { repository: "xaoxuu/notes", branch: "v2" },
    routing: { base_dir: "/notes/dev/index.html" },
    navigation: { menu: "notes", breadcrumb: true },
    listing: { sort: 2, excerpt_length: 64, per_page: 5, order_by: "-updated" },
    article: { type: "tech", indent: true },
    footer: { license: "CC BY 4.0", share: true },
    comments: { enabled: true, service: "giscus", giscus: { "data-repo": "xaoxuu/notes" } },
    note: {
      sidebar: {
        left: { widgets: ["tagtree", "recent"] },
        right: { widgets: ["toc"] }
      }
    }
  };
  const frontMatter = {
    title: "Node.js",
    layout: "page",
    collection: { type: "notebook", id: "dev" },
    tags: ["knowledge/nodejs", "tools"],
    navigation: { menu: "", breadcrumb: false },
    listing: { priority: 7 },
    visibility: { listed: false, searchable: true },
    footer: { share: false }
  };
  const page = {
    _id: "note-nodejs",
    source: "notes/dev/nodejs.md",
    path: "/notes/dev/nodejs/index.html",
    permalink: "https://example.com/notes/dev/nodejs/",
    title: "Node.js",
    layout: "page",
    content: "<p>Node.js</p>",
    excerpt: "<p>Node</p>",
    date: new Date("2026-08-20T00:00:00.000Z"),
    tags: [{ name: "knowledge/nodejs" }, { name: "tools" }],
    collection: { type: "notebook", id: "dev" }
  };

  return {
    source: "source/notes/dev/nodejs.md",
    collectionId: "dev",
    collectionSource: "source/_data/notebooks/dev.yml",
    siteConfig: { per_page: 10 },
    themeConfig: {
      site_tree: {
        notebooks: { base_dir: "notebooks" },
        notes: {
          navigation: { menu: "notebooks", breadcrumb: false },
          sidebar: { left: { widgets: ["recent"] }, right: { widgets: [] } }
        },
        note: {
          sidebar: { left: { widgets: ["tagtree"] }, right: { widgets: ["toc"] } }
        }
      },
      notebook: {
        listing: { excerpt_length: 128, per_page: null, order_by: "-updated" },
        footer: { license: false, share: false }
      },
      article: { type: "story", indent: false },
      comments: { enabled: false, service: "giscus", giscus: { "data-theme": "light" } }
    },
    collectionConfig,
    collectionItems: [
      page,
      {
        _id: "note-http",
        collection: { type: "notebook", id: "dev" },
        tags: ["knowledge/http", "tools/cli"]
      },
      {
        _id: "other",
        collection: { type: "notebook", id: "other" },
        tags: ["ignored"]
      }
    ],
    frontMatter,
    page,
    ...overrides
  };
}

test("Notebook profile 生成与 Post 同构的冻结 PageViewModel", () => {
  const input = notebookInput();
  const viewModel = buildNotebookPageViewModel(input);

  assert.deepEqual(Object.keys(viewModel), ["collection", "item"]);
  assert.deepEqual(Object.keys(viewModel.collection), COLLECTION_MODEL_KEYS);
  assert.equal(viewModel.collection.id, "dev");
  assert.equal(viewModel.collection.profile, "notebook");
  assert.deepEqual(viewModel.collection.identity, {
    name: "开发笔记",
    headline: "Development Notes",
    tagline: "持续整理",
    description: "Web、Node.js 与工具链笔记。",
    audience: "",
    icon: "/images/notebook.svg"
  });
  assert.deepEqual(viewModel.collection.source, {
    repository: "xaoxuu/notes",
    branch: "v2"
  });
  assert.deepEqual(viewModel.collection.route, { baseDir: "notes/dev" });
  assert.equal(viewModel.collection.navigation.menu, "notes");
  assert.equal(viewModel.collection.navigation.breadcrumb, true);
  assert.deepEqual(viewModel.collection.navigation.tags, [
    { id: "knowledge", name: "knowledge", label: "knowledge", path: "notes/dev/tags/knowledge", parentId: null },
    { id: "knowledge/http", name: "knowledge/http", label: "http", path: "notes/dev/tags/knowledge/http", parentId: "knowledge" },
    { id: "knowledge/nodejs", name: "knowledge/nodejs", label: "nodejs", path: "notes/dev/tags/knowledge/nodejs", parentId: "knowledge" },
    { id: "tools", name: "tools", label: "tools", path: "notes/dev/tags/tools", parentId: null },
    { id: "tools/cli", name: "tools/cli", label: "cli", path: "notes/dev/tags/tools/cli", parentId: "tools" }
  ]);
  assert.deepEqual(viewModel.collection.listing, {
    priority: 0,
    sort: 2,
    excerptLength: 64,
    perPage: 5,
    orderBy: "-updated"
  });
  assert.deepEqual(viewModel.collection.visibility, { listed: true, searchable: true });
  assert.deepEqual(viewModel.item.navigation, { menu: "", breadcrumb: false });
  assert.equal(viewModel.item.listing.priority, 7);
  assert.deepEqual(viewModel.item.visibility, { listed: false, searchable: true });
  assert.equal(viewModel.item.route.path, "notes/dev/nodejs");
  assert.deepEqual(viewModel.item.presentation.sidebar.left.widgets, ["tagtree", "recent"]);
  assert.equal(viewModel.item.presentation.article.type, "tech");
  assert.equal(viewModel.item.presentation.article.indent, true);
  assert.equal(viewModel.item.presentation.footer.license, "CC BY 4.0");
  assert.equal(viewModel.item.presentation.footer.share, false);
  assert.equal(viewModel.item.presentation.comments.giscus["data-theme"], "light");
  assert.equal(viewModel.item.presentation.comments.giscus["data-repo"], "xaoxuu/notes");
  assertDeepFrozenPlain(viewModel);

  input.collectionConfig.name = "Changed";
  input.collectionConfig.note.sidebar.left.widgets.push("changed");
  input.collectionItems[0].tags.push("changed");
  assert.equal(viewModel.collection.identity.name, "开发笔记");
  assert.deepEqual(viewModel.item.presentation.sidebar.left.widgets, ["tagtree", "recent"]);
  assert.equal(viewModel.collection.navigation.tags.some(tag => tag.id === "changed"), false);
});

test("Notebook profile 使用既有主题默认值完成列表和展示级联", () => {
  const input = notebookInput();
  input.collectionConfig = {
    name: "默认笔记本",
    routing: {},
    listing: {},
    navigation: {},
    note: {}
  };
  input.frontMatter.collection.id = "default";
  input.collectionId = "default";
  input.page.collection.id = "default";
  input.collectionItems = [input.page];

  const viewModel = buildNotebookPageViewModel(input);

  assert.deepEqual(viewModel.collection.route, { baseDir: "notebooks/default" });
  assert.deepEqual(viewModel.collection.listing, {
    priority: 0,
    sort: 0,
    excerptLength: 128,
    perPage: 10,
    orderBy: "-updated"
  });
  assert.deepEqual(viewModel.item.presentation.sidebar.left.widgets, ["tagtree"]);
  assert.deepEqual(viewModel.item.presentation.sidebar.right.widgets, ["toc"]);
  assert.equal(viewModel.item.presentation.article.type, "story");
  assert.equal(viewModel.item.presentation.footer.license, false);
});

test("Notebook identity 保留显式空 headline", () => {
  const input = notebookInput();
  input.collectionConfig.headline = "";

  const viewModel = buildNotebookPageViewModel(input);

  assert.equal(viewModel.collection.identity.headline, "");
});

test("Notebook builder 严格拒绝缺失、错误类型和不匹配的 v2 collection 归属", () => {
  const missing = notebookInput();
  delete missing.frontMatter.collection;
  assert.throws(() => buildNotebookPageViewModel(missing), /必须显式声明 collection\.type: notebook/);

  const wrongType = notebookInput();
  wrongType.frontMatter.collection = { type: "wiki", id: "dev" };
  assert.throws(() => buildNotebookPageViewModel(wrongType), /必须显式声明 collection\.type: notebook/);

  const wrongId = notebookInput();
  wrongId.frontMatter.collection.id = "other";
  assert.throws(() => buildNotebookPageViewModel(wrongId), /collection\.id other 与 Notebook dev 不匹配/);

  const invalidCollection = notebookInput();
  invalidCollection.collectionConfig.listing.priority = "high";
  assert.throws(() => buildNotebookPageViewModel(invalidCollection), /source\/_data\/notebooks\/dev\.yml: listing\.priority 应为 finite number/);
});

test("生成前事件只为可解析的严格 Notebook Note 挂载 PageViewModel", t => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-notebook-view-model-"));
  t.after(() => fs.rmSync(sourceDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(sourceDir, "notes"), { recursive: true });
  fs.writeFileSync(path.join(sourceDir, "notes/note.md"), "---\ntitle: Note\ncollection:\n  type: notebook\n  id: dev\ntags: [tools/cli]\nlisting:\n  priority: 3\n---\n");
  fs.writeFileSync(path.join(sourceDir, "notes/wiki.md"), "---\ntitle: Wiki\ncollection:\n  type: wiki\n  id: docs\n---\n");

  const note = {
    _id: "note",
    source: "notes/note.md",
    path: "notes/note/",
    title: "Note",
    layout: "page",
    collection: { type: "notebook", id: "dev" },
    tags: ["runtime/ignored"]
  };
  const wiki = {
    _id: "wiki",
    source: "notes/wiki.md",
    path: "wiki/",
    title: "Wiki",
    layout: "page",
    collection: { type: "wiki", id: "docs" }
  };
  const data = {
    "notebooks/dev": {
      name: "开发笔记",
      routing: { base_dir: "notes/dev" },
      navigation: { menu: "notes" }
    },
    "wiki/docs": { name: "Docs" }
  };
  const collections = {
    posts: { each() {}, data: [] },
    pages: { each: callback => [note, wiki].forEach(callback), data: [note, wiki] },
    data
  };
  const themeConfig = {
    site_tree: {
      notebooks: { base_dir: "notebooks" },
      notes: { navigation: { menu: "notebooks" }, sidebar: {} },
      note: { sidebar: {} }
    },
    notebook: { listing: {}, footer: {} }
  };

  processContentConfig({
    source_dir: sourceDir,
    config: { per_page: 10, theme_config: themeConfig },
    theme: { config: themeConfig },
    locals: { get: key => collections[key] }
  });

  assert.equal(note.viewModel.collection.id, "dev");
  assert.equal(note.viewModel.collection.profile, "notebook");
  assert.equal(note.viewModel.item.listing.priority, 3);
  assert.deepEqual(note.viewModel.collection.navigation.tags.map(tag => tag.id), ["tools", "tools/cli"]);
  assert.equal(Object.isFrozen(note.viewModel), true);
  assert.equal(wiki.viewModel, undefined);
});

test("生成前事件拒绝引用不存在 Notebook 的 Note", t => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-missing-notebook-"));
  t.after(() => fs.rmSync(sourceDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(sourceDir, "notes"), { recursive: true });
  fs.writeFileSync(path.join(sourceDir, "notes/missing.md"), "---\ntitle: Missing\ncollection:\n  type: notebook\n  id: missing\n---\n");

  const missing = {
    _id: "missing",
    source: "notes/missing.md",
    path: "notes/missing/",
    title: "Missing",
    layout: "page",
    collection: { type: "notebook", id: "missing" }
  };
  const collections = {
    posts: { each() {}, data: [] },
    pages: { each: callback => callback(missing), data: [missing] },
    data: {}
  };
  const themeConfig = { site_tree: { notebooks: {}, notes: {}, note: {} }, notebook: {} };

  assert.throws(() => processContentConfig({
    source_dir: sourceDir,
    config: { theme_config: themeConfig },
    theme: { config: themeConfig },
    locals: { get: key => collections[key] }
  }), /source\/notes\/missing\.md: 未找到 Notebook collection missing/);
});
