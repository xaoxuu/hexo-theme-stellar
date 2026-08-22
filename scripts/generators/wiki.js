/* global hexo */
/**
 * wiki v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

"use strict";

const { generatorPath, requireLayoutProfiles, toRenderNavigation } = require("../lib/layout-config");

hexo.extend.generator.register("wiki", function () {
  const { wiki } = hexo.theme.config;
  const profile = requireLayoutProfiles(hexo.stellar?.config).wikiIndex;
  const wikiIdList = Object.keys(wiki.tree);
  if (wikiIdList.length == 0) {
    return {};
  }
  var ret = [];
  ret.push({
    path: generatorPath(profile.path),
    layout: ["index_wiki"],
    data: {
      layout: "index_wiki",
      navigation: toRenderNavigation(profile),
      filter: false
    }
  });
  if (wiki.all_tags) {
    for (let id of Object.keys(wiki.all_tags)) {
      let tag = wiki.all_tags[id];
      ret.push({
        path: tag.path,
        layout: ["index_wiki"],
        data: {
          layout: "index_wiki",
          navigation: toRenderNavigation(profile),
          filter: true,
          tagName: tag.name,
          title: tag.name
        }
      });
    }
  }
  return ret;
});
