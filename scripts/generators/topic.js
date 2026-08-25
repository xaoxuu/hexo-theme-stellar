/* global hexo */
/**
 * topic v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

"use strict";

const { generatorPath, requireLayoutProfiles, toRenderNavigation } = require("../lib/layout-config");
const { stableSort } = require("../lib/collection-pipeline/shared");

hexo.extend.generator.register("index_topic", function () {
  const { topicIndex } = hexo.stellar.data;
  const profile = requireLayoutProfiles(hexo.stellar?.config).topicIndex;
  if (!Array.isArray(topicIndex?.items) || topicIndex.items.length === 0) {
    return {};
  }
  const items = stableSort(
    topicIndex.items.filter(item => item.listed),
    (left, right) => String(right.sortDate || "").localeCompare(String(left.sortDate || ""))
  );
  var ret = [];
  ret.push({
    path: generatorPath(profile.path),
    layout: ["index_topic"],
    data: {
      layout: "index_topic",
      navigation: toRenderNavigation(profile),
      topicIndex: { items }
    }
  });
  return ret;
});
