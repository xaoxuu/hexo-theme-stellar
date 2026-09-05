/* global hexo */
"use strict";

const { resolveSearchScope } = require("../lib/search-domain");

function isBlogAggregate(helper, page) {
  if (helper.is_home?.() || helper.is_category?.() || helper.is_tag?.() || helper.is_archive?.()) return true;
  return ["archives", "categories", "tags"].includes(page?.layout);
}

hexo.extend.helper.register("search_scope", function(page, viewModel) {
  if (hexo.stellar?.config?.search?.provider !== "local") return null;
  const notebookCollection = page?.notebookIndex?.mode === "notes"
    ? page.notebookIndex.collection
    : null;
  const scope = resolveSearchScope({
    blogAggregate: isBlogAggregate(this, page),
    collection: notebookCollection ? {
      id: notebookCollection.id,
      profile: "notebook",
      name: notebookCollection.name
    } : null,
    indexScope: hexo.stellar.config.search.local.scope,
    viewModel
  });
  if (!scope) return null;
  const blogLabel = this.__("search.scope_blog");
  const currentLabel = scope.current === "blog" ? blogLabel : scope.label;
  return {
    current: scope.current,
    currentLabel,
    hasBlog: scope.options.includes("blog")
  };
});
