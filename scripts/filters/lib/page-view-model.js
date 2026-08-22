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

function attachPageViewModel(data) {
  const input = getPostViewModelInput(data);
  if (input) {
    data.viewModel = buildPostPageViewModel({
      ...input,
      page: {
        ...input.page,
        _id: String(data._id || input.page._id || ""),
        source: typeof data.source === "string" ? data.source : input.page.source,
        path: typeof data.path === "string" ? data.path : input.page.path,
        permalink: typeof data.permalink === "string" ? data.permalink : input.page.permalink,
        title: typeof data.title === "string" ? data.title : input.page.title,
        layout: typeof data.layout === "string" ? data.layout : input.page.layout,
        content: typeof data.content === "string" ? data.content : input.page.content,
        excerpt: typeof data.excerpt === "string" ? data.excerpt : input.page.excerpt,
        date: data.date ?? input.page.date,
        updated: data.updated ?? input.page.updated,
        categoryLinks: plainTermLinks(data.categories),
        lang: typeof data.lang === "string" ? data.lang : input.page.lang,
        language: typeof data.language === "string" ? data.language : input.page.language
      }
    });
  }
  return data;
}

module.exports = {
  attachPageViewModel
};
