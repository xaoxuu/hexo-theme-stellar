/* global hexo */
"use strict";

const { resolveMenuActiveByPath } = require("../lib/menu");

hexo.extend.helper.register("menu_active_by_path", function (pagePath) {
  const items = hexo.stellar?.config?.menu?.items || [];
  return resolveMenuActiveByPath(items, pagePath, value => this.url_for(value));
});
