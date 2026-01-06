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
    el += `<span>${content}</span>`
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

module.exports = ctx => function(rawArgs, content = '') {
  let args = {}
  for (const item of rawArgs) {
    if (typeof item !== 'string') continue
    const idx = item.indexOf(':')
    if (idx === -1) continue

    const key = item.slice(0, idx)
    const value = item.slice(idx + 1)
    args[key] = value
  }

  const type = args.type || 'timeline'

  let classBuffer = ''
  let attrBuffer = ''
  if (args.api) {
    args['data-api'] = args.api
    delete args.api

    const attrKeys = Object.keys(args).filter(
      key =>
        key !== 'type' &&
        args[key] !== undefined &&
        args[key] !== null &&
        args[key] !== ''
    )

    classBuffer += ` data-service ds-${type}"`

    if (attrKeys.length) {
      attrBuffer += ' ' + ctx.args.joinTags(args, attrKeys).join(' ')
    }
  }

  let el = `<div class="tag-plugin timeline${classBuffer}"${attrBuffer}>`

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
