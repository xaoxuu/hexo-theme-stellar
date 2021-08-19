/**
 * mark.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% mark text [color:color] %}
 *
 */

'use strict';

hexo.extend.tag.register('mark', function(args) {
  args = hexo.args.map(args, ['color'], ['text']);
  var el = '';
  el += '<mark class="tag-plugin mark"';
  el += ' ' + hexo.args.joinTags(args, ['color']).join(' ');
  el += '>';
  el += args.text;
  el += '</mark>';
  return el;
});
