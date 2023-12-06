/**
 * checkbox.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * radio.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% checkbox [checked:false] [color:cyan] [symbol:plus/minus/times] text %}
 * {% radio [checked:false] [color:cyan] text %}
 */

'use strict'

module.exports = (ctx, type) => function(args) {
  args = ctx.args.map(args, ['color', 'checked', 'symbol'], ['text'])
  var el = ''
  // div
  el += '<div class="tag-plugin colorful checkbox"'
  el += ' ' + ctx.args.joinTags(args, ['color', 'symbol']).join(' ')
  el += '>'
  // input
  el += '<input type="' + (type || 'checkbox') + '"'
  if (args.checked == 'true') {
    el += ' checked="true"'
  }
  el += '/>'
  // text
  el += '<span>' + args.text + '</span>'
  // div
  el += '</div>'
  return el
}
