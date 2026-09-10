/* global hexo */
"use strict";

const { replaceConfigTokens, shouldShowMobileBrand } = require("../lib/brand");

hexo.extend.helper.register("brandText", function(value) {
  return replaceConfigTokens(value, hexo.config);
});

hexo.extend.helper.register("showMobileBrand", function(page, state) {
  return shouldShowMobileBrand({ layout: page?.layout, ...(state || {}) });
});
