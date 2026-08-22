/* global hexo */
'use strict';

const { buildPostViewModelFromData } = require('../filters/lib/page-view-model');
const { getPostViewModelInput } = require('../lib/page-view-model-registry');

hexo.extend.helper.register('post_view_model', function(post) {
  const input = getPostViewModelInput(post);
  if (!input) {
    throw new Error(`Stellar v2: 普通 Post ${post?.source || post?.path || '<unknown>'} 缺少列表 ViewModel 输入`);
  }
  return buildPostViewModelFromData(post, input);
});
