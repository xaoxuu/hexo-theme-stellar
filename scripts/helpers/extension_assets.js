/* global hexo */
"use strict";

const assets = require("../lib/extension-assets");

hexo.extend.helper.register("extension_assets", function() {
  return assets;
});
