"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildNotebookPageViewModel: buildNotebookPageViewModelRaw } = require("../scripts/lib/models");
const { parseStellarConfig } = require("../scripts/lib/config-schema");
const { parseCollectionConfig, parsePageConfig } = require("../scripts/lib/content-config");
const processContentConfig = require("../scripts/events/lib/content-config");
const processNotebooks = require("../scripts/events/lib/notebooks");

function buildNotebookPageViewModel(input) {
  return buildNotebookPageViewModelRaw({
    ...input,
    collectionConfig: input.collectionConfig == null
      ? input.collectionConfig
      : parseCollectionConfig(input.collectionConfig, input.collectionSource),
    frontMatter: parsePageConfig(input.frontMatter, input.source),
    stellarConfig: input.stellarConfig || parseStellarConfig({
      source: input.themeSource || "<theme>",
      themeConfig: input.themeConfig,
      siteConfig: input.siteConfig
    })
  });
}

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
    route: { path: "/notes/dev/index.html" },
    navigation: { menu: "notes", breadcrumb: true },
    listing: { order: 2, excerpt_length: 64, per_page: 5, sort: { field: "updated", direction: "desc" } },
    article: { style: "tech", paragraph_indent: "always" },
    footer: { license: "CC BY 4.0", share: true },
    comments: { enabled: true, provider: "giscus", options: { "data-repo": "xaoxuu/notes" } },
    note_defaults: {
      sidebar: {
        left: { widgets: ["tagtree", "recent"] },
        right: { widgets: ["toc"] }
      }
    }
  };
  const frontMatter = {
    title: "Node.js",
    layout: "page",
    collection: { profile: "notebook", id: "dev" },
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
    collection: { profile: "notebook", id: "dev" }
  };

  return {
    source: "source/notes/dev/nodejs.md",
    collectionId: "dev",
    collectionSource: "source/_data/notebooks/dev.yml",
    siteConfig: {
      per_page: 10,
      title: "Example",
      url: "https://example.com",
      language: "zh-CN",
      author: "Tester"
    },
    themeConfig: {
      layout: { profiles: {
        notebook_index: { path: "/notebooks/" },
        note_index: {
          navigation: { active_menu: "notebooks" },
          sidebar: { left: ["recent"], right: [] }
        },
        note: {
          navigation: { active_menu: "notebooks" },
          sidebar: { left: ["tagtree"], right: ["toc"] }
        }
      } },
      content: {
        notebook: {
          listing: { excerpt_length: 128, per_page: null, sort: { field: "updated", direction: "desc" } },
          footer: { license: false, share: [] }
        },
        article: { style: "story", paragraph_indent: "never" }
      },
      extensions: { comments: {
        provider: "giscus",
        providers: { giscus: { "data-theme": "light" } }
      } }
    },
    collectionConfig,
    collectionItems: [
      page,
      {
        _id: "note-http",
        collection: { profile: "notebook", id: "dev" },
        tags: ["knowledge/http", "tools/cli"]
      },
      {
        _id: "other",
        collection: { profile: "notebook", id: "other" },
        tags: ["ignored"]
      }
    ],
    frontMatter,
    page,
    ...overrides
  };
}

test("Notebook profile 生成包含最终详情与列表消费状态的冻结 PageViewModel", () => {
  const input = notebookInput();
  const viewModel = buildNotebookPageViewModel(input);

  assert.deepEqual(Object.keys(viewModel), ["collection", "item", "render"]);
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
    order: 2,
    excerptLength: 64,
    perPage: 5,
    sort: { field: "updated", direction: "desc" }
  });
  assert.deepEqual(viewModel.collection.visibility, { listed: true, searchable: true });
  assert.deepEqual(viewModel.item.navigation, { menu: "", breadcrumb: false });
  assert.equal(viewModel.item.listing.priority, 7);
  assert.deepEqual(viewModel.item.visibility, { listed: false, searchable: true });
  assert.equal(viewModel.item.route.path, "notes/dev/nodejs");
  assert.deepEqual(viewModel.item.presentation.sidebar.left.widgets, ["tagtree", "recent"]);
  assert.equal(viewModel.item.presentation.article.style, "tech");
  assert.equal(viewModel.item.presentation.article.paragraphIndent, "always");
  assert.equal(viewModel.item.presentation.footer.license, "CC BY 4.0");
  assert.equal(viewModel.item.presentation.footer.share, false);
  assert.equal(viewModel.item.presentation.comments.provider, "giscus");
  assert.equal(viewModel.item.presentation.comments.options["data-repo"], "xaoxuu/notes");
  assert.deepEqual(viewModel.render.document, {
    language: "zh-CN",
    headEndInject: "",
    bodyEndInject: "",
    preferredTheme: "auto"
  });
  assert.equal(viewModel.render.layout.pageType, "content");
  assert.equal(viewModel.render.layout.articleStyle, "tech");
  assert.equal(viewModel.render.layout.indent, true);
  assert.equal(viewModel.render.layout.notebookIndexPath, "notebooks");
  assert.equal(viewModel.render.layout.notebookPath, "notes/dev");
  assert.equal(viewModel.render.layout.searchFilter, "notes/dev");
  assert.deepEqual(viewModel.render.layout.breadcrumbs, [{
    name: "Development Notes",
    path: "notes/dev"
  }]);
  assert.equal(viewModel.render.layout.brand.name, "开发笔记");
  assert.equal(viewModel.render.layout.brand.href, "notes/dev");
  assert.equal(viewModel.render.layout.brand.image.src, "/images/notebook.svg");
  assert.equal(viewModel.render.seo.title, "Node.js - Example");
  assert.equal(viewModel.render.seo.openGraph.args.type, "website");
  assert.equal(viewModel.render.seo.openGraph.publishedTime, "2026-08-20T00:00:00.000Z");
  assert.equal(viewModel.render.seo.openGraph.modifiedTime, "2026-08-20T00:00:00.000Z");
  assert.deepEqual(viewModel.render.seo.openGraph.tags, ["knowledge/nodejs", "tools"]);
  assert.equal(viewModel.render.seo.jsonLd["@type"], "WebPage");
  assert.equal(viewModel.render.article.created, "2026-08-20T00:00:00.000Z");
  assert.equal(viewModel.render.article.updated, "2026-08-20T00:00:00.000Z");
  assert.deepEqual(viewModel.render.article.tags, [
    { name: "knowledge/nodejs", path: "notes/dev/tags/knowledge/nodejs" },
    { name: "tools", path: "notes/dev/tags/tools" }
  ]);
  assert.equal(viewModel.render.article.footer.license, "CC BY 4.0");
  assert.equal(viewModel.render.article.footer.share, null);
  assert.equal(viewModel.render.article.comments.enabled, true);
  assert.equal(viewModel.render.listing.href, "notes/dev/nodejs");
  assert.equal(viewModel.render.listing.collectionId, "dev");
  assert.equal(viewModel.render.listing.collectionName, "开发笔记");
  assert.equal(viewModel.render.listing.title, "Node.js");
  assert.equal(viewModel.render.listing.excerpt, "Node");
  assert.deepEqual(viewModel.render.listing.tags, ["knowledge/nodejs", "tools"]);
  assert.equal(viewModel.render.listing.priority, 7);
  assert.equal(viewModel.render.listing.listed, false);
  assertDeepFrozenPlain(viewModel);

  input.collectionConfig.name = "Changed";
  input.collectionConfig.note_defaults.sidebar.left.widgets.push("changed");
  input.collectionItems[0].tags.push("changed");
  assert.equal(viewModel.collection.identity.name, "开发笔记");
  assert.deepEqual(viewModel.item.presentation.sidebar.left.widgets, ["tagtree", "recent"]);
  assert.equal(viewModel.collection.navigation.tags.some(tag => tag.id === "changed"), false);
});

test("Notebook profile 使用既有主题默认值完成列表和展示级联", () => {
  const input = notebookInput();
  input.collectionConfig = {
    name: "默认笔记本",
    route: {},
    listing: {},
    navigation: {},
    note_defaults: {}
  };
  input.frontMatter.collection.id = "default";
  input.collectionId = "default";
  input.page.collection.id = "default";
  input.collectionItems = [input.page];

  const viewModel = buildNotebookPageViewModel(input);

  assert.deepEqual(viewModel.collection.route, { baseDir: "notebooks/default" });
  assert.deepEqual(viewModel.collection.listing, {
    priority: 0,
    order: 0,
    excerptLength: 128,
    perPage: 10,
    sort: { field: "updated", direction: "desc" }
  });
  assert.deepEqual(viewModel.item.presentation.sidebar.left.widgets, ["tagtree"]);
  assert.deepEqual(viewModel.item.presentation.sidebar.right.widgets, ["toc"]);
  assert.equal(viewModel.item.presentation.article.style, "story");
  assert.equal(viewModel.item.presentation.footer.license, false);
});

test("Notebook footer.license null 继承 Collection 许可", () => {
  const input = notebookInput();
  input.themeConfig.content.article.footer = { license: "Global license", share: [] };
  input.frontMatter.footer = { license: null, share: false };

  const viewModel = buildNotebookPageViewModel(input);

  assert.equal(viewModel.item.presentation.footer.license, "CC BY 4.0");
  assert.equal(viewModel.render.article.footer.license, "CC BY 4.0");
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
  assert.throws(() => buildNotebookPageViewModel(missing), /必须显式声明 collection\.profile: notebook/);

  const wrongType = notebookInput();
  wrongType.frontMatter.collection = { profile: "wiki", id: "dev" };
  assert.throws(() => buildNotebookPageViewModel(wrongType), /必须显式声明 collection\.profile: notebook/);

  const wrongId = notebookInput();
  wrongId.frontMatter.collection.id = "other";
  assert.throws(() => buildNotebookPageViewModel(wrongId), /collection\.id other 与 Notebook dev 不匹配/);

  const invalidCollection = notebookInput();
  invalidCollection.collectionConfig.listing.priority = "high";
  assert.throws(() => buildNotebookPageViewModel(invalidCollection), /source\/_data\/notebooks\/dev\.yml: listing\.priority 应为 number/);
});

test("生成前事件只为可解析的严格 Notebook Note 挂载 PageViewModel", t => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-notebook-view-model-"));
  t.after(() => fs.rmSync(sourceDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(sourceDir, "notes"), { recursive: true });
  fs.writeFileSync(path.join(sourceDir, "notes/note.md"), "---\ntitle: Note\ncollection:\n  profile: notebook\n  id: dev\ntags: [tools/cli]\nlisting:\n  priority: 3\n---\n");
  fs.writeFileSync(path.join(sourceDir, "notes/hidden.md"), "---\ntitle: Hidden\ncollection:\n  profile: notebook\n  id: dev\ntags: [tools/cli]\nlisting:\n  priority: 9\nvisibility:\n  listed: false\n---\n");
  fs.writeFileSync(path.join(sourceDir, "notes/wiki.md"), "---\ntitle: Wiki\ncollection:\n  profile: wiki\n  id: docs\n---\n");

  const note = {
    _id: "note",
    source: "notes/note.md",
    path: "notes/note/",
    title: "Note",
    layout: "page",
    collection: { profile: "notebook", id: "dev" },
    tags: ["runtime/ignored"]
  };
  const wiki = {
    _id: "wiki",
    source: "notes/wiki.md",
    path: "wiki/",
    title: "Wiki",
    layout: "page",
    collection: { profile: "wiki", id: "docs" }
  };
  const hidden = {
    _id: "hidden",
    source: "notes/hidden.md",
    path: "notes/hidden/",
    title: "Hidden",
    layout: "page",
    collection: { profile: "notebook", id: "dev" }
  };
  const data = {
    "notebooks/dev": {
      name: "开发笔记",
      route: { path: "notes/dev" },
      navigation: { menu: "notes" }
    },
    "wiki/docs": { name: "Docs" }
  };
  const collections = {
    posts: { each() {}, data: [] },
    pages: { each: callback => [note, hidden, wiki].forEach(callback), data: [note, hidden, wiki] },
    data
  };
  const themeConfig = {
    layout: { profiles: {
      notebook_index: { path: "/notebooks/" },
      note_index: { navigation: { active_menu: "notebooks" } },
      note: {}
    } },
    content: { notebook: { listing: {}, footer: {} } }
  };

  const context = {
    source_dir: sourceDir,
    config: { per_page: 10, theme_config: themeConfig },
    theme: { config: themeConfig },
    stellar: { config: parseStellarConfig({ themeConfig }) },
    locals: { get: key => collections[key] }
  };
  processContentConfig(context);
  processNotebooks(context);

  assert.equal(note.viewModel.collection.id, "dev");
  assert.equal(note.viewModel.collection.profile, "notebook");
  assert.equal(note.viewModel.render.layout.notebookPath, "notes/dev");
  assert.equal(note.viewModel.item.listing.priority, 3);
  assert.deepEqual(note.viewModel.collection.navigation.tags.map(tag => tag.id), ["tools", "tools/cli"]);
  assert.deepEqual(note.viewModel.render.layout.tagTree.map(tag => tag.id), ["", "tools", "tools/cli"]);
  assert.equal(Object.isFrozen(note.viewModel), true);
  assert.equal(Object.isFrozen(context.stellar.data.notebookIndex), true);
  assert.deepEqual(context.stellar.data.notebookIndex.items.map(item => item.id), ["dev"]);
  assert.equal(context.stellar.data.notebookIndex.items[0].listed, true);
  assert.deepEqual(context.stellar.data.notebookIndex.collections.dev.items.map(item => item.title), ["Hidden", "Note"]);
  assert.equal(context.stellar.data.notebookIndex.collections.dev.items[0].listed, false);
  assert.deepEqual(context.stellar.data.notebookIndex.collections.dev.recentItems.map(item => item.title), ["Note"]);
  assert.deepEqual(context.stellar.data.notebookIndex.recentItems.map(item => item.title), ["Note"]);
  assert.deepEqual(context.stellar.data.notebookIndex.collections.dev.tags[2].itemIds, ["note", "hidden"]);
  assert.equal(wiki.viewModel, undefined);
});

test("生成前事件拒绝引用不存在 Notebook 的 Note", t => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-missing-notebook-"));
  t.after(() => fs.rmSync(sourceDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(sourceDir, "notes"), { recursive: true });
  fs.writeFileSync(path.join(sourceDir, "notes/missing.md"), "---\ntitle: Missing\ncollection:\n  profile: notebook\n  id: missing\n---\n");

  const missing = {
    _id: "missing",
    source: "notes/missing.md",
    path: "notes/missing/",
    title: "Missing",
    layout: "page",
    collection: { profile: "notebook", id: "missing" }
  };
  const collections = {
    posts: { each() {}, data: [] },
    pages: { each: callback => callback(missing), data: [missing] },
    data: {}
  };
  const themeConfig = { layout: { profiles: {} }, content: { notebook: {} } };

  assert.throws(() => processContentConfig({
    source_dir: sourceDir,
    config: { theme_config: themeConfig },
    theme: { config: themeConfig },
    stellar: { config: parseStellarConfig({ themeConfig }) },
    locals: { get: key => collections[key] }
  }), /source\/notes\/missing\.md: 未找到 Notebook collection missing/);
});

test("stellar new note 路径可唯一推断 Notebook 且不要求重复归属字段", t => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-inferred-notebook-"));
  t.after(() => fs.rmSync(sourceDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(sourceDir, "notebooks", "dev"), { recursive: true });
  fs.writeFileSync(path.join(sourceDir, "notebooks", "dev", "hello.md"), "---\ndate: 2026-08-25 12:00\ntitle: Hello\ntags: [tools]\n---\n");

  const note = {
    _id: "inferred-note",
    source: "notebooks/dev/hello.md",
    path: "notebooks/dev/hello/",
    permalink: "https://example.com/notebooks/dev/hello/",
    title: "Hello",
    layout: "page"
  };
  const data = {
    "notebooks/dev": {
      name: "Dev Notes",
      route: { path: "notebooks/dev" }
    }
  };
  const collections = {
    posts: { each() {}, data: [] },
    pages: { each: callback => callback(note), data: [note] },
    data
  };
  const themeConfig = {
    layout: { profiles: {
      notebook_index: { path: "/notebooks/" },
      note_index: {},
      note: {}
    } },
    content: { notebook: { listing: {}, footer: {} } }
  };
  const context = {
    source_dir: sourceDir,
    config: { url: "https://example.com", theme_config: themeConfig },
    theme: { config: themeConfig },
    stellar: { config: parseStellarConfig({ themeConfig }) },
    locals: { get: key => collections[key] }
  };

  processContentConfig(context);
  processNotebooks(context);
  assert.deepEqual(note.stellarConfig.collection, { profile: "notebook", id: "dev" });
  assert.equal(note.viewModel.collection.id, "dev");
  assert.equal(note.viewModel.item.title, "Hello");
});
