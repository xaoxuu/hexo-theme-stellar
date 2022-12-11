/**
 * tag.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% tag text href [color:color] %}
 *
 */

'use strict'

const tag_colors = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple']
var tag_index = 0

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['color'], ['text', 'href'])
  if (args.color == null) {
    const default_color = ctx.theme.config.tag_plugins.tag?.default_color
    if (default_color) {
      args.color = default_color
    } else {
      args.color = tag_colors[tag_index]
      tag_index += 1
      if (tag_index >= tag_colors.length) {
        tag_index = 0
      }
    }
  }
  var el = ''
  el += '<a class="tag-plugin tag"'
  el += ' ' + ctx.args.joinTags(args, ['color', 'href']).join(' ')
  el += '>'
  el += args.text
  el += '</a>'
  return el
}
