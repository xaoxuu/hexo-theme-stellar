/**
 * timeline.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * {% timeline %}
 *
 * <!-- node header1 -->
 * what happened 1
 *
 * <!-- node header2 -->
 * what happened 2
 *
 * {% endtimeline %}
 */

'use strict';

function layoutNodeTitle(content) {
  var el = '';
  el += '<div class="header">';
  if (content && content.length > 0) {
    el += hexo.render.renderSync({text: content, engine: 'markdown'}).split('\n').join('');
  }
  el += '</div>';
  return el;
}

function layoutNodeContent(content) {
  var el = '';
  el += '<div class="body fs14">';
  if (content && content.length > 0) {
    el += hexo.render.renderSync({text: content, engine: 'markdown'}).split('\n').join('');
  }
  el += '</div>';
  return el;
}


function postTimeline(args, content) {
  var el = '';
  var arr = content.split(/<!--\s*(.*?)\s*-->/g).filter((item, i) => {
    return item.trim().length > 0;
  });
  if (arr.length < 1) {
    return el;
  }
  var nodes = [];
  arr.forEach((item, i) => {
    if (item.startsWith('node ')) {
      nodes.push({
        header: item
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

  el += '<div class="tag-plugin timeline">';
  nodes.forEach((node, i) => {
    el += '<div class="timenode" item="' + (i + 1) + '">';
    el += layoutNodeTitle(node.header.substring(5));
    el += layoutNodeContent(node.body);
    el += '</div>';
  });

  el += '</div>';
  return el;
}

hexo.extend.tag.register('timeline', postTimeline, {ends: true});
