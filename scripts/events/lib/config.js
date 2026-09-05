/* global hexo */
"use strict";

const path = require("path");
const { ensureRuntimeData } = require("../../lib/runtime-data");

module.exports = ctx => {
  // v2 内部 URL 策略：只支持无 index.html 与无 .html 尾缀的规范路径。
  ctx.config.pretty_urls ||= {};
  ctx.config.pretty_urls.trailing_index = false;
  ctx.config.pretty_urls.trailing_html = false;

  const data = ctx.locals.get("data") || {};
  const runtimeData = ensureRuntimeData(ctx);

  // merge widgets: 可覆盖删除的合并
  const widgets = ctx.render.renderSync({ path: path.join(ctx.theme_dir, "_data/widgets.yml"), engine: "yaml" });
  if (data.widgets) {
    for (const id of Object.keys(data.widgets)) {
      const widget = data.widgets[id];
      if (widget == null || widget.length === 0) {
        delete widgets[id];
      } else if (widgets[id] == null) {
        widgets[id] = widget;
      } else {
        Object.assign(widgets[id], widget);
      }
    }
  }
  runtimeData.widgets = widgets;

  // merge icons: 简单覆盖合并
  const themeIcons = ctx.render.renderSync({ path: path.join(ctx.theme_dir, "_data/icons.yml"), engine: "yaml" });
  runtimeData.icons = Object.assign({}, themeIcons, data.icons || {});
  runtimeData.chatUsers = data.chat_users;
};
