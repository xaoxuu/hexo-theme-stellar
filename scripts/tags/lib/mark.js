/**
 * mark.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% mark text [color:color] [tip:tip] %}
 *
 */

'use strict'

const { escapeHTML } = require('hexo-util')

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['color', 'tip'], ['text'])
  if (args.color == null) {
    args.color = ctx.stellar.config.tags.mark.defaultColor
  }
  var el = ''
  el += '<mark class="tag-plugin colorful mark"'
  el += ' ' + ctx.args.joinTags(args, ['color']).join(' ')
  el += '>'
  el += args.text
  if (args.tip) {
    el += '<span class="mark-tip">' + escapeHTML(args.tip) + '</span>'
  }
  el += '</mark>'
  return el
}
