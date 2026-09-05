/* global hexo */
"use strict";

const assets = require("../lib/internal-constants").assets;

hexo.extend.helper.register("extension_assets", function() {
  return assets;
});
