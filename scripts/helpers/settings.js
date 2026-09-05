/* global hexo */
"use strict";

const metadata = require("../lib/theme-metadata");
const { replaceSettingsTokens } = require("../lib/settings");

hexo.extend.helper.register("settings_value", function (value) {
  return replaceSettingsTokens(value, {
    "{hexo.name}": "Hexo",
    "{hexo.version}": hexo.version || "",
    "{hexo.homepage}": "https://hexo.io/",
    "{theme.name}": metadata.name,
    "{theme.version}": metadata.version,
    "{theme.tree}": `${metadata.repository}/tree/${metadata.version}`
  });
});
