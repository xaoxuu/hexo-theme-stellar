/* global hexo */

'use strict';

const {
  replaceConfigTokens,
  resolveBrand,
  shouldShowMobileBrand
} = require('../lib/brand');
const { getCollectionId } = require('../lib/content-config');

function activeCollection(page) {
  const { wiki, topic, notebooks } = hexo.theme.config;
  for (const [type, tree] of [
    ['wiki', wiki?.tree],
    ['topic', topic?.tree],
    ['notebook', notebooks?.tree]
  ]) {
    const id = getCollectionId(page, type);
    if (id != null && tree?.[id] != null) {
      return { collection: tree[id], type };
    }
  }
  return { collection: null, type: null };
}

hexo.extend.helper.register('brandConfig', function(page) {
  const active = activeCollection(page);
  return resolveBrand({
    themeBrand: hexo.theme.config.brand,
    pageBrand: page?.sidebar?.left?.brand,
    collection: active.collection,
    collectionType: active.type,
    defaultIcon: hexo.theme.config.default.project
  });
});

hexo.extend.helper.register('brandText', function(value) {
  return replaceConfigTokens(value, hexo.config);
});

hexo.extend.helper.register('showMobileBrand', function(page, state) {
  return shouldShowMobileBrand({ layout: page?.layout, ...(state || {}) });
});
