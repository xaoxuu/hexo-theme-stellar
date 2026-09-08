/* global hexo */
'use strict';

const { getCollectionId } = require('../lib/content-config');
const { pageViewModelsFor } = require("../lib/page-view-model-registry");

hexo.extend.helper.register("content_config", function(page) {
  return pageViewModelsFor(hexo).getPageConfig(page) || {};
});

hexo.extend.helper.register('collection_id', function(page, type) {
  const collectionId = getCollectionId(pageViewModelsFor(hexo).getPageConfig(page), type);
  if (collectionId != null) return collectionId;
  if (type === "notebook" && page?.notebookIndex?.mode === "notes") {
    return page.notebookIndex.collection?.id || null;
  }
  return null;
});
