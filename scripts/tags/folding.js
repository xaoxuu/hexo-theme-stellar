/**
 * folding.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% folding [color:yellow] [child:codeblock] [open:false] title %}
 * body
 * {% endtable %}
 */

'use strict';

hexo.extend.tag.register('folding', function(args, content) {
  args = hexo.args.map(args, ['color', 'child', 'open'], ['title']);
  var el = '';
  // header
  el += '<details class="tag-plugin folding"';
  el += ' ' + hexo.args.joinTags(args, ['color', 'child']).join(' ');
  if (args.open && args.open == 'true') {
    el += ' open';
  }
  el += '>';
  // summary
  el += '<summary><span>' + (args.title || '') + '</span></summary>';
  // content
  el += '<div class="body">';
  el += hexo.render.renderSync({text: content, engine: 'markdown'}).split('\n').join('');
  el += '</div></details>';

  return el;
}, {ends: true});
