/* global hexo */
'use strict';

const { getCollectionId } = require('../lib/content-config');

hexo.extend.helper.register('collection_id', function(page, type) {
  return getCollectionId(page, type);
});
