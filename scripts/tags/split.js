/**
 * split.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% split [style:block/card] %}
 * <!-- cell -->
 * left body
 * <!-- cell -->
 * right body
 * {% endsplit %}
 */

'use strict';

hexo.extend.tag.register('split', function(args, content) {
  args = hexo.args.map(args, ['bg']);
  var el = '';
  el += '<div class="tag-plugin split"';
  el += ' ' + hexo.args.joinTags(args, ['bg']).join(' ');
  el += '>';
  
  var arr = content.split(/<!--\s*(.*?)\s*-->/g).filter((item, i) => {
    return item.trim().length > 0;
  });
  if (arr.length > 0) {
    var nodes = [];
    arr.forEach((item, i) => {
      if (item == 'cell') {
        nodes.push({
          header: ''
        });
      } else if (nodes.length > 0) {
        var node = nodes[nodes.length-1];
        if (node.body == undefined) {
          node.body = item;
        } else {
          node.body += '\n' + item;
        }
      }
    });
    nodes.forEach((node, i) => {
      el += '<div class="cell" index="' + (i) + '">';
      el += hexo.render.renderSync({text: node.body, engine: 'markdown'}).split('\n').join('');
      el += '</div>';
    });  
  }

  el += '</div>';

  return el;
}, {ends: true});
