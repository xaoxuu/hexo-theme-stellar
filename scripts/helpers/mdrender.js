/* global hexo */
'use strict';

const { mdrenderHtml, PLACEHOLDER_CLASS } = require('../lib/mdrender_html');

// 远程 Markdown 渲染占位标记（底层组件服务端入口，供 EJS 模板复用）
hexo.extend.helper.register('mdrender_html', function (src, options = {}) {
  if (options.rawUrl == null) {
    options.rawUrl = hexo.stellar.config.services.github.rawUrl;
  }
  return mdrenderHtml(src, options);
});

// 页面是否包含客户端渲染的远程 md（供 TOC 预留空容器）
hexo.extend.helper.register('has_remote_md', function (page) {
  if (!page) {
    return false;
  }
  if (page.content && page.content.indexOf(PLACEHOLDER_CLASS) >= 0) {
    return true;
  }
  return false;
});
