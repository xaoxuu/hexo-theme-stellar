/**
 * wiki_readme.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * Wiki 应用层：项目首页正文为空（剪裁空白后）且配置 repo 时，
 * 以该仓库 README.md 作为主页正文（复用底层远程 md 渲染组件）。
 */

'use strict';

const { mdrenderHtml } = require('./mdrender_html');

/**
 * README 地址。host 由调用方从主题配置 api_host.ghraw 传入；
 * branch 缺省用 GitHub HEAD（自动指向默认分支）。
 */
function readmeUrl(repo, branch, host) {
  return `https://${host}/${repo}/${branch || 'HEAD'}/README.md`;
}

// 页面正文是否为空（剪裁多余空行、空格后判断）
function isEmptyContent(page) {
  return !page || !String(page.content || '').trim();
}

/**
 * 判定是否 README 主页：配置了 repo 的项目首页且正文为空。
 */
function isWikiReadmePage(proj, page) {
  if (!proj || !proj.repo || !page || !proj.homepage) {
    return false;
  }
  if (!isEmptyContent(page)) {
    return false;
  }
  return proj.homepage.path === page.path;
}

/**
 * 生成 README 主页占位（原地替换模式）；不适用时返回空串。
 * options: { ghraw }
 */
function wikiReadmeHtml(proj, page, options = {}) {
  if (!isWikiReadmePage(proj, page)) {
    return '';
  }
  return mdrenderHtml(readmeUrl(proj.repo, proj.branch, options.ghraw), {
    ghraw: options.ghraw,
    replace: true
  });
}

module.exports = {
  readmeUrl,
  isEmptyContent,
  isWikiReadmePage,
  wikiReadmeHtml
};
