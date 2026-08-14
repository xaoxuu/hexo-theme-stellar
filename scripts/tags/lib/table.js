/**
 * table.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% table [style:scroll|wrap|compact] %}
 * | 列1 | 列2 |
 * | --- | --- |
 * | a   | b   |
 * {% endtable %}
 */

'use strict'

module.exports = ctx => function(args, content = '') {
  args = ctx.args.map(args, ['style'], [])
  const style = ['scroll', 'wrap', 'compact'].includes(args.style) ? args.style : 'scroll'
  var el = ''
  el += `<div class="tag-plugin table table-${style}">`
  el += ctx.render.renderSync({text: content, engine: 'markdown'})
  el += '</div>'
  return el
}
