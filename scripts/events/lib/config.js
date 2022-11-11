/**
 * 部分代码借鉴自 NexT:
 * https://github.com/next-theme/hexo-theme-next/blob/master/scripts/events/lib/config.js
 * Volantis:
 * https://github.com/volantis-x/hexo-theme-volantis/blob/master/scripts/events/lib/cdn.js
 */

'use strict';

const path = require('path');

module.exports = hexo => {

  const { cache, language_switcher } = hexo.theme.config;
  const warning = function(...args) {
    hexo.log.warn(`Since ${args[0]} is turned on, the ${args[1]} is disabled to avoid potential hazards.`);
  };

  if (cache && cache.enable && language_switcher) {
    warning('language_switcher', 'caching');
    cache.enable = false;
  }

  if (cache && cache.enable && hexo.config.relative_link) {
    warning('caching', '`relative_link` option in Hexo `_config.yml`');
    hexo.config.relative_link = false;
  }
  // hexo.config.meta_generator = false;

  // merge data
  const data = hexo.locals.get('data');
  // merge widgets
  var widgets = hexo.render.renderSync({ path: path.join(hexo.theme_dir, '_data/widgets.yml'), engine: 'yaml' });
  if (data.widgets) {
    for (let i of Object.keys(data.widgets)) {
      let widget = data.widgets[i];
      if (widget == null || widget.length == 0) {
        // delete
        delete widgets[i];
      } else {
        // create
        if (widgets[i] == null) {
          widgets[i] = widget;
        } else {
          // merge
          for (let j of Object.keys(widget)) {
            widgets[i][j] = widget[j];
          }
        }
      }
    }
  }
  if (hexo.theme.config.data == undefined) {
    hexo.theme.config.data = {};
  }
  hexo.theme.config.data['widgets'] = widgets;

  // default menu
  if (hexo.theme.config.sidebar.menu == undefined) {
    hexo.theme.config.sidebar.menu = [];
  }

};
