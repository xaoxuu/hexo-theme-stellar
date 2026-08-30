"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildNotebookPageViewModel,
  buildPostPageViewModel,
  buildTopicPageViewModel,
  buildWikiPageViewModel
} = require("../scripts/lib/models");
const { parseStellarConfig } = require("../scripts/lib/config-schema");
const { parseCollectionConfig, parsePageConfig } = require("../scripts/lib/content-config");

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

test("all PageViewModel profiles use the shared validated and frozen pipeline", () => {
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
    assertDeepFrozen(viewModel);
  }
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
