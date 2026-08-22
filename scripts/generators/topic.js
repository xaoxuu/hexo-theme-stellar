/* global hexo */
/**
 * topic v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

"use strict";

const { generatorPath, requireLayoutProfiles, toRenderNavigation } = require("../lib/layout-config");

hexo.extend.generator.register("index_topic", function () {
  const { topic } = hexo.theme.config;
  const profile = requireLayoutProfiles(hexo.stellar?.config).topicIndex;
  const topicIdList = Object.keys(topic.tree);
  if (topicIdList.length == 0) {
    return {};
  }
  var ret = [];
  ret.push({
    path: generatorPath(profile.path),
    layout: ["index_topic"],
    data: {
      layout: "index_topic",
      navigation: toRenderNavigation(profile)
    }
  });
  return ret;
});
