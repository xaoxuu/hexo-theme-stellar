/* global hexo */
"use strict";

const { deepFreeze } = require("../schema/schema-utils");
const pkg = require("../../package.json");

const repositoryValue = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
const repository = repositoryValue.replace(/^git\+/, "").replace(/\.git$/, "");
const displayName = pkg.name
  .replace(/^hexo-theme-/, "")
  .replace(/(^|-)([a-z])/g, (_, separator, letter) => `${separator ? " " : ""}${letter.toUpperCase()}`);

module.exports = deepFreeze({
  name: displayName,
  version: pkg.version,
  homepage: pkg.homepage,
  repository,
  assets: {
    mainCss: "/css/main.css",
    mainJs: "/js/main.js"
  }
});
