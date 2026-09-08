/* global hexo */
"use strict";

const INTERNAL = require("../lib/internal-constants");
const { CONFIG_DEFAULTS } = require("../schema/config-schema");
const { splitResources } = require("../lib/resource-assets");

hexo.extend.helper.register("extension_assets", function() {
  return INTERNAL.assets;
});
hexo.extend.helper.register("katex_stylesheet", function() {
  const config = hexo.stellar.config.features.math.katex;
  return {
    css: splitResources(config, CONFIG_DEFAULTS.features.math.katex, ["css"]).assets.css,
    integrity: config.css_integrity
  };
});
