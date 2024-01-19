/**
 * 部分代码借鉴自 NexT:
 * https://github.com/next-theme/hexo-theme-next/blob/master/scripts/events/lib/config.js
 * Volantis:
 * https://github.com/volantis-x/hexo-theme-volantis/blob/master/scripts/events/lib/cdn.js
 */

'use strict';

const path = require('path')

module.exports = ctx => {

  const { cache, language_switcher } = ctx.theme.config
  const warning = function(...args) {
    ctx.log.warn(`Since ${args[0]} is turned on, the ${args[1]} is disabled to avoid potential hazards.`)
  }

  if (cache && cache.enable && language_switcher) {
    warning('language_switcher', 'caching')
    cache.enable = false
  }

  if (cache && cache.enable && ctx.config.relative_link) {
    warning('caching', '`relative_link` option in Hexo `_config.yml`')
    ctx.config.relative_link = false
  }
  // ctx.config.meta_generator = false;

  // merge data
  const data = ctx.locals.get('data')
  // merge widgets: 可覆盖删除的合并
  var widgets = ctx.render.renderSync({ path: path.join(ctx.theme_dir, '_data/widgets.yml'), engine: 'yaml' })
  if (data.widgets) {
    for (let i of Object.keys(data.widgets)) {
      let widget = data.widgets[i]
      if (widget == null || widget.length == 0) {
        // delete
        delete widgets[i]
      } else {
        // create
        if (widgets[i] == null) {
          widgets[i] = widget
        } else {
          // merge
          for (let j of Object.keys(widget)) {
            widgets[i][j] = widget[j]
          }
        }
      }
    }
  }
  ctx.theme.config.widgets = widgets

  // merge icons: 简单覆盖合并
  var icons = ctx.render.renderSync({ path: path.join(ctx.theme_dir, '_data/icons.yml'), engine: 'yaml' })
  if (data.icons) {
    icons = Object.assign({}, icons, data.icons)
  }
  ctx.theme.config.icons = icons

  // default menu
  if (ctx.theme.config.menubar == undefined) {
    ctx.theme.config.menubar = {}
  }

}
