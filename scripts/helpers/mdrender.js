/* global hexo */
'use strict';

const { mdrenderHtml, PLACEHOLDER_CLASS } = require('../lib/mdrender_html');
const { wikiReadmeHtml, isWikiReadmePage } = require('../lib/wiki_readme');

// 远程 Markdown 渲染占位标记（底层组件服务端入口，供 EJS 模板复用）
hexo.extend.helper.register('mdrender_html', function (src, options = {}) {
  if (options.ghraw == null) {
    options.ghraw = hexo.theme.config.api_host.ghraw;
  }
  return mdrenderHtml(src, options);
});

// wiki 项目 README 主页占位（首页正文为空且配置 repo 时输出，否则空串）
hexo.extend.helper.register('wiki_readme_html', function (proj, page) {
  return wikiReadmeHtml(proj, page, { ghraw: hexo.theme.config.api_host.ghraw });
});

// 页面是否包含客户端渲染的远程 md（供 TOC 预留空容器）
hexo.extend.helper.register('has_remote_md', function (page) {
  if (!page) {
    return false;
  }
  if (page.content && page.content.indexOf(PLACEHOLDER_CLASS) >= 0) {
    return true;
  }
  return isWikiReadmePage(hexo.theme.config.wiki.tree[page.wiki], page);
});
