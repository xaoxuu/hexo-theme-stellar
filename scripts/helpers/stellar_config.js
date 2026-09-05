/* global hexo */
"use strict";

hexo.extend.helper.register("stellar_config", function(path) {
  const parts = typeof path === "string" && path.length > 0 ? path.split(".") : [];
  let value = hexo.stellar?.config;
  for (const part of parts) {
    if (value == null || !Object.prototype.hasOwnProperty.call(value, part)) return undefined;
    value = value[part];
  }
  return value;
});
