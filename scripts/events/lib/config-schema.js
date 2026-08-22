/* global hexo */
"use strict";

const { parseStellarConfig } = require("../../lib/config-schema");

module.exports = ctx => {
  const source = ctx.config.theme_config ? "_config.stellar.yml" : "themes/stellar/_config.yml";
  const themeConfig = ctx.config.theme_config || {};
  ctx.stellar = ctx.stellar || {};
  ctx.stellar.config = parseStellarConfig({ source, themeConfig });
};
