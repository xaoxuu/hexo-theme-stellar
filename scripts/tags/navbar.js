/**
 * navbar.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 * 
 * {% navbar [markdown link] ... %}
 * 
 * example:
 * {% navbar [Home](/) [About](/about/) [Comments](#comments) %}
 */

'use strict';

hexo.extend.tag.register('navbar', function(args) {
  if (args.length == 0) {
    return;
  }
  var el = '<div class="tag-plugin navbar"><nav class="cap">';
  function layoutItem(a) {
    if (a.includes('](')) {
      // markdown
      let el = hexo.render.renderSync({text: a, engine: 'markdown'}).split('\n').join('');
      if (el.length > 8) {
        el = el.slice(3, el.length-4);
      }
      return el;
    } else {
      var item = '<a href="#' + a + '">';
      item += a;
      item += '</a>';
      return item;
    }
  }
  args.forEach((item, i) => {
    el += layoutItem(item);
  });
  el += '</nav></div>';
  return el;
});
