/* global hexo */
"use strict";

const { runtimeDataAt } = require("../lib/runtime-data");

hexo.extend.helper.register("stellar_data", function(path) {
  return runtimeDataAt(hexo, path);
});
