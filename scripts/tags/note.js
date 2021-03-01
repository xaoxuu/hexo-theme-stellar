/**
 * note.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * note:
 * {% note [color:color] [title] content %}
 *
 * noteblock:
 * {% noteblock [color:color] title %}
 * markdown content
 * {% endnoteblock %}
 */

'use strict';

function outputNoteBlock(color, title, content) {
  var el = '';
  const defaultColor = hexo.theme.config.tag_plugins.note.default_color;
  if (!color && defaultColor) {
    color = defaultColor;
  }
  // header
  el += '<div class="tag-plugin note"';
  if (color && color.length > 0) {
    el += ' color="' + color + '"';
  }
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
}

hexo.extend.tag.register('note', function(args) {
  args = hexo.args.map(args, ['color'], ['title', 'content']);
  if (args.content) {
    return outputNoteBlock(args.color, args.title, args.content);
  } else {
    return outputNoteBlock(args.color, '', args.title);
  }
});

hexo.extend.tag.register('noteblock', function(args, content) {
  args = hexo.args.map(args, ['color'], ['title']);
  return outputNoteBlock(args.color, args.title, content);
}, {ends: true});
