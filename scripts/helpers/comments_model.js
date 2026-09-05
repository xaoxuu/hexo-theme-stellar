/* global hexo */
"use strict";

const { mergeComments, resolveCommentsModel } = require("../lib/comments");
const { getPageConfig } = require("../lib/page-view-model-registry");

hexo.extend.helper.register("comments_model", function(page, overrides) {
  const pageComments = getPageConfig(page)?.comments || {};
  return resolveCommentsModel(
    hexo.stellar.config,
    mergeComments(pageComments, overrides),
    page?.title
  );
});
