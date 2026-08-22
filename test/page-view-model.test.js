"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildPostPageViewModel } = require("../scripts/lib/models");
const processContentConfig = require("../scripts/events/lib/content-config");

function assertDeepFrozen(value) {
  if (value == null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  if (!Array.isArray(value)) {
    assert.equal(Object.getPrototypeOf(value), Object.prototype);
  }
  Object.values(value).forEach(assertDeepFrozen);
}

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
