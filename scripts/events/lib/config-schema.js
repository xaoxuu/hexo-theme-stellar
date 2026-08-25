/* global hexo */
"use strict";

const { parseStellarConfig } = require("../../lib/config-schema");

module.exports = ctx => {
  const hasSiteThemeConfig = ctx.config.theme_config !== undefined;
  const source = hasSiteThemeConfig ? "_config.stellar.yml" : "themes/stellar/_config.yml";
  const themeConfig = hasSiteThemeConfig ? ctx.config.theme_config : {};
  ctx.stellar = ctx.stellar || {};
  ctx.stellar.config = parseStellarConfig({ source, themeConfig });
};
