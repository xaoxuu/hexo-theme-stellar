"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  buildTopicIndexRender,
  buildTopicPageViewModel: buildTopicPageViewModelRaw,
  buildTopicPageViewModelBase: buildTopicPageViewModelBaseRaw,
  completeTopicPageViewModel
} = require("../scripts/lib/models");
const { parseStellarConfig } = require("../scripts/lib/config-schema");
const { parseCollectionConfig, parsePageConfig } = require("../scripts/lib/content-config");
const processContentConfig = require("../scripts/events/lib/content-config");
const { attachPageViewModel } = require("../scripts/filters/lib/page-view-model");
const {
  getTopicViewModelBase,
  getTopicViewModelInput
} = require("../scripts/lib/page-view-model-registry");

function normalizeTopicInput(input) {
  return {
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
  };
}

function buildTopicPageViewModel(input) {
  return buildTopicPageViewModelRaw(normalizeTopicInput(input));
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
    listing: { priority: 3, excerpt_length: 96, per_page: 10, sort: { field: "date", direction: "desc" } },
    card: { cover: "/cover.webp", tagline: "Collection card" },
    hero: { enabled: true, background: { image: "/hero.webp" } },
    regions: { leftbar: { widgets: ["recent"] } },
    article: { style: "story", paragraph_indent: "always" },
    footer: { license: "Topic license", share: false },
    comments: { enabled: true, title: "Topic comments", provider: "giscus", options: {} }
  };
  const input = {
    source: current.source,
    collectionSource: "source/_data/topic/stellar-v2.yml",
    collectionListed: false,
    siteConfig: { title: "Site", subtitle: "Subtitle" },
    themeConfig: {
      site: {
        brand: {
          image: { src: "/avatar.webp", variant: "avatar" },
          name: "Site Brand",
          tagline: "Site tagline"
        }
      },
      layout: { profiles: {
        topic_index: { path: "/topic/" },
        post: {
          navigation: { active_menu: "post" },
          regions: {
            leftbar: { widgets: ["global-left"] },
            rightbar: { widgets: ["toc"] }
          }
        },
        topic: { navigation: { active_menu: "post" } }
      } },
      content: { article: {
        style: "tech",
        paragraph_indent: "never",
        footer: { license: "Global", share: ["link"] },
        related_posts_limit: 2
      } },
      extensions: { comments: { title: "Global", provider: "artalk" } }
    },
    collectionConfig,
    members: [current, latest, hidden, other],
    frontMatter: {
      ...current.frontMatter,
      navigation: { menu: "", breadcrumb: false },
      regions: { leftbar: { widgets: [] } },
      article: { paragraph_indent: "never" },
      footer: { license: false, share: false },
      comments: { enabled: false, title: "" },
      listing: { priority: 0 },
      visibility: { listed: true, searchable: false },
      source: { branch: "page-branch" }
    },
    page: {
      ...current.page,
      previous: { title: "Newer", path: "blog/newer/", date: "2026-08-21T00:00:00.000Z" },
      next: { title: "Older", path: "blog/older/", date: "2026-08-19T00:00:00.000Z" }
    },
    relatedItems: [{ title: "Related", path: "/blog/related/", excerpt: "<p>Related excerpt</p>" }],
    runtimeData: {
      widgets: {
        "global-left": { layout: "recent" },
        recent: { layout: "recent" },
        related: { layout: "related" },
        ghrepo: { layout: "ghrepo" },
        toc: { layout: "toc" }
      }
    }
  };
  const normalizedInput = normalizeTopicInput(input);
  const base = buildTopicPageViewModelBaseRaw(normalizedInput);
  assertDeepFrozenPlain(base);
  assert.deepEqual(Object.keys(base), ["collection"]);
  const viewModel = completeTopicPageViewModel(normalizedInput, base);

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
  assert.deepEqual(Object.keys(viewModel), ["collection", "item", "render"]);
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
    order: null,
    cardStyle: "hero",
    excerptLength: 96,
    perPage: 10,
    sort: { field: "date", direction: "desc" }
  });
  assert.deepEqual(viewModel.collection.visibility, { listed: false, searchable: true });
  assert.deepEqual(viewModel.collection.presentation.card, {
    cover: "/cover.webp",
    tagline: "Collection card"
  });
  assert.deepEqual(viewModel.item.source, {
    file: "_posts/current.md",
    repository: "xaoxuu/hexo-theme-stellar",
    branch: "page-branch"
  });
  assert.deepEqual(viewModel.item.presentation.card, {});
  assert.deepEqual(viewModel.item.presentation.regions.leftbar.widgets, []);
  assert.equal(viewModel.item.presentation.article.style, "story");
  assert.equal(viewModel.item.presentation.article.paragraphIndent, "never");
  assert.equal(viewModel.item.presentation.footer.license, false);
  assert.equal(viewModel.item.presentation.comments.enabled, false);
  assert.equal(viewModel.item.presentation.banner.image, "/hero.webp");
  assert.equal(viewModel.item.listing.priority, 0);
  assert.deepEqual(viewModel.item.visibility, { listed: true, searchable: false });
  assert.equal(viewModel.render.document.preferredTheme, "auto");
  assert.equal(viewModel.render.layout.blogPath, "topic");
  assert.equal(viewModel.render.layout.brands.site.name, "Site Brand");
  assert.equal(viewModel.render.layout.brands.site.href, "/");
  assert.equal(viewModel.render.layout.brands.collection.name, "Stellar v2");
  assert.equal(viewModel.render.layout.brands.collection.href, "columns/stellar-v2");
  assert.equal(Object.hasOwn(viewModel.render.layout.brands.site, "github"), false);
  assert.equal(Object.hasOwn(viewModel.render.layout.brands.collection, "github"), false);
  assert.equal(viewModel.render.layout.regions.leftbar.brand, "site_brand");
  assert.deepEqual(viewModel.render.layout.regions.leftbar.widgets, []);
  assert.equal(viewModel.render.layout.regions.leftbar.footer.actions, true);
  assert.deepEqual(viewModel.render.layout.regions.rightbar.widgets.map(widget => widget.id), ["ghrepo", "toc"]);
  assert.deepEqual(viewModel.render.layout.breadcrumbs, [{
    name: "Build the future",
    path: "topic/latest"
  }]);
  assert.equal(viewModel.render.seo.title, "Current - Site");
  assert.equal(viewModel.render.seo.jsonLd["@type"], "BlogPosting");
  assert.equal(viewModel.render.article.banner.image, "/hero.webp");
  assert.equal(viewModel.render.article.footer.license, "");
  assert.equal(viewModel.render.article.footer.share, null);
  assert.equal(viewModel.render.article.previous.path, "blog/newer");
  assert.equal(viewModel.render.article.next.path, "blog/older");
  assert.equal(viewModel.render.article.related.items[0].title, "Related");
  assert.equal(viewModel.render.article.comments.enabled, false);
  assert.equal(viewModel.render.listing.cardStyle, "hero");
  assert.equal(viewModel.render.listing.cover, "");
  assert.equal(viewModel.render.listing.caption, "");
  assert.equal(viewModel.render.listing.listed, true);
  assert.equal(viewModel.render.listing.priority, 0);
  assertDeepFrozenPlain(viewModel);

  collectionConfig.name = "Changed";
  latest.page.title = "Changed";
  assert.equal(viewModel.collection.identity.name, "Stellar v2");
  assert.equal(viewModel.collection.navigation.series[0].title, "Latest");

  const topicIndex = buildTopicIndexRender({
    ...normalizedInput,
    collectionId: "stellar-v2"
  });
  assert.equal(topicIndex.cover, "/cover.webp");

  for (const cardLayout of ["hero", "classic"]) {
    const pageCardInput = normalizeTopicInput({
      ...input,
      themeConfig: {
        ...input.themeConfig,
        content: {
          article: {
            ...input.themeConfig.content.article,
            listing: { card_layout: cardLayout }
          }
        }
      },
      frontMatter: {
        ...input.frontMatter,
        card: { cover: "/page-cover.webp", tagline: "Page card" }
      }
    });
    const pageCardViewModel = buildTopicPageViewModelRaw(pageCardInput);
    assert.deepEqual(pageCardViewModel.item.presentation.card, {
      cover: "/page-cover.webp",
      tagline: "Page card"
    });
    assert.equal(pageCardViewModel.render.listing.cardStyle, cardLayout);
    assert.equal(pageCardViewModel.render.listing.cover, "/page-cover.webp");
    assert.equal(pageCardViewModel.render.listing.caption, "Page card");
  }
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
    assert.match(error.message, /_config\.stellar\.yml: layout\.profiles\.topic_index\.path 应为 string/);
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
      listing: { sort: { field: "date", direction: "desc" } }
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
  const registeredInput = getTopicViewModelInput(first);
  const registeredBase = getTopicViewModelBase(first);
  assert.equal(Object.isFrozen(registeredInput), true);
  assert.equal(Object.hasOwn(registeredInput, "relatedItems"), false);
  assertDeepFrozenPlain(registeredBase);
  const renderedFirst = attachPageViewModel.call(ctx, {
    ...first,
    content: "<p>Rendered Topic</p>",
    excerpt: "<p>Rendered excerpt</p>",
    prev: { title: "Previous", path: "previous/", date: new Date("2026-08-21T00:00:00.000Z") }
  });
  assert.equal(renderedFirst.viewModel.item.content, "<p>Rendered Topic</p>");
  assert.equal(renderedFirst.viewModel.render.article.previous.path, "previous");
  assert.equal(Object.hasOwn(registeredInput, "relatedItems"), false);
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
  assert.throws(() => processContentConfig(missingCtx), /source\/_posts\/missing\.md: collection 应为 one registered Collection; candidates=<none>.*实际为 collection:topic:missing/);
});
