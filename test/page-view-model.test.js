"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  buildPostPageViewModel,
  buildWikiPageViewModel
} = require("../scripts/lib/models");
const processContentConfig = require("../scripts/events/lib/content-config");
const processWikiTree = require("../scripts/events/lib/doc_tree");

function assertDeepFrozen(value) {
  if (value == null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  if (!Array.isArray(value)) {
    assert.equal(Object.getPrototypeOf(value), Object.prototype);
  }
  Object.values(value).forEach(assertDeepFrozen);
}

test("合法 Wiki profile 生成与 Post 同构的冻结 PageViewModel", () => {
  const viewModel = buildWikiPageViewModel({
    source: "source/wiki/stellar/index.md",
    collectionSource: "source/_data/wiki/stellar.yml",
    themeConfig: {
      site_tree: {
        index_wiki: { base_dir: "wiki" },
        wiki: {
          navigation: { menu: "wiki" },
          sidebar: {
            left: { widgets: ["tree", "related"] },
            right: { widgets: ["toc"] }
          }
        }
      },
      article: { type: "tech", indent: false, license: "Global license", share: true },
      comments: { service: "giscus" }
    },
    collectionConfig: {
      name: "Stellar",
      headline: "每个人的独立博客",
      tagline: "基于 Hexo 的全能型个人知识库",
      description: "Stellar Wiki",
      audience: "独立博主",
      identity: { icon: "/stellar.svg" },
      source: { repository: "xaoxuu/hexo-theme-stellar", branch: "v2" },
      routing: { base_dir: "/wiki/stellar/" },
      listing: { priority: 2, sort: 10, excerpt_length: 128, per_page: 20, order_by: "updated" },
      navigation: { breadcrumb: true },
      card: { cover: "/cover.webp" },
      hero: { enabled: true, background: { image: "/hero.webp" } },
      sidebar: { left: { search: true } },
      article: { indent: true },
      footer: { share: false },
      comments: { enabled: true, title: "Wiki comments" },
      tree: { "快速开始": ["index", "install"] }
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
    frontMatter: {
      title: "开始",
      layout: "wiki",
      collection: { type: "wiki", id: "stellar" }
    },
    page: {
      _id: "wiki-home",
      source: "wiki/stellar/index.md",
      path: "wiki/stellar/index.html",
      permalink: "https://example.com/wiki/stellar/",
      title: "开始",
      layout: "wiki",
      content: "<p>Start</p>",
      date: new Date("2026-08-22T08:00:00.000Z")
    }
  });

  assert.deepEqual(Object.keys(viewModel), ["collection", "item"]);
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
    sort: 10,
    excerptLength: 128,
    perPage: 20,
    orderBy: "updated"
  });
  assert.deepEqual(viewModel.collection.visibility, { listed: true, searchable: true });
  assert.equal(viewModel.item.source.repository, "xaoxuu/hexo-theme-stellar");
  assert.equal(viewModel.item.navigation.menu, "wiki");
  assert.equal(viewModel.item.navigation.breadcrumb, true);
  assert.equal(viewModel.item.presentation.article.indent, true);
  assert.equal(viewModel.item.presentation.banner.image, "/hero.webp");
  assert.equal(viewModel.item.presentation.footer.share, false);
  assert.equal(viewModel.item.presentation.comments.title, "Wiki comments");
  assertDeepFrozen(viewModel);
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
    "  type: wiki",
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
    collection: { type: "wiki", id: "stellar" }
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
      routing: { base_dir: "/wiki/stellar/" },
      tree: ["index"]
    }
  };
  const themeConfig = {
    site_tree: {
      index_wiki: { base_dir: "wiki" },
      wiki: { navigation: { menu: "wiki" } }
    },
    article: { indent: true },
    comments: { service: "giscus" }
  };
  const collections = { data, pages: [wikiPage, ordinaryPage] };

  processWikiTree({
    source_dir: sourceDir,
    config: {
      theme_config: {
        site_tree: { wiki: { navigation: { menu: "wiki" } } }
      }
    },
    theme: { config: themeConfig },
    locals: { get: key => collections[key] }
  });

  assert.equal(wikiPage.viewModel.collection.id, "stellar");
  assert.equal(wikiPage.viewModel.collection.profile, "wiki");
  assert.equal(wikiPage.viewModel.collection.navigation.tree[0].items[0].title, "Start");
  assert.equal(wikiPage.viewModel.item.presentation.article.indent, true);
  assert.equal(wikiPage.viewModel.item.presentation.comments.service, "giscus");
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
      collection: { type: "wiki", id: "missing" }
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
      collection: { type: "wiki", id: "stellar" }
    },
    page: { title: "Legacy", layout: "wiki" }
  }), /source\/wiki\/stellar\/legacy\.md: v1 字段 wiki 已移除/);

  assert.throws(() => buildWikiPageViewModel({
    source: "source/wiki/stellar/mismatch.md",
    collectionSource: "source/_data/wiki/other.yml",
    themeConfig: {},
    collectionId: "other",
    collectionConfig: { name: "Other" },
    frontMatter: {
      title: "Mismatch",
      layout: "wiki",
      collection: { type: "wiki", id: "stellar" }
    },
    page: { title: "Mismatch", layout: "wiki" }
  }), /source\/wiki\/stellar\/mismatch\.md: collection\.id stellar 与 Wiki 项目 other 不匹配/);
});

test("Wiki 模型隔离输入引用并区分项目与页面可见性", () => {
  const collectionConfig = {
    name: "Private Wiki",
    source: { repository: "owner/wiki", branch: "main" },
    hero: { background: { image: "/collection-hero.webp" } },
    sidebar: { left: { widgets: ["tree"] } },
    tree: ["index"]
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
      collection: { type: "wiki", id: "private" },
      banner: { image: "/page-banner.webp" },
      source: { branch: "page" },
      visibility: { listed: true, searchable: false }
    },
    page: { _id: "home", title: "Home", layout: "wiki", path: "/wiki/private/index.html" }
  });

  collectionConfig.name = "Changed";
  collectionConfig.sidebar.left.widgets.push("changed");
  collectionState.sections[0].pages[0].title = "Changed";

  assert.deepEqual(viewModel.collection.visibility, { listed: false, searchable: true });
  assert.deepEqual(viewModel.item.visibility, { listed: true, searchable: false });
  assert.deepEqual(viewModel.item.source, {
    file: "source/wiki/private/index.md",
    repository: "owner/wiki",
    branch: "page"
  });
  assert.equal(viewModel.collection.identity.name, "Private Wiki");
  assert.deepEqual(viewModel.collection.presentation.sidebar.left.widgets, ["tree"]);
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
        image: { src: "/avatar.webp", style: "avatar" },
        name: "Stellar",
        tagline: "独立博客",
        url: "/"
      },
      site_tree: {
        index_blog: { base_dir: "blog" },
        post: {
          navigation: { menu: "post" },
          sidebar: {
            left: { widgets: ["recent"] },
            right: { widgets: ["toc"] }
          }
        }
      },
      article: {
        pin_style: "carousel",
        card_style: "hero",
        auto_excerpt: 128,
        type: "tech",
        indent: false,
        license: "CC BY-NC-SA 4.0",
        share: false
      },
      comments: { service: "giscus" }
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

  assert.deepEqual(Object.keys(viewModel), ["collection", "item"]);
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
  assert.equal(viewModel.item.title, "Hello");
  assert.deepEqual(viewModel.item.tags, ["Hexo"]);
  assert.deepEqual(viewModel.item.categories, ["开发"]);
  assertDeepFrozen(viewModel);
});

test("Post 配置级联保留 false、0、空字符串和 Brand 图片原子覆盖", () => {
  const viewModel = buildPostPageViewModel({
    source: "source/_posts/cascade.md",
    siteConfig: {},
    themeConfig: {
      brand: { name: "Global" },
      site_tree: {
        post: {
          navigation: { menu: "post", breadcrumb: true },
          sidebar: {
            left: {
              widgets: ["recent"],
              brand: {
                image: { src: "/profile.svg", style: "icon", background: "red" },
                name: "Profile"
              }
            },
            right: { widgets: ["toc"] }
          }
        }
      },
      article: {
        type: "tech",
        indent: true,
        license: "Global license",
        share: true
      },
      comments: {
        enabled: true,
        title: "Global title",
        service: "giscus"
      }
    },
    frontMatter: {
      title: "Cascade",
      navigation: { menu: "", breadcrumb: false },
      sidebar: {
        left: {
          widgets: [],
          brand: { image: { src: "/page.svg", style: "plain" } }
        }
      },
      article: { indent: false },
      footer: { license: "", share: false },
      comments: { enabled: false, title: "" },
      listing: { priority: 0 },
      visibility: { listed: false, searchable: true }
    },
    page: { _id: "cascade", layout: "post", title: "Cascade" }
  });

  assert.deepEqual(viewModel.item.navigation, { menu: "", breadcrumb: false });
  assert.deepEqual(viewModel.item.presentation.sidebar.left.widgets, []);
  assert.deepEqual(viewModel.item.presentation.sidebar.left.brand.image, {
    src: "/page.svg",
    style: "plain"
  });
  assert.equal(viewModel.item.presentation.sidebar.left.brand.name, "Profile");
  assert.equal(viewModel.item.presentation.article.indent, false);
  assert.equal(viewModel.item.presentation.footer.license, "");
  assert.equal(viewModel.item.presentation.footer.share, false);
  assert.equal(viewModel.item.presentation.comments.enabled, false);
  assert.equal(viewModel.item.presentation.comments.title, "");
  assert.equal(viewModel.item.listing.priority, 0);
  assert.deepEqual(viewModel.item.visibility, { listed: false, searchable: true });
});

test("Post profile 错误包含配置来源和字段路径", () => {
  assert.throws(() => buildPostPageViewModel({
    source: "source/_posts/error.md",
    themeSource: "_config.stellar.yml",
    themeConfig: {
      site_tree: {
        post: { navigation: "post" }
      }
    },
    frontMatter: { title: "Error", layout: "post" },
    page: { title: "Error", layout: "post" }
  }), /_config\.stellar\.yml: site_tree\.post\.navigation 应为 object，实际为 string/);
});

test("Post 模型规范化 Hexo 值且不保留输入引用", () => {
  const brand = {
    image: { src: "/avatar.webp", style: "avatar" },
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
    assert.match(error.message, /source\/_posts\/legacy\.md: v1 字段 cover 已移除/);
    assert.match(error.message, /source\/_posts\/legacy\.md: 未知字段 root\.mystery/);
    assert.match(error.message, /source\/_posts\/legacy\.md: visibility\.listed 应为 boolean，实际为 string/);
    return true;
  });
});

test("生成前事件只为普通 Post 挂载 PageViewModel", t => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-page-view-model-"));
  t.after(() => fs.rmSync(sourceDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(sourceDir, "_posts"));
  fs.writeFileSync(path.join(sourceDir, "_posts/post.md"), "---\ntitle: Post\nlayout: post\n---\n");
  fs.writeFileSync(path.join(sourceDir, "_posts/topic.md"), "---\ntitle: Topic\nlayout: post\ncollection:\n  type: topic\n  id: v2\n---\n");
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
    collection: { type: "topic", id: "v2" }
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
    data: {}
  };
  const themeConfig = {
    brand: { name: "Stellar" },
    site_tree: { post: { navigation: { menu: "post" } } }
  };

  processContentConfig({
    source_dir: sourceDir,
    config: { title: "Site", theme_config: themeConfig },
    theme: { config: themeConfig },
    locals: { get: key => collections[key] }
  });

  assert.equal(post.viewModel.collection.profile, "post");
  assert.equal(Object.isFrozen(post.viewModel), true);
  assert.equal(topic.viewModel, undefined);
  assert.equal(about.viewModel, undefined);
});

test("Post profile 严格拒绝消费字段的未知键与错误类型", () => {
  assert.throws(() => buildPostPageViewModel({
    themeSource: "_config.stellar.yml",
    themeConfig: {
      site_tree: {
        index_blog: { base_dir: "blog", mystery: true }
      },
      article: {
        author: 42,
        share: {}
      },
      comments: {
        service: "giscus",
        giscus: "bad"
      }
    },
    frontMatter: { title: "Strict", layout: "post" },
    page: { title: "Strict", layout: "post" }
  }), error => {
    assert.match(error.message, /未知字段 site_tree\.index_blog\.mystery/);
    assert.match(error.message, /未知字段 article\.author/);
    assert.match(error.message, /article\.share 应为 boolean \| string\[\]/);
    assert.match(error.message, /comments\.giscus 应为 object，实际为 string/);
    return true;
  });
});

test("Post profile 严格校验全部已声明配置袋", () => {
  assert.throws(() => buildPostPageViewModel({
    themeSource: "_config.stellar.yml",
    themeConfig: {
      site_tree: {
        index_blog: {
          navigation: "post",
          sidebar: []
        }
      },
      article: {
        cover_ratio: "wide",
        ai_label: 42,
        category_color: [],
        related_posts: false,
        reading_time: "yes"
      },
      comments: { custom_css: 42 }
    },
    frontMatter: { title: "Strict bags", layout: "post" },
    page: { title: "Strict bags", layout: "post" }
  }), error => {
    assert.match(error.message, /site_tree\.index_blog\.navigation 应为 object，实际为 string/);
    assert.match(error.message, /site_tree\.index_blog\.sidebar 应为 object，实际为 array/);
    assert.match(error.message, /article\.cover_ratio 应为 finite number，实际为 string/);
    assert.match(error.message, /article\.ai_label 应为 object，实际为 number/);
    assert.match(error.message, /article\.category_color 应为 object，实际为 array/);
    assert.match(error.message, /article\.related_posts 应为 object，实际为 boolean/);
    assert.match(error.message, /article\.reading_time 应为 boolean，实际为 string/);
    assert.match(error.message, /comments\.custom_css 应为 string \| string\[\]，实际为 number/);
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
      comments: { service: "giscus", giscus }
    },
    page: { title: "Non Plain", layout: "post" }
  }), /source\/_posts\/non-plain\.md: comments\.giscus 应为 object/);
});
