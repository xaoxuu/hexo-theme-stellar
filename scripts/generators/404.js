/* global hexo */
/**
 * 404 v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

"use strict";

const { generatorPath, requireLayoutProfiles, toRenderNavigation } = require("../lib/layout-config");

hexo.extend.generator.register("404", function () {
  const profile = requireLayoutProfiles(hexo.stellar?.config).error;
  return {
    path: generatorPath(profile.path),
    layout: ["404"],
    data: {
      layout: "404",
      navigation: toRenderNavigation(profile)
    }
  };
});
