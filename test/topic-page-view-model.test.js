"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildTopicPageViewModel: buildTopicPageViewModelRaw } = require("../scripts/lib/models");
const { parseStellarConfig } = require("../scripts/lib/config-schema");
const { parseCollectionConfig, parsePageConfig } = require("../scripts/lib/content-config");
const processContentConfig = require("../scripts/events/lib/content-config");
const { attachPageViewModel } = require("../scripts/filters/lib/page-view-model");

function buildTopicPageViewModel(input) {
  return buildTopicPageViewModelRaw({
    ...input,
    collectionConfig: input.collectionConfig == null
      ? input.collectionConfig
      : parseCollectionConfig(input.collectionConfig, input.collectionSource),
    frontMatter: parsePageConfig(input.frontMatter, input.source),
    members: (input.members || []).map(member => ({
      ...member,
      frontMatter: parsePageConfig(member.frontMatter, member.source)
    })),
    stellarConfig: input.stellarConfig || parseStellarConfig({
      source: input.themeSource || "<theme>",
      themeConfig: input.themeConfig,
      siteConfig: input.siteConfig
    })
  });
}

function assertDeepFrozenPlain(value) {
  if (value == null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  if (!Array.isArray(value)) {
    assert.equal(Object.getPrototypeOf(value), Object.prototype);
  }
  Object.values(value).forEach(assertDeepFrozenPlain);
}

function topicMember(id, title, date, options = {}) {
  const topicId = options.topicId || "stellar-v2";
  const frontMatter = {
    title,
    layout: "post",
    collection: { profile: "topic", id: topicId }
  };
  if (options.visibility != null) frontMatter.visibility = options.visibility;
  return {
    source: `source/_posts/${id}.md`,
    frontMatter,
    page: {
      _id: id,
      source: `_posts/${id}.md`,
      path: `/topic/${id}/index.html`,
      title,
      layout: "post",
      date: new Date(date)
    }
  };
}

test("Topic profile 生成同构且深度冻结的 PageViewModel", () => {
  const current = topicMember("current", "Current", "2026-08-20T00:00:00.000Z");
  const latest = topicMember("latest", "Latest", "2026-08-22T00:00:00.000Z");
  const hidden = topicMember("hidden", "Hidden", "2026-08-23T00:00:00.000Z", {
    visibility: { listed: false, searchable: true }
  });
  const other = topicMember("other", "Other", "2026-08-24T00:00:00.000Z", {
    topicId: "other"
  });
  const collectionConfig = {
    name: "Stellar v2",
    headline: "Build the future",
    tagline: "A strict series",
    description: "Topic description",
    audience: "Theme developers",
    identity: { icon: "/topic.svg" },
    source: { repository: "xaoxuu/hexo-theme-stellar", branch: "v2" },
    route: { path: "/columns/stellar-v2/index.html" },
    navigation: { breadcrumb: false },
    listing: { priority: 3, excerpt_length: 96, per_page: 10, order_by: "-date" },
    card: { cover: "/cover.webp", tagline: "Collection card" },
    hero: { enabled: true, background: { image: "/hero.webp" } },
    sidebar: { left: { widgets: ["recent"] } },
    article: { type: "story", indent: true },
    footer: { license: "Topic license", share: false },
    comments: { enabled: true, title: "Topic comments", provider: "giscus", options: {} }
  };
  const viewModel = buildTopicPageViewModel({
    source: current.source,
    collectionSource: "source/_data/topic/stellar-v2.yml",
    collectionListed: false,
    siteConfig: { title: "Site", subtitle: "Subtitle" },
    themeConfig: {
      site: {
        brand: {
          image: { src: "/avatar.webp", variant: "avatar" },
          name: "Site Brand",
          tagline: "Site tagline",
          url: "/"
        }
      },
      layout: { profiles: {
        topic_index: { path: "/topic/" },
        post: {
          navigation: { active_menu: "post" },
          sidebar: {
            left: { widgets: ["global-left"] },
            right: { widgets: ["toc"] }
          }
        },
        topic: { navigation: { active_menu: "post" } }
      } },
      content: { article: {
        type: "tech",
        indent: false,
        footer: { license: "Global", share: true }
      } },
      comments: { enabled: true, title: "Global", service: "artalk" }
    },
    collectionConfig,
    members: [current, latest, hidden, other],
    frontMatter: {
      ...current.frontMatter,
      navigation: { menu: "", breadcrumb: false },
      sidebar: { left: { widgets: [] } },
      article: { indent: false },
      footer: { license: "", share: false },
      comments: { enabled: false, title: "" },
      listing: { priority: 0 },
      visibility: { listed: true, searchable: false },
      source: { branch: "page-branch" }
    },
    page: current.page
  });

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
  assert.equal(viewModel.collection.id, "stellar-v2");
  assert.equal(viewModel.collection.profile, "topic");
  assert.deepEqual(viewModel.collection.identity, {
    name: "Stellar v2",
    headline: "Build the future",
    tagline: "A strict series",
    description: "Topic description",
    audience: "Theme developers",
    icon: "/topic.svg"
  });
  assert.deepEqual(viewModel.collection.source, {
    repository: "xaoxuu/hexo-theme-stellar",
    branch: "v2"
  });
  assert.deepEqual(viewModel.collection.route, {
    baseDir: "topic",
    path: "columns/stellar-v2",
    start: ""
  });
  assert.equal(viewModel.collection.navigation.menu, "post");
  assert.equal(viewModel.collection.navigation.breadcrumb, false);
  assert.deepEqual(viewModel.collection.navigation.series, [
    {
      id: "latest",
      title: "Latest",
      path: "topic/latest",
      date: "2026-08-22T00:00:00.000Z",
      current: false
    },
    {
      id: "current",
      title: "Current",
      path: "topic/current",
      date: "2026-08-20T00:00:00.000Z",
      current: true
    }
  ]);
  assert.deepEqual(viewModel.collection.listing, {
    priority: 3,
    sort: null,
    excerptLength: 96,
    perPage: 10,
    orderBy: "-date"
  });
  assert.deepEqual(viewModel.collection.visibility, { listed: false, searchable: true });
  assert.deepEqual(viewModel.item.source, {
    file: "_posts/current.md",
    repository: "xaoxuu/hexo-theme-stellar",
    branch: "page-branch"
  });
  assert.deepEqual(viewModel.item.presentation.sidebar.left.widgets, []);
  assert.equal(viewModel.item.presentation.sidebar.left.brand.name, "Site Brand");
  assert.equal(viewModel.item.presentation.article.type, "story");
  assert.equal(viewModel.item.presentation.article.indent, false);
  assert.equal(viewModel.item.presentation.footer.license, "");
  assert.equal(viewModel.item.presentation.comments.enabled, false);
  assert.equal(viewModel.item.listing.priority, 0);
  assert.deepEqual(viewModel.item.visibility, { listed: true, searchable: false });
  assertDeepFrozenPlain(viewModel);

  collectionConfig.name = "Changed";
  latest.page.title = "Changed";
  assert.equal(viewModel.collection.identity.name, "Stellar v2");
  assert.equal(viewModel.collection.navigation.series[0].title, "Latest");
});

test("Topic profile 只接受匹配的严格 v2 collection 归属", () => {
  const base = {
    source: "source/_posts/topic.md",
    collectionSource: "source/_data/topic/stellar-v2.yml",
    themeConfig: {},
    collectionConfig: { name: "Stellar v2" },
    members: [],
    page: { title: "Topic", layout: "post" }
  };

  assert.throws(() => buildTopicPageViewModel({
    ...base,
    frontMatter: { title: "Topic", layout: "post" }
  }), /source\/_posts\/topic\.md: collection\.profile 必须是 topic/);
  assert.throws(() => buildTopicPageViewModel({
    ...base,
    collectionId: "stellar-v2",
    frontMatter: {
      title: "Topic",
      layout: "post",
      collection: { profile: "wiki", id: "stellar-v2" }
    }
  }), /source\/_posts\/topic\.md: collection\.profile 必须是 topic/);
  assert.throws(() => buildTopicPageViewModel({
    ...base,
    collectionId: "other",
    frontMatter: {
      title: "Topic",
      layout: "post",
      collection: { profile: "topic", id: "stellar-v2" }
    }
  }), /source\/_posts\/topic\.md: collection\.id stellar-v2 与 Topic other 不匹配/);
  assert.throws(() => buildTopicPageViewModel({
    ...base,
    themeSource: "_config.stellar.yml",
    themeConfig: {
      layout: { profiles: {
        topic_index: { path: 42 },
        topic: { navigation: "post" }
      } }
    },
    frontMatter: {
      title: "Topic",
      layout: "post",
      collection: { profile: "topic", id: "stellar-v2" }
    }
  }), error => {
    assert.match(error.message, /_config\.stellar\.yml: layout\.profiles\.topic_index\.path 应为 string \| null/);
    assert.match(error.message, /_config\.stellar\.yml: layout\.profiles\.topic\.navigation 应为 object/);
    return true;
  });
});

test("生成前事件为严格 Topic 成员挂载模型并拒绝缺失集合", t => {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-topic-view-model-"));
  t.after(() => fs.rmSync(sourceDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(sourceDir, "_posts"));
  fs.writeFileSync(path.join(sourceDir, "_posts/first.md"), "---\ntitle: First\nlayout: post\ncollection:\n  profile: topic\n  id: v2\n---\n");
  fs.writeFileSync(path.join(sourceDir, "_posts/second.md"), "---\ntitle: Second\nlayout: post\ncollection:\n  profile: topic\n  id: v2\n---\n");
  fs.writeFileSync(path.join(sourceDir, "_posts/plain.md"), "---\ntitle: Plain\nlayout: post\n---\n");

  class MomentLike {
    constructor(value) {
      this.value = value;
    }

    toISOString() {
      return this.value;
    }
  }

  class HexoPostDocument {
    constructor(values) {
      Object.assign(this, values);
    }
  }

  const first = new HexoPostDocument({
    _id: "first",
    source: "_posts/first.md",
    path: "first/",
    title: "First",
    layout: "post",
    date: new MomentLike("2026-08-20T00:00:00.000Z")
  });
  const second = {
    _id: "second",
    source: "_posts/second.md",
    path: "second/",
    title: "Second",
    layout: "post",
    date: new Date("2026-08-22T00:00:00.000Z")
  };
  const plain = {
    _id: "plain",
    source: "_posts/plain.md",
    path: "plain/",
    title: "Plain",
    layout: "post"
  };
  const data = {
    "topic/v2": {
      name: "V2",
      route: { path: "/topic/v2/" },
      listing: { order_by: "-date" }
    }
  };
  const themeConfig = {
    site: { brand: { name: "Stellar" } },
    layout: { profiles: {
      topic_index: { path: "/topic/" },
      post: { navigation: { active_menu: "post" } },
      topic: { navigation: { active_menu: "post" } }
    } }
  };
  const ctx = {
    source_dir: sourceDir,
    config: { title: "Site", theme_config: themeConfig },
    theme: { config: themeConfig },
    stellar: { config: parseStellarConfig({ themeConfig }) },
    locals: {
      get: key => ({
        posts: { each: callback => [first, second, plain].forEach(callback) },
        pages: { each: () => {} },
        data
      })[key]
    }
  };

  processContentConfig(ctx);

  assert.equal(first.viewModel.collection.profile, "topic");
  assert.deepEqual(first.viewModel.collection.navigation.series.map(item => item.id), ["second", "first"]);
  assert.equal(first.viewModel.item.date, "2026-08-20T00:00:00.000Z");
  assert.equal(first.viewModel.collection.navigation.series[1].date, "2026-08-20T00:00:00.000Z");
  assertDeepFrozenPlain(first.viewModel);
  assert.equal(second.viewModel.collection.profile, "topic");
  const renderedPlain = attachPageViewModel({
    ...plain,
    permalink: "https://example.com/plain/",
    content: "<p>Plain</p>",
    excerpt: "<p>Plain</p>"
  });
  assert.equal(renderedPlain.viewModel.collection.profile, "post");
  assert.equal(plain.viewModel, undefined);

  fs.writeFileSync(path.join(sourceDir, "_posts/missing.md"), "---\ntitle: Missing\nlayout: post\ncollection:\n  profile: topic\n  id: missing\n---\n");
  const missing = {
    _id: "missing",
    source: "_posts/missing.md",
    path: "missing/",
    title: "Missing",
    layout: "post"
  };
  const missingCtx = {
    ...ctx,
    locals: {
      get: key => ({
        posts: { each: callback => [missing].forEach(callback) },
        pages: { each: () => {} },
        data
      })[key]
    }
  };
  assert.throws(() => processContentConfig(missingCtx), /source\/_posts\/missing\.md: collection\.id 无法解析 Topic missing/);
});
