/**
 * border.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% border [color:color] [child:codeblock/tabs] title %}
 * body
 * {% endborder %}
 */

'use strict';

hexo.extend.tag.register('border', function(args, content) {
  args = hexo.args.map(args, ['color', 'child'], ['title']);
  const color = args.color;
  const title = args.title;
  var el = '';
  const defaultColor = hexo.theme.config.tag_plugins.note.default_color;
  if (!color && defaultColor) {
    color = defaultColor;
  }
  // header
  el += '<div class="tag-plugin note"';
  el += ' ' + hexo.args.joinTags(args, ['color', 'child']).join(' ');
  el += '>';
  // title
  if (title && title.length > 0) {
    el += '<div class="title"><strong>' + title + '</strong></div>';
  }
  // content
  el += '<div class="body">';
  el += hexo.render.renderSync({text: content, engine: 'markdown'}).split('\n').join('');
  el += '</div></div>';

  return el;
}, {ends: true});
