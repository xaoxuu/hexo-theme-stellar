/**
 * poetry.js v1.1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * poetry:
 * {% poetry [align:center] [title] [author:作者] [date:日期] [footer:footer] %}
 * body
 * {% endpoetry %}
 *
 */

'use strict';

hexo.extend.tag.register('poetry', function(args, content) {
  var el = '';
  args = hexo.args.map(args, ['author', 'date', 'align', 'footer'], ['title']);

  el += '<div class="tag-plugin poetry"';
  if (args.align) {
    el += ' align="' + args.align + '"';
  }
  el += '>';
  if (args.title) {
    el += '<div class="title">';
    el += args.title;
    el += '</div>';
  }
  if (args.author || args.date) {
    el += '<div class="meta">';
    if (args.author) {
      el += '<span>' + args.author + '</span>';
    }
    if (args.date) {
      el += '<span>' + args.date + '</span>';
    }
    el += '</div>';
  }
  el += '<div class="body">';
  el += hexo.render.renderSync({text: content, engine: 'markdown'}).split('\n').join('');
  el += '</div>';
  if (args.footer) {
    el += '<div class="footer">';
    el += args.footer;
    el += '</div>';
  }
  el += '</div>';
  return el;
}, {ends: true});
