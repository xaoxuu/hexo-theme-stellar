"use strict";

const {
  buildNotebookPageViewModel,
  buildPostPageViewModel,
  buildWikiPageViewModel,
  buildTopicPageViewModel,
  completeTopicPageViewModel
} = require("../../lib/models");
const {
  getProfileViewModelInput,
  getPageViewModel,
  getPostViewModelInput,
  getTopicViewModelBase,
  getTopicViewModelInput,
  setPageViewModel,
  setRelatedItems
} = require("../../lib/page-view-model-registry");

function plainTermLinks(value) {
  let items = value;
  if (items != null && !Array.isArray(items) && typeof items.toArray === "function") {
    items = items.toArray();
  }
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    name: typeof item?.name === "string" ? item.name : "",
    path: typeof item?.path === "string" ? item.path : ""
  })).filter(item => item.name.length > 0 && item.path.length > 0);
}

function plainDate(value) {
  if (value == null) return null;
  if (typeof value.toISOString === "function") return value.toISOString();
  return typeof value === "string" || typeof value === "number" ? value : null;
}

function plainPostLink(value) {
  if (value == null) return null;
  return {
    title: typeof value.title === "string" ? value.title : "",
    path: typeof value.path === "string" ? value.path : "",
    date: plainDate(value.date)
  };
}

function relatedItems(ctx, data, input) {
  const limit = input.stellarConfig.article.relatedPostsLimit;
  if (limit === 0) return [];
  const helper = ctx?.extend?.helper?.get?.("popular_posts_json");
  if (typeof helper !== "function") {
    throw new Error(
      `Stellar v2: ${input.frontMatter?.collection?.profile === "topic" ? "Topic" : "普通 Post"} ${input.source || data.source || "<unknown>"} 已启用 article.related_posts_limit，` +
      "但未安装提供 popular_posts_json 的 hexo-related-popular-posts"
    );
  }
  const result = helper.call(ctx, {
    maxCount: limit,
    ulClass: "related-posts",
    PPMixingRate: 0.2,
    isImage: true,
    isExcerpt: true
  }, data);
  return Array.isArray(result?.json) ? result.json : [];
}

function pageInputFromData(data, input) {
  return {
    ...input.page,
    _id: String(data._id || input.page._id || ""),
    source: typeof data.source === "string" ? data.source : input.page.source,
    path: typeof data.path === "string" ? data.path : input.page.path,
    permalink: typeof data.permalink === "string" ? data.permalink : input.page.permalink,
    link: typeof data.link === "string" ? data.link : input.page.link,
    title: typeof data.title === "string" ? data.title : input.page.title,
    layout: typeof data.layout === "string" ? data.layout : input.page.layout,
    content: typeof data.content === "string" ? data.content : input.page.content,
    excerpt: typeof data.excerpt === "string" ? data.excerpt : input.page.excerpt,
    date: data.date ?? input.page.date,
    updated: data.updated ?? input.page.updated,
    categoryLinks: plainTermLinks(data.categories),
    tagLinks: plainTermLinks(data.tags),
    previous: plainPostLink(data.prev),
    next: plainPostLink(data.next),
    lang: typeof data.lang === "string" ? data.lang : input.page.lang,
    language: typeof data.language === "string" ? data.language : input.page.language
  };
}

function buildPostViewModelFromData(data, input, options = {}) {
  return buildPostPageViewModel({
    ...input,
    relatedItems: options.relatedItems || [],
    page: pageInputFromData(data, input)
  });
}

function buildTopicViewModelFromData(data, input, options = {}) {
  const completeInput = {
    ...input,
    relatedItems: options.relatedItems || [],
    page: pageInputFromData(data, input)
  };
  return options.base
    ? completeTopicPageViewModel(completeInput, options.base)
    : buildTopicPageViewModel(completeInput);
}

function buildWikiViewModelFromData(data, input) {
  return buildWikiPageViewModel({
    ...input,
    page: pageInputFromData(data, input)
  });
}

function buildNotebookViewModelFromData(data, input) {
  return buildNotebookPageViewModel({
    ...input,
    page: pageInputFromData(data, input)
  });
}

function attachPageViewModel(data) {
  const postInput = getPostViewModelInput(data);
  const topicInput = getTopicViewModelInput(data);
  const input = postInput || topicInput;
  if (input) {
    const items = relatedItems(this, data, input);
    setRelatedItems(data, items);
    data.viewModel = postInput
      ? buildPostViewModelFromData(data, input, { relatedItems: items })
      : buildTopicViewModelFromData(data, input, {
        base: getTopicViewModelBase(data),
        relatedItems: items
      });
  } else {
    const wikiInput = getProfileViewModelInput("wiki", data);
    const notebookInput = getProfileViewModelInput("notebook", data);
    if (wikiInput) {
      data.viewModel = buildWikiViewModelFromData(data, wikiInput);
      setPageViewModel(data, data.viewModel);
    } else if (notebookInput) {
      data.viewModel = buildNotebookViewModelFromData(data, notebookInput);
      setPageViewModel(data, data.viewModel);
    } else {
      const viewModel = getPageViewModel(data);
      if (viewModel) data.viewModel = viewModel;
    }
  }
  return data;
}

module.exports = {
  attachPageViewModel,
  buildNotebookViewModelFromData,
  buildPostViewModelFromData,
  buildTopicViewModelFromData,
  buildWikiViewModelFromData
};
