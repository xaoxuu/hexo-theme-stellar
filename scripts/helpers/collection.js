/* global hexo */
'use strict';

const { getCollectionId } = require('../lib/content-config');
const { getPageConfig } = require("../lib/page-view-model-registry");

hexo.extend.helper.register("content_config", function(page) {
  return getPageConfig(page) || page?.stellarConfig || {};
});

hexo.extend.helper.register('collection_id', function(page, type) {
  return getCollectionId(getPageConfig(page) || page?.stellarConfig, type);
});
