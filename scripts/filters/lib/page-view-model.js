"use strict";

const { buildPostPageViewModel } = require("../../lib/models");
const { getPostViewModelInput } = require("../../lib/page-view-model-registry");

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
  const config = input.themeConfig.article?.related_posts;
  if (config?.enable !== true) return [];
  const helper = ctx?.extend?.helper?.get?.("popular_posts_json");
  if (typeof helper !== "function") {
    throw new Error(
      `Stellar v2: 普通 Post ${input.source || data.source || "<unknown>"} 已启用 article.related_posts，` +
      "但未安装提供 popular_posts_json 的 hexo-related-popular-posts"
    );
  }
  const result = helper.call(ctx, {
    maxCount: Number.isFinite(config.max_count) ? config.max_count : 5,
    ulClass: "related-posts",
    PPMixingRate: 0.2,
    isImage: true,
    isExcerpt: true
  }, data);
  return Array.isArray(result?.json) ? result.json : [];
}

function buildPostViewModelFromData(data, input, options = {}) {
  return buildPostPageViewModel({
    ...input,
    relatedItems: options.relatedItems || [],
    page: {
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
    }
  });
}

function attachPageViewModel(data) {
  const input = getPostViewModelInput(data);
  if (input) {
    data.viewModel = buildPostViewModelFromData(data, input, {
      relatedItems: relatedItems(this, data, input)
    });
  }
  return data;
}

module.exports = {
  attachPageViewModel,
  buildPostViewModelFromData
};
