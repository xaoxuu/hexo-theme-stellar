/**
 * blockquote.js v1.1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * blockquote:
 * {% blockquote [indent:true/false] %}
 * body
 * {% endblockquote %}
 *
 */

'use strict'

module.exports = ctx => function(args, content) {
  var el = ''
  args = ctx.args.map(args, ['indent'], [])
  
  el += `<div class="tag-plugin blockquote" indent="${args.indent}">`
  el += ctx.render.renderSync({text: content, engine: 'markdown'}).split('\n').join('')
  el += `</div>`
  return el
}