/* global hexo */
/**
 * author v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

"use strict";

const { requireLayoutProfiles, toRenderNavigation } = require("../lib/layout-config");

hexo.extend.generator.register("author", function () {
  const { authors } = hexo.theme.config;
  const profile = requireLayoutProfiles(hexo.stellar?.config).author;
  var pages = [];
  for (let key of Object.keys(authors)) {
    var author = authors[key];
    if (author.hidden) {
      continue
    }
    author.id = key;
    pages.push({
      path: author.path,
      layout: ["archive"],
      data: {
        author: author,
        sidebar: profile.sidebar,
        navigation: { ...toRenderNavigation(profile), breadcrumb: false }
      }
    });
  }
  return pages;
});
