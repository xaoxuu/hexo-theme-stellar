"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  buildPostPageViewModel: buildPostPageViewModelRaw,
  buildWikiPageViewModel: buildWikiPageViewModelRaw,
  buildWikiPageViewModelBase: buildWikiPageViewModelBaseRaw,
  completeWikiPageViewModel
} = require("../scripts/lib/models");
const { parseStellarConfig } = require("../scripts/lib/config-schema");
const { parseCollectionConfig, parsePageConfig } = require("../scripts/lib/content-config");
const processContentConfig = require("../scripts/events/lib/content-config");
const { attachPageViewModel } = require("../scripts/filters/lib/page-view-model");
const {
  getPageConfig,
  getPageViewModel,
  resetPageViewModels,
  setPostViewModelInput
} = require("../scripts/lib/page-view-model-registry");
const processWikiTree = require("../scripts/events/lib/doc_tree");

function buildPostPageViewModel(input) {
  return buildPostPageViewModelRaw({
    ...input,
    frontMatter: parsePageConfig(input.frontMatter, input.source),
    stellarConfig: input.stellarConfig || parseStellarConfig({
      source: input.themeSource || "<theme>",
      themeConfig: input.themeConfig,
      siteConfig: input.siteConfig
    })
  });
}

function normalizedWikiInput(input) {
  return {
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
  };
}

function buildWikiPageViewModel(input) {
  return buildWikiPageViewModelRaw(normalizedWikiInput(input));
}

function assertDeepFrozen(value) {
  if (value == null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  if (!Array.isArray(value)) {
    assert.equal(Object.getPrototypeOf(value), Object.prototype);
  }
  Object.values(value).forEach(assertDeepFrozen);
}

test("合法 Wiki profile 生成与 Post 同构的冻结 PageViewModel", () => {
  const input = {
    source: "source/wiki/stellar/index.md",
    collectionSource: "source/_data/wiki/stellar.yml",
    siteConfig: {
      title: "Example",
      url: "https://example.com",
      language: "zh-CN",
      author: "Example Author"
    },
    themeConfig: {
      menu: { items: [
        { id: "post", title: "Blog", url: "/" },
        { id: "wiki", title: "Wiki", url: "/wiki/" }
      ] },
      profiles: {
        wiki_index: { path: "/wiki/" },
        wiki: {
          active_menu: "wiki",
          leftbar: { widgets: ["tree", "related"] },
          rightbar: { widgets: ["toc"] }
        }
      },
      article: {
        style: "tech",
        paragraph_indent: "never",
        footer: { license: "Global license", share: ["link"] }
      },
      comments: { provider: "giscus" }
    },
    collectionConfig: {
      name: "Stellar",
      headline: "每个人的独立博客",
      tagline: "基于 Hexo 的全能型个人知识库",
      description: "Stellar Wiki",
      tags: ["博客主题"],
      audience: "独立博主",
      identity: { icon: "/stellar.svg" },
      source: { repository: "xaoxuu/hexo-theme-stellar", branch: "v2" },
      route: { path: "/wiki/stellar/" },
      listing: { priority: 2, order: 10, excerpt_length: 128, per_page: 20, sort: { field: "updated", direction: "asc" } },
      navigation: { breadcrumb: true, tree: { "快速开始": ["index", "install"] } },
      card: { cover: "/cover.webp" },
      hero: { enabled: true, background: { image: "/hero.webp" } },
      leftbar: { widgets: ["tree"] },
      article: { paragraph_indent: "always" },
      footer: { share: false },
      comments: { enabled: true, title: "Wiki comments" }
    },
    collectionState: {
      homepage: { _id: "wiki-home", title: "开始", path: "wiki/stellar/", page_number: 0, is_homepage: true },
      sections: [{
        title: "快速开始",
        pages: [
          { _id: "wiki-home", title: "开始", path: "wiki/stellar/", page_number: 0, is_homepage: true },
          { _id: "wiki-install", title: "安装", path: "wiki/stellar/install/", page_number: 1 }
        ]
      }]
    },
    collectionListed: true,
    relatedCollections: [{
      name: "博客主题",
      items: [{
        id: "example",
        name: "Example",
        description: "Another Wiki",
        homepage: { path: "wiki/example/" }
      }]
    }],
    frontMatter: {
      title: "开始",
      layout: "wiki",
      collection: { profile: "wiki", id: "stellar" }
    },
    page: {
      _id: "wiki-home",
      source: "wiki/stellar/index.md",
      path: "wiki/stellar/index.html",
      permalink: "https://example.com/wiki/stellar/",
      title: "开始",
      layout: "wiki",
      content: "<p>Start</p>",
      date: new Date("2026-08-22T08:00:00.000Z"),
      updated: new Date("2026-08-23T08:00:00.000Z")
    }
  };
  const normalizedInput = normalizedWikiInput(input);
  const base = buildWikiPageViewModelBaseRaw(normalizedInput);
  assert.deepEqual(Object.keys(base), ["collection", "item"]);
  assert.equal("render" in base, false);
  assert.equal(Object.isFrozen(base), false);
  const viewModel = completeWikiPageViewModel(normalizedInput, base);

  assert.deepEqual(Object.keys(viewModel), ["collection", "item", "render"]);
  assert.deepEqual(Object.keys(viewModel.collection), [
    "id",
    "profile",
    "identity",
    "source",
    "route",
    "navigation",
    "listing",
    "presentation",
    "visibility"
  ]);
  assert.equal(viewModel.collection.id, "stellar");
  assert.equal(viewModel.collection.profile, "wiki");
  assert.deepEqual(viewModel.collection.identity, {
    name: "Stellar",
    headline: "每个人的独立博客",
    tagline: "基于 Hexo 的全能型个人知识库",
    description: "Stellar Wiki",
    audience: "独立博主",
    icon: "/stellar.svg"
  });
  assert.deepEqual(viewModel.collection.source, {
    repository: "xaoxuu/hexo-theme-stellar",
    branch: "v2"
  });
  assert.deepEqual(viewModel.collection.route, {
    baseDir: "wiki/stellar",
    homepage: "wiki/stellar"
  });
  assert.deepEqual(viewModel.collection.navigation.tree, [{
    title: "快速开始",
    items: [
      { id: "wiki-home", title: "开始", path: "wiki/stellar", pageNumber: 0, isHomepage: true },
      { id: "wiki-install", title: "安装", path: "wiki/stellar/install", pageNumber: 1, isHomepage: false }
    ]
  }]);
  assert.deepEqual(viewModel.collection.listing, {
    priority: 2,
    order: 10,
    excerptLength: 128,
    perPage: 20,
  });
  assert.deepEqual(viewModel.collection.visibility, { listed: true, searchable: true });
  assert.equal(viewModel.item.source.repository, "xaoxuu/hexo-theme-stellar");
  assert.equal(viewModel.item.navigation.menu, "wiki");
  assert.equal(viewModel.item.navigation.breadcrumb, true);
  assert.equal(viewModel.item.presentation.article.paragraphIndent, "always");
  assert.equal(viewModel.item.presentation.banner.image, "/hero.webp");
  assert.equal(viewModel.item.presentation.footer.share, false);
  assert.equal(viewModel.item.presentation.comments.title, "Wiki comments");
  assert.equal(Object.hasOwn(viewModel.collection.presentation, "regions"), false);
  assert.equal(Object.hasOwn(viewModel.item.presentation, "regions"), false);
  assert.equal(Object.hasOwn(viewModel.render.layout, "regions"), false);
  assert.deepEqual(viewModel.collection.presentation.topbar, { widgets: [] });
  assert.deepEqual(viewModel.item.presentation.rightbar, { widgets: ["toc"] });
  assert.equal(Array.isArray(viewModel.render.layout.topbar.widgets), true);
  assert.equal(Array.isArray(viewModel.render.layout.rightbar.widgets), true);
  assert.equal(viewModel.render.document.language, "zh-CN");
  assert.equal(viewModel.render.layout.pageType, "content");
  assert.equal(viewModel.render.layout.brands.site.name, null);
  assert.equal(viewModel.render.layout.brands.site.href, "/");
  assert.equal(viewModel.render.layout.brands.collection.name, "Stellar");
  assert.equal(viewModel.render.layout.brands.collection.href, "wiki/stellar");
  assert.equal(Object.hasOwn(viewModel.render.layout.brands.site, "github"), false);
  assert.equal(Object.hasOwn(viewModel.render.layout.brands.collection, "github"), false);
  assert.equal(Object.hasOwn(viewModel.render.layout.brands.site, "wordmark"), false);
  assert.equal(viewModel.render.layout.wikiIndexPath, "wiki");
  assert.equal(viewModel.render.layout.algoliaFilterPath, "wiki/stellar/");
  assert.equal(Object.hasOwn(viewModel.render.layout, "searchFilter"), false);
  assert.equal(viewModel.render.seo.title, "Stellar：开始 - Example");
  assert.equal(viewModel.render.seo.canonical, null);
  assert.equal(viewModel.render.seo.jsonLd["@type"], "WebPage");
  assert.equal(viewModel.render.cover.enabled, true);
  assert.equal(viewModel.render.cover.projectName, "Stellar");
  assert.equal(viewModel.render.article.readmeHtml, "");
  assert.equal(viewModel.render.article.next.title, "安装");
  assert.equal(viewModel.render.article.comments.service, "giscus");
  assert.equal(viewModel.render.article.related[0].items[0].href, "wiki/example");
  assert.deepEqual(viewModel.render.listing.tags, ["博客主题"]);
  assert.equal(viewModel.render.listing.href, "wiki/stellar");
  assert.equal(viewModel.render.listing.listed, true);
  assertDeepFrozen(viewModel);

  const readmeInput = structuredClone(input);
  readmeInput.page.content = "  \n";
  const readmeViewModel = buildWikiPageViewModel(readmeInput);
  assert.match(readmeViewModel.render.article.readmeHtml, /mdrender/);

  const innerInput = structuredClone(input);
  innerInput.source = "source/wiki/stellar/install.md";
  innerInput.frontMatter.title = "安装";
  innerInput.page._id = "wiki-install";
  innerInput.page.source = "wiki/stellar/install.md";
  innerInput.page.path = "wiki/stellar/install/";
  innerInput.page.permalink = "https://example.com/wiki/stellar/install/";
  innerInput.page.title = "安装";
  innerInput.page.content = "";
  const innerViewModel = buildWikiPageViewModel(innerInput);
  assert.equal(innerViewModel.render.cover.enabled, false);
  assert.equal(innerViewModel.render.layout.algoliaFilterPath, "wiki/stellar/");
  assert.equal(innerViewModel.render.article.readmeHtml, "");
  assert.equal(innerViewModel.render.article.previous.title, "开始");
  assert.equal(innerViewModel.render.article.next, null);
});

test("Wiki 树构建事件只为严格 v2 Wiki 页面挂载 PageViewModel", t => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-wiki-view-model-"));
  t.after(() => fs.rmSync(sourceDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(sourceDir, "wiki/stellar"), { recursive: true });
  fs.writeFileSync(path.join(sourceDir, "wiki/stellar/index.md"), [
    "---",
    "title: Start",
    "layout: wiki",
    "collection:",
    "  profile: wiki",
    "  id: stellar",
    "---",
    ""
  ].join("\n"));

  const wikiPage = {
    _id: "wiki-home",
    source: "wiki/stellar/index.md",
    path: "wiki/stellar/index.html",
    title: "Start",
    layout: "wiki",
    collection: { profile: "wiki", id: "stellar" }
  };
  const ordinaryPage = {
    _id: "about",
    source: "about.md",
    path: "about/",
    title: "About",
    layout: "page"
  };
  const data = {
    wiki: ["stellar"],
    "wiki/stellar": {
      name: "Stellar",
      route: { path: "/wiki/stellar/" },
      navigation: { tree: ["index"] }
    }
  };
  const themeConfig = {
    profiles: {
      wiki_index: { path: "/wiki/" },
      wiki: {}
    },
    article: { paragraph_indent: "always" },
    comments: { provider: "giscus" }
  };
  const pages = [wikiPage, ordinaryPage];
  pages.each = callback => [wikiPage, ordinaryPage].forEach(callback);
  const collections = { data, posts: { each() {} }, pages };
  const ctx = {
    source_dir: sourceDir,
    config: { theme_config: themeConfig },
    theme: { config: themeConfig },
    stellar: { config: parseStellarConfig({ themeConfig }) },
    locals: { get: key => collections[key] }
  };

  processContentConfig(ctx);
  processWikiTree(ctx);

  assert.equal(wikiPage.viewModel.collection.id, "stellar");
  assert.equal(wikiPage.viewModel.collection.profile, "wiki");
  assert.equal(getPageViewModel({ ...wikiPage }), wikiPage.viewModel);
  const renderedWiki = attachPageViewModel({
    ...wikiPage,
    permalink: "https://example.com/wiki/stellar/",
    content: "<p>Rendered Wiki body</p>"
  });
  assert.notEqual(renderedWiki.viewModel, wikiPage.viewModel);
  assert.equal(renderedWiki.viewModel.item.content, "<p>Rendered Wiki body</p>");
  assert.equal(getPageViewModel({ ...wikiPage }), renderedWiki.viewModel);
  assert.equal(wikiPage.viewModel.collection.navigation.tree[0].items[0].title, "Start");
  assert.equal(wikiPage.viewModel.item.presentation.article.paragraphIndent, "always");
  assert.equal(wikiPage.viewModel.item.presentation.comments.provider, "giscus");
  assert.equal(wikiPage.viewModel.render.layout.wikiIndexPath, "wiki");
  assert.deepEqual(ctx.stellar.data.wiki.index.items.map(item => item.id), ["stellar"]);
  assert.equal(Object.isFrozen(wikiPage.viewModel), true);
  assert.equal(ordinaryPage.viewModel, undefined);
});

test("Wiki 模型严格拒绝缺失项目、错误归属与 v1 字段", () => {
  assert.throws(() => buildWikiPageViewModel({
    source: "source/wiki/missing/index.md",
    collectionSource: "source/_data/wiki/missing.yml",
    themeConfig: {},
    collectionId: "missing",
    frontMatter: {
      title: "Missing",
      layout: "wiki",
      collection: { profile: "wiki", id: "missing" }
    },
    page: { title: "Missing", layout: "wiki" }
  }), /source\/wiki\/missing\/index\.md: collection\.id missing 未找到 Wiki 项目配置 source\/_data\/wiki\/missing\.yml/);

  assert.throws(() => buildWikiPageViewModel({
    source: "source/wiki/stellar/legacy.md",
    collectionSource: "source/_data/wiki/stellar.yml",
    themeConfig: {},
    collectionId: "stellar",
    collectionConfig: { name: "Stellar" },
    frontMatter: {
      title: "Legacy",
      layout: "wiki",
      wiki: "stellar",
      collection: { profile: "wiki", id: "stellar" }
    },
    page: { title: "Legacy", layout: "wiki" }
  }), /source\/wiki\/stellar\/legacy\.md: wiki 已移除，期望 collection\.id/);

  assert.throws(() => buildWikiPageViewModel({
    source: "source/wiki/stellar/mismatch.md",
    collectionSource: "source/_data/wiki/other.yml",
    themeConfig: {},
    collectionId: "other",
    collectionConfig: { name: "Other" },
    frontMatter: {
      title: "Mismatch",
      layout: "wiki",
      collection: { profile: "wiki", id: "stellar" }
    },
    page: { title: "Mismatch", layout: "wiki" }
  }), /source\/wiki\/stellar\/mismatch\.md: collection\.id stellar 与 Wiki 项目 other 不匹配/);
});

test("Wiki 模型隔离输入引用并区分项目与页面可见性", () => {
  const collectionConfig = {
    name: "Private Wiki",
    source: { repository: "owner/wiki", branch: "main" },
    hero: { background: { image: "/collection-hero.webp" } },
    leftbar: { widgets: ["tree"] },
    navigation: { tree: ["index"] }
  };
  const collectionState = {
    homepage: { id: "home", path: "/wiki/private/index.html" },
    sections: [{ title: "", pages: [{ id: "home", title: "Home", path: "/wiki/private/index.html" }] }]
  };
  const viewModel = buildWikiPageViewModel({
    source: "source/wiki/private/index.md",
    collectionSource: "source/_data/wiki/private.yml",
    themeConfig: {},
    collectionId: "private",
    collectionConfig,
    collectionState,
    collectionListed: false,
    frontMatter: {
      title: "Home",
      layout: "wiki",
      collection: { profile: "wiki", id: "private" },
      banner: { image: "/page-banner.webp" },
      source: { branch: "page" },
      visibility: { listed: true, searchable: false }
    },
    page: { _id: "home", title: "Home", layout: "wiki", path: "/wiki/private/index.html" }
  });

  collectionConfig.name = "Changed";
  collectionConfig.leftbar.widgets.push("changed");
  collectionState.sections[0].pages[0].title = "Changed";

  assert.deepEqual(viewModel.collection.visibility, { listed: false, searchable: true });
  assert.deepEqual(viewModel.item.visibility, { listed: true, searchable: false });
  assert.deepEqual(viewModel.item.source, {
    file: "source/wiki/private/index.md",
    repository: "owner/wiki",
    branch: "page"
  });
  assert.equal(viewModel.collection.identity.name, "Private Wiki");
  assert.deepEqual(viewModel.collection.presentation.leftbar.widgets, ["tree"]);
  assert.equal(viewModel.item.presentation.banner.image, "/page-banner.webp");
  assert.equal(viewModel.collection.navigation.tree[0].items[0].title, "Home");
  assert.equal(viewModel.collection.navigation.tree[0].items[0].path, "wiki/private");
  assert.equal(Object.isFrozen(collectionConfig), false);
  assert.equal(Object.isFrozen(collectionState), false);
});

test("合法 Post profile 生成固定结构的冻结 PageViewModel", () => {
  const viewModel = buildPostPageViewModel({
    source: "source/_posts/2026/hello.md",
    siteConfig: {
      title: "Stellar",
      subtitle: "独立博客"
    },
    themeConfig: {
      brand: {
        image: { src: "/avatar.webp", variant: "avatar" },
        name: "Stellar",
        tagline: "独立博客"
      },
      profiles: {
        blog_index: { path: "/blog/" },
        post: {
          active_menu: "post",
          leftbar: { widgets: ["recent"] },
          rightbar: { widgets: ["toc"] }
        }
      },
      article: {
        listing: {
          pinned_layout: "carousel",
          card_layout: "hero",
          excerpt_length: 128
        },
        style: "tech",
        paragraph_indent: "never",
        footer: { license: "CC BY-NC-SA 4.0", share: [] }
      },
      comments: { provider: "giscus" }
    },
    frontMatter: {
      title: "Hello",
      layout: "post"
    },
    page: {
      _id: "post-1",
      source: "_posts/2026/hello.md",
      path: "2026/08/22/hello/",
      permalink: "https://example.com/2026/08/22/hello/",
      title: "Hello",
      layout: "post",
      content: "<p>Hello</p>",
      excerpt: "<p>Intro</p>",
      date: new Date("2026-08-22T08:00:00.000Z"),
      updated: new Date("2026-08-22T09:00:00.000Z"),
      tags: [{ name: "Hexo" }],
      categories: [{ name: "开发" }]
    }
  });

  assert.deepEqual(Object.keys(viewModel), ["collection", "item", "render"]);
  assert.deepEqual(Object.keys(viewModel.collection), [
    "id",
    "profile",
    "identity",
    "source",
    "route",
    "navigation",
    "listing",
    "presentation",
    "visibility"
  ]);
  assert.equal(viewModel.collection.id, "post");
  assert.equal(viewModel.collection.profile, "post");
  assert.equal(viewModel.collection.route.baseDir, "blog");
  assert.equal(viewModel.item.title, "Hello");
  assert.deepEqual(viewModel.item.tags, ["Hexo"]);
  assert.deepEqual(viewModel.item.categories, ["开发"]);
  assert.equal(viewModel.render.document.language, "");
  assert.equal(viewModel.render.layout.pageType, "content");
  assert.equal(viewModel.render.layout.articleStyle, "tech");
  assert.equal(viewModel.render.seo.title, "Hello - Stellar");
  assertDeepFrozen(viewModel);
});

test("Wiki 未显式配置 Footer 时不继承 Post 的全局许可与分享", () => {
  const viewModel = buildWikiPageViewModel({
    source: "source/wiki/plain/index.md",
    collectionSource: "source/_data/wiki/plain.yml",
    siteConfig: { title: "Example", url: "https://example.com" },
    themeConfig: {
      profiles: {
        wiki_index: { path: "/wiki/" },
        wiki: {}
      },
      article: {
        footer: { license: "Global license", share: ["wechat", "link"] }
      }
    },
    collectionConfig: {
      name: "Plain",
      route: { path: "/wiki/plain/" }
    },
    collectionState: {
      homepage: { _id: "plain-home", title: "Plain", path: "wiki/plain/", page_number: 0 },
      sections: [{
        title: "Plain",
        pages: [{ _id: "plain-home", title: "Plain", path: "wiki/plain/", page_number: 0 }]
      }]
    },
    frontMatter: {
      title: "Plain",
      layout: "wiki",
      collection: { profile: "wiki", id: "plain" }
    },
    page: {
      _id: "plain-home",
      source: "wiki/plain/index.md",
      path: "wiki/plain/",
      permalink: "https://example.com/wiki/plain/",
      title: "Plain",
      layout: "wiki"
    }
  });

  assert.deepEqual(viewModel.collection.presentation.footer, {});
  assert.deepEqual(viewModel.item.presentation.footer, {});
  assert.equal(viewModel.render.article.footer.license, "");
  assert.equal(viewModel.render.article.footer.share, null);
  assertDeepFrozen(viewModel);
});

test("Post render 在渲染期完成 SEO、语言、canonical、OG 与 JSON-LD 回退", () => {
  const viewModel = buildPostPageViewModel({
    source: "source/_posts/render.md",
    siteConfig: {
      title: "Stellar",
      author: "xaoxuu",
      url: "https://example.com",
      avatar: "/avatar.webp",
      language: ["zh-CN", "en"],
      keywords: ["Site"],
      index_generator: { path: "blog" }
    },
    themeConfig: {
      brand: { name: "Stellar" },
      canonical: { host: "canonical.example.com" },
      open_graph: { enabled: true, twitter_id: "xaoxuu" },
      structured_data: { same_as: ["https://github.com/xaoxuu"] },
      fallbacks: { cover: "/default.webp" },
      appearance: {
        color_scheme: "auto",
        preset: "card",
        backgrounds: {
          page: { image: "/background.webp" }
        }
      },
      profiles: { post: { active_menu: "post" } }
    },
    frontMatter: {
      title: "Render",
      description: "",
      keywords: [],
      robots: "",
      inject: {
        head_end: "<meta name=\"page\" content=\"render\">",
        body_end: "<script>window.pageRender = true</script>"
      },
      seo: { open_graph: { image: null } },
      article: { style: "story" }
    },
    page: {
      _id: "render",
      source: "_posts/render.md",
      path: "blog/render/",
      permalink: "https://example.com/blog/render/",
      title: "Render",
      layout: "post",
      excerpt: "<p>Rendered intro</p>",
      content: "<p>Body</p><img data-src=\"/content.webp\">",
      date: new Date("2026-08-22T08:00:00.000Z"),
      updated: new Date("2026-08-22T09:00:00.000Z"),
      tags: ["Stellar", "Hexo"],
      categoryLinks: [{ name: "开发", path: "blog/categories/dev/" }]
    }
  });

  assert.deepEqual(viewModel.render.document, {
    language: "zh-CN",
    headEndInject: "<meta name=\"page\" content=\"render\">",
    bodyEndInject: "<script>window.pageRender = true</script>",
    preferredTheme: "auto"
  });
  assert.equal(viewModel.render.layout.indent, true);
  assert.equal(viewModel.render.layout.siteBackground, true);
  assert.equal(Object.hasOwn(viewModel.render.layout, "appearancePreset"), false);
  assert.deepEqual(viewModel.render.layout.breadcrumbs, [{ name: "开发", path: "blog/categories/dev" }]);
  assert.equal(viewModel.render.seo.description, "Rendered intro");
  assert.deepEqual(viewModel.render.seo.keywords, ["Stellar", "Hexo"]);
  assert.equal(viewModel.render.seo.robots, null);
  assert.equal(viewModel.render.seo.canonical, "https://canonical.example.com/blog/render/");
  assert.equal(viewModel.render.seo.openGraph.args.image, null);
  assert.equal(viewModel.render.seo.openGraph.args.description, "Rendered intro");
  assert.equal(viewModel.render.seo.openGraph.args.language, "zh-CN");
  assert.deepEqual(viewModel.render.seo.openGraph.tags, ["Hexo", "Stellar"]);
  assert.equal(viewModel.render.seo.jsonLd.description, "Rendered intro");
  assert.deepEqual(viewModel.render.seo.jsonLd.image, ["/content.webp"]);
  assert.equal(viewModel.render.seo.jsonLd.author.image, "https://example.com/avatar.webp");
  assertDeepFrozen(viewModel);
});

test("Post render 投影详情关系、Footer、评论和列表条目", () => {
  const viewModel = buildPostPageViewModel({
    source: "source/_posts/article.md",
    siteConfig: { title: "Stellar" },
    themeConfig: {
      article: {
        footer: { license: "By {author.name} ({author.url})", share: ["wechat", "link"], show_tags: true },
        listing: { show_tags: true, card_layout: "hero", excerpt_length: 80 },
        category_colors: { "开发": "#f44336" },
        related_posts_limit: 2
      },
      comments: {
        provider: "giscus",
        title: "参与讨论",
        giscus: { "data-repo": "owner/repo", "data-theme": "preferred_color_scheme" }
      },
      features: { heti: { enabled: true } },
      services: {
        contributors: {
          provider: "github",
          github: { repositories: [{ source_prefix: "_posts/", repository: "owner/repo", branch: "main" }] }
        },
        github: { api_url: "https://api.github.com" }
      },
      appearance: { color_scheme: "dark" },
    },
    runtimeData: {
      authors: { xaoxuu: { name: "xaoxuu", url: "https://xaoxuu.com" } },
      defaultAuthor: { id: "xaoxuu", name: "xaoxuu", url: "https://xaoxuu.com" }
    },
    frontMatter: {
      title: "Article",
      layout: "post",
      card: { cover: "/cover.webp", tagline: "Card caption" },
      article: { author: "xaoxuu" },
      footer: { references: ["[Hexo](https://hexo.io)"], share: true },
      comments: { id: "article-thread" },
      listing: { priority: 3 }
    },
    page: {
      _id: "article",
      source: "_posts/article.md",
      path: "blog/article/",
      permalink: "https://example.com/blog/article/",
      link: "https://example.net/external-article",
      title: "Article",
      layout: "post",
      content: "<p>Body</p>",
      excerpt: "<p>Excerpt</p>",
      date: "2026-08-22T00:00:00.000Z",
      tagLinks: [{ name: "Hexo", path: "blog/tags/hexo/" }],
      categoryLinks: [{ name: "开发", path: "blog/categories/dev/" }],
      previous: { title: "Newer", path: "blog/newer/", date: "2026-08-23T00:00:00.000Z" },
      next: { title: "Older", path: "blog/older/", date: "2026-08-21T00:00:00.000Z" }
    },
    relatedItems: [{ title: "Related", path: "/blog/related/", excerpt: "<p>Related excerpt</p>" }]
  });

  assert.equal(viewModel.render.article.heti, true);
  assert.deepEqual(viewModel.render.article.tags, [{ name: "Hexo", path: "blog/tags/hexo" }]);
  assert.equal(viewModel.render.article.footer.license, "By xaoxuu (https://xaoxuu.com)");
  assert.deepEqual(viewModel.render.article.footer.share.services, ["wechat", "link"]);
  assert.equal(viewModel.render.article.footer.contributor.editUrl, "https://github.com/owner/repo/blob/main/article.md");
  assert.equal(viewModel.render.article.footer.contributor.commitsUrl, "https://api.github.com/repos/owner/repo/commits?path=article.md");
  assert.equal(viewModel.render.article.previous.path, "blog/newer");
  assert.equal(viewModel.render.article.next.path, "blog/older");
  assert.equal(viewModel.render.article.related.items[0].title, "Related");
  assert.equal(viewModel.render.article.comments.enabled, true);
  assert.equal(viewModel.render.article.comments.title, "参与讨论");
  assert.equal(viewModel.render.article.comments.id, "article-thread");
  assert.equal(viewModel.render.article.comments.options["data-theme"], "dark");
  assert.equal(viewModel.render.listing.href, "https://example.net/external-article");
  assert.equal(viewModel.render.listing.caption, "Card caption");
  assert.equal(viewModel.render.listing.excerpt, "Excerpt");
  assert.deepEqual(viewModel.render.listing.categories, ["开发"]);
  assert.equal(viewModel.render.listing.categoryStyle, "--text-p2:#f44336;--theme-block:#f4433620");
  assert.deepEqual(viewModel.render.listing.tags, ["Hexo"]);
  assert.equal(viewModel.render.listing.authorId, "xaoxuu");
  assert.equal(viewModel.render.listing.priority, 3);
  assertDeepFrozen(viewModel);
});

test("Post 列表与评论投影保留覆盖、摘要优先级、五标签和隐藏语义", () => {
  const viewModel = buildPostPageViewModel({
    source: "source/_posts/overrides.md",
    siteConfig: { title: "Stellar" },
    themeConfig: {
      article: {
        listing: { card_layout: "classic", excerpt_length: 6, show_tags: true },
        footer: { share: ["email", "link"] }
      },
      comments: {
        provider: "giscus",
        giscus: { "data-repo": "owner/repo" },
        waline: { serverURL: "https://global.example.com", lang: "zh-CN" }
      }
    },
    frontMatter: {
      title: "Overrides",
      layout: "post",
      description: "Description wins",
      footer: { share: true },
      comments: {
        provider: "waline",
        options: { serverURL: "https://page.example.com" }
      },
      visibility: { listed: false }
    },
    page: {
      _id: "overrides",
      source: "_posts/overrides.md",
      path: "blog/overrides/",
      title: "Overrides",
      layout: "post",
      content: "<p>Content fallback</p>",
      tagLinks: ["one", "two", "three", "four", "five", "six"].map(name => ({
        name,
        path: `blog/tags/${name}/`
      }))
    }
  });

  assert.equal(viewModel.render.listing.cardStyle, "classic");
  assert.equal(viewModel.render.listing.excerpt, "Description wins");
  assert.deepEqual(viewModel.render.listing.tags, ["one", "two", "three", "four", "five"]);
  assert.equal(viewModel.render.listing.listed, false);
  assert.deepEqual(viewModel.render.article.footer.share.services, ["email", "link"]);
  assert.equal(viewModel.render.article.comments.service, "waline");
  assert.deepEqual(viewModel.render.article.comments.options, {
    serverURL: "https://page.example.com",
    commentCount: true,
    pageview: false,
    lang: "zh-CN"
  });
  assertDeepFrozen(viewModel);
});

test("Post 配置级联保留 false、0、空字符串和 Region 覆盖", () => {
  const viewModel = buildPostPageViewModel({
    source: "source/_posts/cascade.md",
    siteConfig: {},
    themeConfig: {
      brand: { name: "Global" },
      profiles: {
        post: {
          active_menu: "post",
          leftbar: { widgets: ["recent"] },
          rightbar: { widgets: ["toc"] }
        }
      },
      article: {
        style: "tech",
        paragraph_indent: "always",
        footer: { license: "Global license", share: ["link"] }
      },
      comments: { title: "Global title", provider: "giscus" }
    },
    frontMatter: {
      title: "Cascade",
      navigation: { menu: "", breadcrumb: false },
      leftbar: { widgets: [] },
      article: { paragraph_indent: "never" },
      footer: { license: false, share: false },
      comments: { enabled: false, title: "" },
      listing: { priority: 0 },
      visibility: { listed: false, searchable: true }
    },
    page: { _id: "cascade", layout: "post", title: "Cascade" }
  });

  assert.deepEqual(viewModel.item.navigation, { menu: "", breadcrumb: false });
  assert.deepEqual(viewModel.item.presentation.leftbar.widgets, []);
  assert.deepEqual(viewModel.render.layout.leftbar.widgets, []);
  assert.equal(viewModel.render.layout.leftbar.brand, "site_brand");
  assert.equal(viewModel.render.layout.brands.site.name, "Global");
  assert.equal(viewModel.render.layout.brands.collection, null);
  assert.equal(viewModel.item.presentation.article.paragraphIndent, "never");
  assert.equal(viewModel.item.presentation.footer.license, false);
  assert.equal(viewModel.item.presentation.footer.share, false);
  assert.equal(viewModel.render.article.footer.share, null);
  assert.equal(viewModel.item.presentation.comments.enabled, false);
  assert.equal(viewModel.item.presentation.comments.title, "");
  assert.equal(viewModel.render.article.comments.enabled, false);
  assert.equal(viewModel.render.article.comments.title, "");
  assert.equal(viewModel.render.listing.listed, false);
  assert.equal(viewModel.item.listing.priority, 0);
  assert.deepEqual(viewModel.item.visibility, { listed: false, searchable: true });
});

test("Post profile 错误包含配置来源和字段路径", () => {
  assert.throws(() => buildPostPageViewModel({
    source: "source/_posts/error.md",
    themeSource: "_config.stellar.yml",
    themeConfig: {
      profiles: { post: { active_menu: [] } }
    },
    frontMatter: { title: "Error", layout: "post" },
    page: { title: "Error", layout: "post" }
  }), /_config\.stellar\.yml: profiles\.post\.active_menu 应为 string \| null，实际为 array/);
});

test("Post 模型规范化 Hexo 值且不保留输入引用", () => {
  const brand = {
    image: { src: "/avatar.webp", variant: "avatar" },
    name: "Before"
  };
  const tags = {
    toArray() {
      return [{ name: "Hexo" }, { name: "Stellar" }];
    }
  };
  const viewModel = buildPostPageViewModel({
    source: "source/_posts/plain.md",
    themeConfig: { brand },
    frontMatter: {
      title: "Plain",
      layout: "post",
      source: { repository: "owner/repo", branch: "v2" }
    },
    page: {
      _id: "plain",
      source: "_posts/plain.md",
      path: "posts/plain/index.html",
      permalink: "https://example.com/posts/plain/",
      title: "Plain",
      layout: "post",
      date: { toISOString: () => "2026-08-22T00:00:00.000Z" },
      tags,
      categories: ["开发"]
    }
  });

  brand.name = "After";
  brand.image.src = "/changed.webp";

  assert.equal(viewModel.collection.identity.name, "Before");
  assert.equal(viewModel.collection.identity.image.src, "/avatar.webp");
  assert.equal(viewModel.item.date, "2026-08-22T00:00:00.000Z");
  assert.deepEqual(viewModel.item.tags, ["Hexo", "Stellar"]);
  assert.deepEqual(viewModel.item.categories, ["开发"]);
  assert.deepEqual(viewModel.item.source, {
    file: "_posts/plain.md",
    repository: "owner/repo",
    branch: "v2"
  });
  assert.equal(viewModel.item.route.path, "posts/plain");
  assert.equal(viewModel.item.route.permalink, "https://example.com/posts/plain/");
  assert.equal("toArray" in viewModel.item.tags, false);
});

test("Post 模型继续拒绝 v1、未知和错误类型字段", () => {
  assert.throws(() => buildPostPageViewModel({
    source: "source/_posts/legacy.md",
    themeConfig: {},
    frontMatter: {
      title: "Legacy",
      layout: "post",
      cover: "/legacy.webp",
      mystery: true,
      visibility: { listed: "yes" }
    },
    page: { title: "Legacy", layout: "post" }
  }), error => {
    assert.match(error.message, /source\/_posts\/legacy\.md: cover 已移除，期望 card\.cover/);
    assert.match(error.message, /source\/_posts\/legacy\.md: 未知字段 mystery/);
    assert.match(error.message, /source\/_posts\/legacy\.md: visibility\.listed 应为 boolean/);
    return true;
  });
});

test("相关文章构建边界复用插件结果，并在插件缺失时报告源文件", () => {
  const page = { _id: "related", source: "_posts/related.md", path: "blog/related/", layout: "post", title: "Related" };
  const input = {
    source: "source/_posts/related.md",
    siteConfig: { title: "Stellar" },
    themeConfig: { article: { related_posts_limit: 2 } },
    stellarConfig: parseStellarConfig({
      themeConfig: { article: { related_posts_limit: 2 } }
    }),
    frontMatter: { title: "Related", layout: "post" },
    page
  };
  resetPageViewModels();
  setPostViewModelInput(page, input);

  assert.throws(
    () => attachPageViewModel.call({ extend: { helper: { get: () => null } } }, { ...page }),
    /source\/_posts\/related\.md 已启用 content\.article\.related_posts_limit.*hexo-related-popular-posts/
  );

  const rendered = attachPageViewModel.call({
    extend: {
      helper: {
        get: () => () => ({ json: [{ title: "Another", path: "/another/", excerpt: "<p>Excerpt</p>" }] })
      }
    }
  }, { ...page });
  assert.deepEqual(rendered.viewModel.render.article.related.items, [
    { title: "Another", path: "/another/", excerpt: "<p>Excerpt</p>" }
  ]);
  resetPageViewModels();
});

test("生成前事件为普通 Post 与严格 Topic 挂载各自的 PageViewModel", t => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-page-view-model-"));
  t.after(() => fs.rmSync(sourceDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(sourceDir, "_posts"));
  fs.writeFileSync(path.join(sourceDir, "_posts/post.md"), "---\ntitle: Post\nlayout: post\n---\n");
  fs.writeFileSync(path.join(sourceDir, "_posts/topic.md"), "---\ntitle: Topic\nlayout: post\ncollection:\n  profile: topic\n  id: v2\n---\n");
  fs.writeFileSync(path.join(sourceDir, "about.md"), "---\ntitle: About\nlayout: page\n---\n");

  const post = {
    _id: "post",
    source: "_posts/post.md",
    path: "post/",
    title: "Post",
    layout: "post"
  };
  const topic = {
    _id: "topic",
    source: "_posts/topic.md",
    path: "topic/",
    title: "Topic",
    layout: "post",
    collection: { profile: "topic", id: "v2" }
  };
  const about = {
    _id: "about",
    source: "about.md",
    path: "about/",
    title: "About",
    layout: "page"
  };
  const collections = {
    posts: { each: callback => [post, topic].forEach(callback) },
    pages: { each: callback => [about].forEach(callback) },
    data: { "topic/v2": { name: "V2" } }
  };
  const themeConfig = {
    brand: { name: "Stellar" },
    profiles: { post: { active_menu: "post" } }
  };

  processContentConfig({
    source_dir: sourceDir,
    config: { title: "Site", theme_config: themeConfig },
    theme: { config: themeConfig },
    stellar: { config: parseStellarConfig({ themeConfig }) },
    locals: { get: key => collections[key] }
  });

  const renderedPost = attachPageViewModel({
    ...post,
    permalink: "https://example.com/post/",
    content: "<p>Post</p>",
    excerpt: "<p>Post</p>"
  });
  assert.equal(renderedPost.viewModel.collection.profile, "post");
  assert.equal(Object.isFrozen(renderedPost.viewModel), true);
  assert.equal(post.viewModel, undefined);
  assert.equal(getPageConfig({ ...topic }), topic.stellarConfig);
  assert.equal(topic.viewModel.collection.profile, "topic");
  assert.equal(Object.isFrozen(topic.viewModel), true);
  assert.equal(about.viewModel, undefined);
});

test("Post profile 严格拒绝已迁移内容默认值的未知键与错误类型", () => {
  assert.throws(() => buildPostPageViewModel({
    themeSource: "_config.stellar.yml",
    themeConfig: {
      article: {
        author: 42,
        footer: { share: {} }
      },
      comments: { provider: "giscus" }
    },
    frontMatter: { title: "Strict", layout: "post" },
    page: { title: "Strict", layout: "post" }
  }), error => {
    assert.match(error.message, /未知字段 article\.author/);
    assert.match(error.message, /article\.footer\.share 应为 array/);
    return true;
  });
});

test("Post profile 严格校验全部已迁移内容配置袋", () => {
  assert.throws(() => buildPostPageViewModel({
    themeSource: "_config.stellar.yml",
    themeConfig: {
      article: {
        listing: { cover_ratio: "wide" },
        style: "essay",
        category_colors: [],
        related_posts_limit: false,
        show_reading_time: "yes"
      }
    },
    frontMatter: { title: "Strict bags", layout: "post" },
    page: { title: "Strict bags", layout: "post" }
  }), error => {
    assert.match(error.message, /article\.listing\.cover_ratio 应为 number，实际为 string/);
    assert.match(error.message, /article\.style 的值不在 tech \| story/);
    assert.match(error.message, /article\.category_colors 应为 object，实际为 array/);
    assert.match(error.message, /article\.related_posts_limit 应为 number，实际为 boolean/);
    assert.match(error.message, /article\.show_reading_time 应为 boolean，实际为 string/);
    return true;
  });
});

test("Post 模型拒绝非普通配置对象而不是保留输入引用", () => {
  class CommentConfig {
    constructor() {
      this.repo = "owner/repo";
    }
  }
  const giscus = new CommentConfig();

  assert.throws(() => buildPostPageViewModel({
    source: "source/_posts/non-plain.md",
    themeConfig: {},
    frontMatter: {
      title: "Non Plain",
      layout: "post",
      comments: { provider: "giscus", options: giscus }
    },
    page: { title: "Non Plain", layout: "post" }
  }), /source\/_posts\/non-plain\.md: comments\.options 应为 object/);
});
