/* global hexo */
/**
 * author v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

"use strict";

const { requireLayoutProfiles, toRenderNavigation, toRenderRegions } = require("../lib/layout-config");

hexo.extend.generator.register("author", function () {
  const { authors } = hexo.stellar.data;
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
        regions: toRenderRegions(hexo.stellar.config.layout.regions, profile),
        navigation: { ...toRenderNavigation(profile), breadcrumb: false }
      }
    });
  }
  return pages;
});
