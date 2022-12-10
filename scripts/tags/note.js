/**
 * note.js v1.1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% note [color:color] [title] content %}
 */

'use strict';

hexo.extend.tag.register('note', function(args) {
  args = hexo.args.map(args, ['color'], ['title', 'content']);
  if (args.content == undefined || args.content.length <= 0) {
    args.content = args.title;
    args.title = '';
  }
  const { title } = args;
  if (args.color == null) {
    args.color = hexo.theme.config.tag_plugins.note.default_color
  }
  var el = '';
  // header
  el += '<div class="tag-plugin note"';
  el += ' ' + hexo.args.joinTags(args, ['color', 'child']).join(' ');
  el += '>';
  // title
  if (title && title.length > 0) {
    el += '<div class="title">' + title + '</div>';
  }
  // content
  el += '<div class="body">';
  el += hexo.render.renderSync({text: args.content, engine: 'markdown'}).split('\n').join('');
  el += '</div></div>';

  return el;
});
