/* global hexo */
"use strict";

const {
  replaceConfigTokens,
  resolveBrands,
  shouldShowMobileBrand
} = require("../lib/brand");
const { getCollectionId } = require("../lib/content-config");
const { getPageConfig } = require("../lib/page-view-model-registry");
const INTERNAL = require("../lib/internal-constants");

function activeCollection(config) {
  const { wiki, topic, notebooks } = hexo.stellar.data;
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

hexo.extend.helper.register("brandConfig", function(page, source = "site") {
  const config = getPageConfig(page) || page?.stellarConfig || {};
  const active = activeCollection(config);
  const brands = resolveBrands({
    siteBrand: hexo.stellar.config.brand,
    collection: active.collection,
    collectionType: active.type,
    defaultIcon: INTERNAL.resources.projectIcon
  });
  return brands[source] || null;
});

hexo.extend.helper.register("brandGithubUsername", function() {
  const username = hexo.stellar.data?.widgets?.ghuser?.username;
  return typeof username === "string" ? username.trim() : "";
});

hexo.extend.helper.register("brandText", function(value) {
  return replaceConfigTokens(value, hexo.config);
});

hexo.extend.helper.register("showMobileBrand", function(page, state) {
  return shouldShowMobileBrand({ layout: page?.layout, ...(state || {}) });
});
