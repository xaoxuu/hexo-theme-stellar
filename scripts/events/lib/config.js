/**
 * 部分代码借鉴自 NexT:
 * https://github.com/next-theme/hexo-theme-next/blob/master/scripts/events/lib/config.js
 */

'use strict';

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
  hexo.config.meta_generator = false;

  // merge data
  const data = hexo.locals.get('data');
  if (data.widgets) {
    for (let id of Object.keys(data.widgets)) {
      hexo.theme.config.sidebar.widgets[id] = data.widgets[id];
    }
  }

  // default menu
  if (hexo.theme.config.sidebar.menu == undefined) {
    hexo.theme.config.sidebar.menu = [];
  }
  // default widgets
  if (hexo.theme.config.sidebar.widgets.repo_info == undefined) {
    hexo.theme.config.sidebar.widgets.repo_info = {layout: 'repo_info'};
  }
  if (hexo.theme.config.sidebar.widgets.wiki_more == undefined) {
    hexo.theme.config.sidebar.widgets.wiki_more = {layout: 'wiki_more'};
  }


};
