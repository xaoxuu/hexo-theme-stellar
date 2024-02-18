/**
 * timeline.js v2.1 | https://github.com/xaoxuu/hexo-theme-stellar/
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

'use strict'

function layoutNodeTitle(ctx, content) {
  var el = ''
  el += '<div class="header">'
  if (content && content.length > 0) {
    el += content
  }
  el += '</div>'
  return el
}

function layoutNodeContent(ctx, content) {
  var el = ''
  el += '<div class="body fs14">'
  if (content && content.length > 0) {
    el += ctx.render.renderSync({text: content, engine: 'markdown'}).split('\n').join('')
  }
  el += '</div>'
  return el
}

module.exports = ctx => function(args, content = '') {
  args = ctx.args.map(args, ['api', 'user', 'type', 'limit', 'hide', 'avatar'])
  var el = ''
  if (!args.type) {
    args.type = 'timeline'
  }
  if (args.api && args.api.length > 0) {
    el += `<div class="tag-plugin timeline ds-${args.type}"`
    el += ' ' + ctx.args.joinTags(args, ['api', 'user', 'limit', 'hide', 'avatar']).join(' ')
    el += '>'
  } else {
    el += '<div class="tag-plugin timeline">'
  }

  var arr = content.split(/<!--\s*node (.*?)\s*-->/g).filter(item => item.trim().length > 0)
  if (arr.length > 0) {
    var nodes = []
    arr.forEach((item, i) => {
      if (i % 2 == 0) {
        nodes.push({
          header: item
        })
      } else if (nodes.length > 0) {
        var node = nodes[nodes.length-1]
        if (node.body == undefined) {
          node.body = item
        } else {
          node.body += '\n' + item
        }
      }
    })
    nodes.forEach((node, i) => {
      el += '<div class="timenode" index="' + (i) + '">'
      el += layoutNodeTitle(ctx, node.header)
      el += layoutNodeContent(ctx, node.body)
      el += '</div>'
    })  
  }

  el += '</div>'
  return el
}
