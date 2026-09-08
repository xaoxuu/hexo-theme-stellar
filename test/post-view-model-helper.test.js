"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const pageRegistry = require("../scripts/lib/page-view-model-registry");
const { parseStellarConfig } = require("../scripts/lib/config-schema");
const { parsePageConfig } = require("../scripts/lib/content-config");

let postViewModel;
global.hexo = {
  extend: {
    helper: {
      register(name, helper) {
        if (name === "post_view_model") postViewModel = helper;
      }
    }
  }
};
require("../scripts/helpers/post_view_model");

test("post_view_model returns the cached final model without rebuilding", () => {
  pageRegistry.resetPageViewModelRegistry();
  const sourcePage = { source: "_posts/post.md", path: "post/", _id: "source" };
  const listingPage = { source: "_posts/post.md", path: "post/", _id: "listing" };
  const viewModel = Object.freeze({
    collection: Object.freeze({ profile: "post" }),
    item: Object.freeze({ id: "post" }),
    render: Object.freeze({ listing: Object.freeze({ listed: true }) })
  });

  pageRegistry.setPageViewModel(sourcePage, viewModel);
  assert.equal(postViewModel(listingPage), viewModel);
});

test("post_view_model caches the first template-stage fallback build", () => {
  pageRegistry.resetPageViewModelRegistry();
  const source = "source/_posts/post.md";
  const page = {
    _id: "post",
    source,
    path: "post/index.html",
    permalink: "https://example.com/post/",
    title: "Post",
    layout: "post",
    content: "Content"
  };
  const input = Object.freeze({
    source,
    themeSource: "themes/stellar/_config.yml",
    stellarConfig: parseStellarConfig({ themeConfig: {}, siteConfig: {} }),
    siteConfig: { title: "Site", url: "https://example.com", language: "zh-CN" },
    runtimeData: {},
    frontMatter: parsePageConfig({ title: "Post" }, source),
    page: Object.freeze({ ...page })
  });
  pageRegistry.setProfileViewModelInput("post", page, input);

  const first = postViewModel(page);
  const second = postViewModel({ ...page, _id: "listing" });
  assert.equal(second, first);
  assert.equal(pageRegistry.getPageViewModel(page), first);
});
