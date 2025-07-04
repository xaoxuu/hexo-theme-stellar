/**
 * vote.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * vote:
 * {% vote id %}
 *
 */

'use strict'

module.exports = ctx => function (args) {
  args = ctx.args.map(args, ['id', 'yes', 'no'], ['title'])

  const api = ctx.theme.config.data_services.vote.api
  const id = args.id || 'default'

  var el = `<div class="tag-plugin ds-vote" data-api="${api}" data-id="${id}">`
  if (args.title) {
    el += `<div class="header"><span>${args.title}</span></div>`
  }
  el += `<div class="body">`
  el += `<button class="vote-up">${ctx.utils.icon(args.yes || 'vote:thumbsup')} <span class="up">0</span></button>`
  el += `<button class="vote-down">${ctx.utils.icon(args.no || 'vote:thumbsdown')} <span class="down">0</span></button>`
  el += `</div>`
  el += `</div>`
  return el.trim()
}