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

hexo.extend.helper.register("hero_effect_resource", function(id) {
  const definition = require("../lib/hero-effect-registry").getHeroEffectDefinition(id);
  return definition ? { module: definition.module, defaults: definition.defaults } : {};
});

hexo.extend.helper.register("stellar_client_assets", function() {
  const assets = require("../lib/client-assets").clientAssets(hexo);
  return Object.fromEntries(Object.entries(assets).map(([kind, asset]) => [kind, {
    href: this.url_for(`/${asset.path}`) + `?v=${asset.version}`,
    inline: asset.inline || ""
  }]));
});
