"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildNotebookPageViewModel,
  buildPostCollectionModel,
  buildPostPageViewModel,
  buildTopicPageViewModel,
  buildWikiPageViewModel
} = require("../scripts/lib/models");
const { parseStellarConfig } = require("../scripts/lib/config-schema");
const { assertPageViewModel } = require("../scripts/lib/model-schema");
const { parseCollectionConfig, parsePageConfig } = require("../scripts/lib/content-config");
const { heroEffectDefinitions } = require("../scripts/lib/hero-effect-registry");
const { SHARE_SERVICE_IDS } = require("../scripts/lib/share-services");

const stellarConfig = parseStellarConfig({ themeConfig: {}, siteConfig: {} });
const siteConfig = {
  title: "Site",
  url: "https://example.com",
  language: "zh-CN"
};

function page(id, layout = "post") {
  return {
    _id: id,
    source: `${id}.md`,
    path: `${id}/index.html`,
    permalink: `https://example.com/${id}/`,
    title: id,
    layout,
    content: ""
  };
}

function frontMatter(source, profile, id) {
  return parsePageConfig({
    title: id,
    ...(profile === "post" ? {} : { collection: { profile, id } })
  }, source);
}

function collection(profile, id) {
  return parseCollectionConfig({
    name: id,
    route: { path: `/${profile}/${id}/` }
  }, `source/_data/${profile}/${id}.yml`);
}

function postInput() {
  const source = "source/_posts/post.md";
  return {
    source,
    stellarConfig,
    siteConfig,
    frontMatter: frontMatter(source, "post", "post"),
    page: page("post")
  };
}

function wikiInput() {
  const source = "source/wiki/docs/index.md";
  return {
    source,
    collectionSource: "source/_data/wiki/docs.yml",
    collectionId: "docs",
    collectionConfig: collection("wiki", "docs"),
    collectionState: {
      homepage: { path: "wiki/docs/", title: "Docs" },
      sections: []
    },
    relatedCollections: [],
    stellarConfig,
    siteConfig,
    frontMatter: frontMatter(source, "wiki", "docs"),
    page: page("wiki/docs", "wiki")
  };
}

function topicInput() {
  const source = "source/_posts/topic.md";
  const topicPage = page("topic");
  const parsedFrontMatter = frontMatter(source, "topic", "topic");
  return {
    source,
    collectionSource: "source/_data/topic/topic.yml",
    collectionId: "topic",
    collectionConfig: collection("topic", "topic"),
    members: [{ source, frontMatter: parsedFrontMatter, page: topicPage }],
    stellarConfig,
    siteConfig,
    frontMatter: parsedFrontMatter,
    page: topicPage
  };
}

function notebookInput() {
  const source = "source/notes/dev/note.md";
  return {
    source,
    collectionSource: "source/_data/notebooks/dev.yml",
    collectionId: "dev",
    collectionConfig: collection("notebook", "dev"),
    collectionItems: [],
    stellarConfig,
    siteConfig,
    frontMatter: frontMatter(source, "notebook", "dev"),
    page: page("notes/dev/note", "page")
  };
}

function assertDeepFrozen(value) {
  if (value == null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  Object.values(value).forEach(assertDeepFrozen);
}

test("all PageViewModel profiles conform to Schema and use the shared frozen pipeline", () => {
  const cases = [
    ["post", buildPostPageViewModel, postInput()],
    ["wiki", buildWikiPageViewModel, wikiInput()],
    ["topic", buildTopicPageViewModel, topicInput()],
    ["notebook", buildNotebookPageViewModel, notebookInput()]
  ];

  for (const [profile, build, input] of cases) {
    const viewModel = build(input);
    assert.deepEqual(Object.keys(viewModel), ["collection", "item", "render"]);
    assert.equal(viewModel.collection.profile, profile);
    assert.equal(assertPageViewModel(profile, viewModel), viewModel);
    assertDeepFrozen(viewModel);
  }
});

test("Post PageViewModels reuse a prebuilt frozen CollectionModel", () => {
  const collectionModel = buildPostCollectionModel(stellarConfig);
  const first = buildPostPageViewModel({ ...postInput(), collectionModel });
  const secondInput = postInput();
  secondInput.page = page("second");
  secondInput.source = "source/_posts/second.md";
  const second = buildPostPageViewModel({ ...secondInput, collectionModel });

  assert.equal(first.collection, collectionModel);
  assert.equal(second.collection, collectionModel);
  assertDeepFrozen(collectionModel);
});

test("all PageViewModel profiles project the four document injection positions", () => {
  const cases = [
    [buildPostPageViewModel, postInput()],
    [buildWikiPageViewModel, wikiInput()],
    [buildTopicPageViewModel, topicInput()],
    [buildNotebookPageViewModel, notebookInput()]
  ];
  for (const [build, input] of cases) {
    input.frontMatter = parsePageConfig({
      ...input.frontMatter,
      inject: {
        head_begin: "<!-- head begin -->",
        head_end: "<!-- head end -->",
        body_begin: "<!-- body begin -->",
        body_end: "<!-- body end -->"
      }
    }, input.source);
    assert.deepEqual(build(input).render.document, {
      language: "zh-CN",
      headBeginInject: "<!-- head begin -->",
      headEndInject: "<!-- head end -->",
      bodyBeginInject: "<!-- body begin -->",
      bodyEndInject: "<!-- body end -->",
      preferredTheme: "auto"
    });
  }
});

test("Wiki Hero projects registered effect presentation without changing public options", () => {
  const [definition] = heroEffectDefinitions();
  assert.ok(definition);
  const options = definition.defaults;
  const input = wikiInput();
  input.collectionConfig = parseCollectionConfig({
    name: "Docs",
    route: { path: "/wiki/docs/" },
    hero: {
      enabled: true,
      background: {
        effect: { type: definition.id, options }
      }
    }
  }, input.collectionSource);
  const effect = buildWikiPageViewModel(input).render.cover.background.effect;
  assert.deepEqual(effect.options, options);
  assert.deepEqual(effect.presentation, definition.presentation(options));
});

test("Article PageViewModels preserve registered share service order", () => {
  const cases = [
    [buildPostPageViewModel, postInput(), "post", "post"],
    [buildWikiPageViewModel, wikiInput(), "wiki", "docs"],
    [buildNotebookPageViewModel, notebookInput(), "notebook", "dev"]
  ];
  for (const [build, input, profile, id] of cases) {
    input.frontMatter = parsePageConfig({
      title: id,
      ...(profile === "post" ? {} : { collection: { profile, id } }),
      footer: { share: SHARE_SERVICE_IDS }
    }, input.source);
    assert.deepEqual(build(input).render.article.footer.share.services, SHARE_SERVICE_IDS);
  }
});

test("Article PageViewModels defensively filter unknown share services", () => {
  for (const [build, input] of [
    [buildPostPageViewModel, postInput()],
    [buildWikiPageViewModel, wikiInput()],
    [buildNotebookPageViewModel, notebookInput()]
  ]) {
    input.frontMatter = {
      ...input.frontMatter,
      footer: { share: ["telegram", "unknown", "x"] }
    };
    assert.deepEqual(build(input).render.article.footer.share.services, ["telegram", "x"]);
  }
});

test("Article PageViewModels keep an explicit empty share list disabled", () => {
  for (const [build, input] of [
    [buildPostPageViewModel, postInput()],
    [buildWikiPageViewModel, wikiInput()],
    [buildNotebookPageViewModel, notebookInput()]
  ]) {
    input.frontMatter = {
      ...input.frontMatter,
      footer: { share: [] }
    };
    assert.equal(build(input).render.article.footer.share, null);
  }
});

test("Collection footer explicit true inherits Article defaults", () => {
  for (const [build, input] of [
    [buildWikiPageViewModel, wikiInput()],
    [buildTopicPageViewModel, topicInput()],
    [buildNotebookPageViewModel, notebookInput()]
  ]) {
    input.frontMatter = parsePageConfig({
      ...input.frontMatter,
      footer: { license: true, share: true }
    }, input.source);
    const article = build(input).render.article;
    assert.deepEqual(article.footer.share.services, SHARE_SERVICE_IDS);
    assert.match(article.footer.license, /署名-非商业性使用/);
  }
});

test("Notebook applies Collection visibility and footer.show_tags to Note output", () => {
  const input = notebookInput();
  input.collectionConfig = parseCollectionConfig({
    name: "dev",
    route: { path: "/notebook/dev/" },
    visibility: { listed: false, searchable: false },
    footer: { show_tags: false }
  }, input.collectionSource);
  input.frontMatter = parsePageConfig({
    title: "Note",
    collection: { profile: "notebook", id: "dev" },
    tags: ["tools/cli"]
  }, input.source);
  const viewModel = buildNotebookPageViewModel(input);
  assert.deepEqual(viewModel.collection.visibility, { listed: false, searchable: false });
  assert.deepEqual(viewModel.item.visibility, { listed: false, searchable: false });
  assert.deepEqual(viewModel.render.article.tags, []);
});

test("Collection PageViewModel builders reject mismatched ownership", () => {
  for (const [build, input] of [
    [buildWikiPageViewModel, { ...wikiInput(), collectionId: "other" }],
    [buildTopicPageViewModel, { ...topicInput(), collectionId: "other" }],
    [buildNotebookPageViewModel, { ...notebookInput(), collectionId: "other" }]
  ]) {
    assert.throws(() => build(input), /不匹配/);
  }
});

test("root Wiki project keeps root navigation without a Wiki index", () => {
  const source = "source/wiki/docs/index.md";
  const input = {
    source,
    collectionSource: "source/_data/wiki/docs.yml",
    collectionId: "docs",
    collectionConfig: parseCollectionConfig({
      name: "Docs",
      route: { path: "/" },
      hero: { enabled: true, background: { image: "/hero.webp" } },
      cover: "/collection.webp",
      leftbar: { brand: { name: "Docs", href: "/" } }
    }, "source/_data/wiki/docs.yml"),
    collectionState: {
      homepage: { path: "", title: "Docs" },
      sections: []
    },
    relatedCollections: [],
    stellarConfig: parseStellarConfig({
      themeConfig: { profiles: { wiki_index: { path: null } } },
      siteConfig: {}
    }),
    siteConfig,
    frontMatter: frontMatter(source, "wiki", "docs"),
    page: {
      ...page("wiki/docs", "wiki"),
      path: "",
      permalink: "https://example.com/"
    }
  };

  const viewModel = buildWikiPageViewModel(input);
  assert.equal(viewModel.render.layout.leftbar.brand.href, "/");
  assert.equal(viewModel.render.layout.leftbar.brand.backHref, null);
  assert.equal(viewModel.collection.cover, "/collection.webp");
  assert.equal(viewModel.item.cover, "");
  assert.equal(viewModel.item.tagline, "");
  assert.deepEqual(viewModel.item.presentation.banner, {});
  assert.equal(viewModel.render.layout.wikiIndexPath, "");
  assert.equal(viewModel.render.cover.enabled, true);
});

test("Wiki and Notebook derive Collection Brand while Topic keeps Site Brand", () => {
  const wiki = buildWikiPageViewModel(wikiInput());
  const notebook = buildNotebookPageViewModel(notebookInput());
  const topicSource = topicInput();
  topicSource.stellarConfig = parseStellarConfig({
    themeConfig: { leftbar: { brand: { name: "Site", href: "/" } } },
    siteConfig: {}
  });
  const topic = buildTopicPageViewModel(topicSource);
  assert.deepEqual(wiki.render.layout.leftbar.brand, {
    source: "collection",
    style: "regular",
    backButton: true,
    search: true,
    backHref: "/wiki/",
    backLabel: "btn.all_wiki",
    image: { src: null, variant: "icon" },
    name: "docs",
    tagline: "",
    href: "/wiki/docs/"
  });
  assert.equal(notebook.render.layout.leftbar.brand.name, "dev");
  assert.equal(notebook.render.layout.leftbar.brand.href, "/notebook/dev/");
  assert.equal(notebook.render.layout.leftbar.brand.style, "regular");
  assert.equal(notebook.render.layout.leftbar.brand.backHref, "/notebooks/");
  assert.equal(notebook.render.layout.leftbar.brand.backLabel, "btn.all_notebook");
  assert.equal(topic.render.layout.leftbar.brand.name, "Site");
  assert.equal(topic.render.layout.leftbar.brand.source, "site");
  assert.equal(topic.render.layout.leftbar.brand.style, "regular");
  assert.equal(topic.render.layout.leftbar.brand.backButton, undefined);
});

test("Collection Brand source, style, back button, and search resolve independently", () => {
  const siteInput = wikiInput();
  siteInput.stellarConfig = parseStellarConfig({
    themeConfig: {
      leftbar: {
        brand: {
          image: { src: "/site.webp", variant: "avatar" },
          name: "Site",
          tagline: "Site tagline",
          href: "/"
        }
      }
    }
  });
  siteInput.collectionConfig = parseCollectionConfig({
    name: "Docs",
    route: { path: "/wiki/docs/" },
    leftbar: { brand: { source: "site", style: "regular" } }
  }, siteInput.collectionSource);
  assert.deepEqual(buildWikiPageViewModel(siteInput).render.layout.leftbar.brand, {
    ghrepo: null,
    ghuser: null,
    source: "site",
    style: "regular",
    image: { src: "/site.webp", variant: "avatar" },
    name: "Site",
    tagline: "Site tagline",
    href: "/"
  });

  const compactInput = wikiInput();
  compactInput.collectionConfig = parseCollectionConfig({
    name: "Docs",
    route: { path: "/wiki/docs/" },
    leftbar: { brand: { style: "compact", back_button: false, search: true } }
  }, compactInput.collectionSource);
  const compact = buildWikiPageViewModel(compactInput).render.layout.leftbar.brand;
  assert.equal(compact.source, "collection");
  assert.equal(compact.style, "compact");
  assert.equal(compact.backButton, false);
  assert.equal(compact.search, true);

  const topicCollectionInput = topicInput();
  topicCollectionInput.collectionConfig = parseCollectionConfig({
    name: "Topic",
    route: { path: "/topic/topic/" },
    leftbar: { brand: { source: "collection" } }
  }, topicCollectionInput.collectionSource);
  const topicCollection = buildTopicPageViewModel(topicCollectionInput).render.layout.leftbar.brand;
  assert.equal(topicCollection.source, "collection");
  assert.equal(topicCollection.backHref, "/topic/");
  assert.equal(topicCollection.backLabel, "btn.all_topic");
  assert.equal(topicCollection.backButton, true);
  assert.equal(topicCollection.search, true);

  const invalid = topicInput();
  invalid.collectionConfig = parseCollectionConfig({
    name: "Topic",
    route: { path: "/topic/topic/" },
    leftbar: { brand: { back_button: false, search: false } }
  }, invalid.collectionSource);
  assert.throws(() => buildTopicPageViewModel(invalid), error => {
    assert.match(error.message, /leftbar\.brand\.back_button 仅支持 source: collection/);
    assert.match(error.message, /leftbar\.brand\.search 仅支持 source: collection/);
    return true;
  });
});

test("Region Brand and Banner preserve profile, collection, and page override precedence", () => {
  const input = wikiInput();
  input.stellarConfig = parseStellarConfig({
    themeConfig: {
      profiles: { wiki: { leftbar: { brand: { tagline: "Profile" } } } }
    },
    siteConfig: {}
  });
  input.collectionConfig = parseCollectionConfig({
    name: "Docs",
    icon: "/docs.svg",
    route: { path: "/wiki/docs/" },
    banner: { image: "/collection.webp", headline: "Collection" },
    leftbar: { brand: false, widgets: ["tree"] }
  }, input.collectionSource);
  input.frontMatter = parsePageConfig({
    collection: { profile: "wiki", id: "docs" },
    banner: { headline: "Page" },
    leftbar: { brand: { name: "Page" }, widgets: [] }
  }, input.source);
  const viewModel = buildWikiPageViewModel(input);
  assert.deepEqual(viewModel.render.layout.leftbar.brand, { name: "Page" });
  assert.deepEqual(viewModel.render.layout.leftbar.widgets, []);
  assert.deepEqual(viewModel.item.presentation.banner, {
    image: "/collection.webp",
    headline: "Page"
  });
});

test("Wiki pages share the prepared Collection and navigation while retaining distinct page projections", () => {
  const { buildWikiCollectionModel } = require('../scripts/lib/models');
  const input = wikiInput();
  input.collectionState.sections = [{ title: 'Docs', pages: [
    { title: 'First', path: 'wiki/docs/first', page_number: 0 },
    { title: 'Second', path: 'wiki/docs/second', page_number: 1 }
  ] }];
  input.collectionModel = buildWikiCollectionModel(input, input.collectionId);
  const first = buildWikiPageViewModel({ ...input, page: page('wiki/docs/first', 'wiki') });
  const second = buildWikiPageViewModel({ ...input, page: page('wiki/docs/second', 'wiki') });
  assert.equal(first.collection, second.collection);
  assert.equal(first.collection.navigation.tree, input.collectionModel.navigation.tree);
  assert.equal(first.collection.navigation.tree[0].items.length, 2);
  assert.notEqual(first.item, second.item);
  assert.notEqual(first.item.route.path, second.item.route.path);
  assertPageViewModel('wiki', first);
  assertPageViewModel('wiki', second);
});
