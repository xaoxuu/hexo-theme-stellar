/* global hexo */
"use strict";

const metadata = require("../lib/theme-metadata");

hexo.extend.helper.register("stellar_info", function(args) {
  const repo = metadata.repository;
  if (!args) {
    return repo;
  } else if (args === "name") {
    return metadata.name;
  } else if (args === "version") {
    return metadata.version;
  } else if (args === "homepage") {
    return metadata.homepage;
  } else if (args === "issues") {
    return `${repo}/issues/`;
  } else if (args === "tree") {
    return `${repo}/tree/${metadata.version}`;
  } else if (args === "main_css") {
    return metadata.assets.mainCss;
  } else if (args === "main_js") {
    return metadata.assets.mainJs;
  }
  return "";
});
