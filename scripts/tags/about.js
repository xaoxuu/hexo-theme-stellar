/**
 * about.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% about [avatar:xxx] [height:80px] %}
 * title / body
 * {% endabout %}
 */

'use strict';

hexo.extend.tag.register('about', function(args, content) {
  args = hexo.args.map(args, ['avatar', 'height']);
  var rows = hexo.render.renderSync({text: content, engine: 'markdown'}).split('\n');
  var el = '';
  // wrapper
  el += '<div class="tag-plugin about">';
  el += '<div class="about-header">';
  // avatar
  if (args.avatar) {
    el += '<div class="avatar">'
    el += '<img src="' + args.avatar + '"';
    if (args.height && args.height.length > 0) {
      el += ' height="' + args.height + '"/>';
    } else {
      el += '/>';
    }
    el += '</div>';
  }
  // title
  if (rows.length > 0) {
    // el += '<div class="title">';
    el += rows.shift();
    // el += '</div>';
  }

  el += '</div>';

  // content
  el += '<div class="about-body fs14">';
  el += rows.join('');
  el += '</div>';

  el += '</div>';
  return el;
}, {ends: true});
