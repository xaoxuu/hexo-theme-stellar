/**
 * icon.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% icon key [color:color] [style:css] %}
 *
 */

'use strict'

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['color', 'style'], ['key'])
  if (args.color == null) {
    args.color = ctx.theme.config.tag_plugins.icon.default_color
  }
  var el = ''
  el += '<span class="tag-plugin colorful icon"'
  el += ' ' + ctx.args.joinTags(args, ['color']).join(' ')
  el += '>'
  var more = ''
  if (args.style) {
    more += `style="${args.style}"`
  }
  el += ctx.utils.icon(args.key, more)
  el += '</span>'
  return el
}
