/* global hexo */
"use strict";

const {
  replaceConfigTokens,
  resolveBrand,
  shouldShowMobileBrand
} = require("../lib/brand");
const { getCollectionId } = require("../lib/content-config");
const { getPageConfig } = require("../lib/page-view-model-registry");

function activeCollection(config) {
  const { wiki, topic, notebooks } = hexo.theme.config;
  for (const [type, tree] of [
    ["wiki", wiki?.tree],
    ["topic", topic?.tree],
    ["notebook", notebooks?.tree]
  ]) {
    const id = getCollectionId(config, type);
    if (id != null && tree?.[id] != null) {
      return { collection: tree[id], type };
    }
  }
  return { collection: null, type: null };
}

hexo.extend.helper.register("brandConfig", function(page) {
  const config = getPageConfig(page) || page?.stellarConfig || {};
  const active = activeCollection(config);
  return resolveBrand({
    siteBrand: hexo.stellar.config.site.brand,
    pageBrand: config.sidebar?.left?.brand,
    collection: active.collection,
    collectionType: active.type,
    defaultIcon: hexo.stellar.config.resources.fallbacks.projectIcon
  });
});

hexo.extend.helper.register("brandText", function(value) {
  return replaceConfigTokens(value, hexo.config);
});

hexo.extend.helper.register("showMobileBrand", function(page, state) {
  return shouldShowMobileBrand({ layout: page?.layout, ...(state || {}) });
});
