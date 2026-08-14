/**
 * tip.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% tip text:注解内容 %}词句{% endtip %}
 */

'use strict'

module.exports = ctx => function(args, content = '') {
  args = ctx.args.map(args, ['text'], [])
  const escapeHTML = require('hexo-util').escapeHTML
  const text = escapeHTML(args.text || '')
  const inner = ctx.render.renderSync({text: content, engine: 'markdown'})
    .split('\n').join('')
    .replace(/<\/?p>/g, '')
  var el = ''
  el += `<span class="tag-plugin tip" tabindex="0">`
  el += `<span class="tip-text">${inner}</span>`
  el += `<span class="tip-bubble" role="tooltip">${text}</span>`
  el += '</span>'
  return el
}
