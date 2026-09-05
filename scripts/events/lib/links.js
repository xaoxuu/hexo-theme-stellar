/**
 * links.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

/* global hexo */
"use strict";

const { ensureRuntimeData } = require("../../lib/runtime-data");

module.exports = ctx => {
  var allLinks = {}
  const data = ctx.locals.get('data')
  for (let key of Object.keys(data)) {
    if (key.startsWith('links/')) {
      let newKey = key.replace('links/', '')
      allLinks[newKey] = data[key]
    }
  }
  ensureRuntimeData(ctx).links = allLinks;
};
