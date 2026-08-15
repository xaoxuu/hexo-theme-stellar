/**
 * copy.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% copy xxx %}
 * {% copy git xaoxuu/hexo-theme-stellar %}
 *
 */

'use strict'

var copy_index = 0

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['git', 'prefix'], ['text'])
  if (args == undefined || args.text == undefined) {
    return ''
  }
  var text = args.text
  if (args.git) {
    if (text.substr(0,1) == '/') {
      text = text.substring(1)
    }
    if (args.git == 'ssh') {
      text = 'git@github.com:' + text + '.git'
    } else if (args.git == 'gh') {
      text = 'gh repo clone ' + text
    } else {
      text = 'https://github.com/' + text + '.git'
    }
  }

  const copy_id = 'copy_' + ++copy_index
  const toast = ctx.theme.config.tag_plugins.copy.toast

  var el = ``
  el += `<div class="tag-plugin copy">`
  if (args.prefix?.length > 0) {
    el += `<span>${args.prefix}</span>`
  }
  el += `<input class="copy-area" id="${copy_id}" value="${text}">`
  el += `<button class="copy-btn" onclick="util.copy(&quot;${copy_id}&quot;,&quot;${toast}&quot;)">`
  el += ctx.utils.icon('copy:copy')
  el += `</button>`
  el += `</div>`
  return el
}
