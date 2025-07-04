/**
 * rating.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * rating:
 * {% rating id %}
 *
 */

'use strict'

module.exports = ctx => function (args) {
  args = ctx.args.map(args, ['id', 'icon'], ['title'])
  
  const api = ctx.theme.config.data_services.rating.api
  const id = args.id || 'default'

  const star = ctx.utils.icon(args.icon || 'rating:star')
  let el = `<div class="tag-plugin ds-rating" data-api="${api}" data-api="${api}" data-id="${id}">`
  if (args.title) {
    el += `<div class="header"><span>${args.title}</span></div>`
  }
  el += `<div class="body">`
  for (let i = 1; i <= 5; i++) {
    el += `<button class="star" data-value="${i}">${star}</button>`
  }
  el += `<span class="avg">(0.0)</span>`
  el += `</div>`
  el += `<div class="footer"><span class="count">0</span><span class="suffix">人已评分</span></div>`
  el += `</div>`
  return el.trim()
}