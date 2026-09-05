/* global hexo */
"use strict";

const { resolveMenuActiveByPath } = require("../lib/menu");

hexo.extend.helper.register("menu_active_by_path", function (pagePath, menuItems) {
  const items = Array.isArray(menuItems) ? menuItems : [];
  return resolveMenuActiveByPath(items, pagePath, value => this.url_for(value));
});
