/* global hexo */
'use strict';

const { firstContentImage } = require('../lib/seo');

// 正文首图地址：供 og:image 与结构化数据兜底使用（模板内直接调用）。
hexo.extend.helper.register('first_content_image', function(content) {
  return firstContentImage(content);
});
