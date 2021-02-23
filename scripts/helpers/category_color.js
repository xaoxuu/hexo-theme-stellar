'use strict';

hexo.extend.helper.register('category_color', function(cat){
  const cfg = hexo.theme.config;
  if (cfg.article.category_color && cfg.article.category_color[cat]) {
    return ' style="color:' + cfg.article.category_color[cat] + '"';
  }
  return '';
});
