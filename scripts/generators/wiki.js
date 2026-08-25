/* global hexo */
/**
 * wiki v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

"use strict";

const { generatorPath, requireLayoutProfiles, toRenderNavigation } = require("../lib/layout-config");
const { selectListingItems } = require("../lib/collection-pipeline/shared");

hexo.extend.generator.register("wiki", function () {
  const { wiki } = hexo.stellar.data;
  const profile = requireLayoutProfiles(hexo.stellar?.config).wikiIndex;
  const index = wiki.index;
  if (!index || !Array.isArray(index.items) || !Array.isArray(index.tags)) {
    throw new Error("Stellar v2: Wiki 索引缺少显式 render.listing 投影");
  }
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
      wikiIndex: {
        items: structuredClone(index.items),
        allItems: structuredClone(index.items),
        tags: structuredClone(index.tags),
        filter: false,
        tagName: "",
        path: profile.path
      }
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
          title: tag.name,
          wikiIndex: {
            items: selectListingItems(index.items, {
              tagId: tag.name,
              tags: index.tags
            }).map(item => structuredClone(item)),
            allItems: structuredClone(index.items),
            tags: structuredClone(index.tags),
            filter: true,
            tagName: tag.name,
            path: profile.path
          }
        }
      });
    }
  }
  return ret;
});
