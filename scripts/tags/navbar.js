/**
 * navbar.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% navbar [markdown link] ... %}
 *
 * example:
 * {% navbar active:1 [Home](/) [About](/about/) [Comments](#comments) %}
 */

'use strict';

hexo.extend.tag.register('navbar', function(args) {
  if (args.length == 0) {
    return;
  }
  args = hexo.args.map(args, ['active'], ['links']);
  if (args.links) {
    args.links = args.links.split(' ');
  }
  var el = '<div class="tag-plugin navbar"><nav class="cap">';
  function layoutItem(a, i) {
    var text = '';
    var href = '';
    var el = '<a';
    if ((i+1).toString() === args.active) {
      el += ' class="active"';
    }
    if (a.includes('](')) {
      // markdown
      let tmp = a.split('](');
      if (tmp.length > 1) {
        text = tmp[0];
        if (text.length > 1) {
          text = text.substring(1, text.length);
        }
        href = tmp[1];
        if (href.length > 1) {
          href = href.substring(0, href.length-1);
        }
        el += ' href="' + href + '"';
      }
    } else {
      el += ' href="#' + a + '"';
      text = a;
    }
    el += '>';
    el += text;
    el += '</a>';
    return el;
  }
  args.links.forEach((item, i) => {
    el += layoutItem(item, i);
  });
  el += '</nav></div>';
  return el;
});
