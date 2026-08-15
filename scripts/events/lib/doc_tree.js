/**
 * doc_tree.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * Wiki 文档树构建入口：委托 scripts/lib/doc_tree.js 的纯函数，
 * 保持 ctx.theme.config.wiki 输出结构与旧实现一致。
 */

'use strict';

const { buildWikiTree } = require('../../lib/doc_tree');

module.exports = ctx => {
  const wiki = buildWikiTree({
    data: ctx.locals.get('data'),
    pages: ctx.locals.get('pages'),
    shelf: ctx.locals.get('data').wiki || [],
    siteTree: ctx.theme.config.site_tree
  });
  ctx.theme.config.wiki = wiki;
};
