/* global hexo */
'use strict';

const { buildCategoryTree } = require('../lib/category_tree');

hexo.extend.helper.register('category_tree', function(categories) {
  const list = categories && typeof categories.toArray === 'function'
    ? categories.toArray()
    : (categories || []);
  return buildCategoryTree(list);
});
