/**
 * authors.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

'use strict';

module.exports = ctx => {
  var authors = ctx.locals.get('data').authors || {}
  let basePath = ctx.theme.config.site_tree.author.base_dir
  // url
  for (let key of Object.keys(authors)) {
    let author = authors[key]
    author.path = `${basePath}/${key}/index.html`
  }
  // default author
  const keys = Object.keys(authors)
  if (keys.length > 0) {
    ctx.theme.config.default_author = authors[keys[0]]
  }
  ctx.theme.config.authors = authors
}