/* global hexo */
"use strict";

const { replaceConfigTokens, shouldShowMobileBrand } = require("../lib/brand");

hexo.extend.helper.register("brandGithubUsername", function() {
  const username = hexo.stellar.data?.widgets?.ghuser?.username;
  return typeof username === "string" ? username.trim() : "";
});

hexo.extend.helper.register("brandText", function(value) {
  return replaceConfigTokens(value, hexo.config);
});

hexo.extend.helper.register("showMobileBrand", function(page, state) {
  return shouldShowMobileBrand({ layout: page?.layout, ...(state || {}) });
});
