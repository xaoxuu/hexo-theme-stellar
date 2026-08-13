/* global hexo */
'use strict';

const { escapeHTML } = require('hexo-util');

// 供 EJS 模板使用的 HTML 转义辅助函数：属性值与文本内容均可安全使用。
hexo.extend.helper.register('escape_html', function(value) {
  return escapeHTML(value == null ? '' : String(value));
});
