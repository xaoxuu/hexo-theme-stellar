/**
 * authors.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

"use strict";

const { profilePath, requireLayoutProfiles } = require("../../lib/layout-config");
const { ensureRuntimeData } = require("../../lib/runtime-data");

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
  const runtimeData = ensureRuntimeData(ctx);
  runtimeData.defaultAuthor = keys.length > 0 ? authors[keys[0]] : null;
  runtimeData.authors = authors;
}
