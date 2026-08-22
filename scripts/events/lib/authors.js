/**
 * authors.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

'use strict';

const { profilePath, requireLayoutProfiles } = require("../../lib/layout-config");

module.exports = ctx => {
  var authors = ctx.locals.get('data').authors || {}
  let basePath = profilePath(requireLayoutProfiles(ctx.stellar?.config).author.path);
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
