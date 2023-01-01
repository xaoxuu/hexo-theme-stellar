/**
 * grid.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% grid [style:block/card] %}
 * <!-- cell left -->
 * left body
 * <!-- cell right -->
 * right body
 * {% endgrid %}
 */

'use strict'

module.exports = ctx => function(args, content) {
  args = ctx.args.map(args, ['bg'])
  var el = ''
  el += '<div class="tag-plugin grid"'
  el += ' ' + ctx.args.joinTags(args, ['bg']).join(' ')
  el += '>'
  
  var arr = content.split(/<!--\s*cell (.*?)\s*-->/g).filter(item => item.trim().length > 0)
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
      el += '<div class="cell" index="' + (i) + '">'
      el += ctx.render.renderSync({text: (node.body || ''), engine: 'markdown'}).split('\n').join('')
      el += '</div>'
    })  
  }

  el += '</div>'

  return el
}
