'use strict';

hexo.extend.helper.register('category_color', function(cat){
  const { config } = hexo.theme
  const color = config.article.category_color[cat]
  if (color) {
    var textColor = color
    if (color.startsWith('#')) {
      textColor = color
    } else {
      textColor = '#' + color
    }
    var bgColor = textColor
    if (textColor.length == (1+3)) { // #fff
      bgColor += '2'
    } else if (textColor.length == (1+6)) { // #ffffff
      bgColor += '20'
    }
    return ` style="--text-p2:${textColor};--theme-block:${bgColor}"`;
  }
  return ''
})
