/**
 * friends.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% friends [group] [repo:owner/repo] [api:http] %}
 */

'use strict'

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['repo', 'api'], ['group'])
  var api
  if (args.api) {
    api = args.api
  } else if (args.repo) {
    api = 'https://api.vlts.cc/output_data/v2/' + args.repo
  }
  
  var el = '<div class="tag-plugin users-wrap">'
  if (api) {
    el += `<div class="ds-friends" ${ctx.args.joinTags(args, ['size']).join(' ')} api="${api}"><div class="grid-box"></div></div>`
  } else if (args.group) {
    const links = ctx.theme.config.links || {}
    el += '<div class="grid-box">'
    for (let item of (links[args.group] || [])) {
      if (item?.url && item?.title) {
        el += `<div class="grid-cell user-card">`
        el += `<a class="card-link" target="_blank" rel="external nofollow noopener noreferrer" href="${item.url}">`
        el += `<img src="${item.icon || item.avatar || ctx.theme.config.default.avatar}" onerror="javascript:this.removeAttribute(&quot;data-src&quot;);this.src=&quot;${ctx.theme.config.default.avatar}&quot;;"/>`
        el += `<div class="name">`
        el += `<span>${item.title}</span>`
        el += `</div>`
        el += `</a>`
        el += `</div>`
      }
    }
    el += '</div>'
  }
  
  el += '</div>'
  return el
}
