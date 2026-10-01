/* global hexo */
"use strict";

const { formatConfigWarnings, parseStellarConfig } = require("../../lib/config-schema");

module.exports = ctx => {
  const hasSiteThemeConfig = ctx.config.theme_config !== undefined;
  const source = hasSiteThemeConfig ? "_config.stellar.yml" : "themes/stellar/_config.yml";
  const themeConfig = hasSiteThemeConfig ? ctx.config.theme_config : {};
  ctx.stellar = ctx.stellar || {};
  const issues = [];
  ctx.stellar.config = parseStellarConfig({
    source,
    themeConfig,
    mode: "recover",
    onIssues: current => issues.push(...current)
  });
  // Stylus reads Hexo's merged theme config, where array overrides are appended.
  // Keep the palettes consistent with the schema's replacement semantics.
  const leftbar = ctx.theme?.config?.appearance?.backgrounds?.leftbar;
  if (leftbar) {
    const gradient = ctx.stellar.config.appearance.backgrounds.leftbar.gradient;
    leftbar.gradient = {
      light: [...gradient.light],
      dark: [...gradient.dark]
    };
  }
  const warning = formatConfigWarnings(issues);
  if (warning) ctx.log.warn(warning);
};
