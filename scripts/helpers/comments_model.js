/* global hexo */
"use strict";

const { mergeComments, resolveCommentsModel } = require("../lib/comments");
const { pageViewModelsFor } = require("../lib/page-view-model-registry");

hexo.extend.helper.register("comments_model", function(page, overrides) {
  const pageComments = pageViewModelsFor(hexo).getPageConfig(page)?.comments || {};
  return resolveCommentsModel(
    hexo.stellar.config,
    mergeComments(pageComments, overrides),
    page?.title
  );
});
