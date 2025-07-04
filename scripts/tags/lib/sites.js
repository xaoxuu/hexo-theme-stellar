/**
 * sites.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% sites [group] [repo:owner/repo] [api:http] %}
 */

'use strict'

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['repo', 'api'], ['group'])
  const host = ctx.theme.config.api_host.ghraw
  var api
  if (args.api) {
    api = args.api
  } else if (args.repo) {
    api = `https://${host}/${args.repo}/output/v2/data.json`
  }
  
  var el = '<div class="tag-plugin sites-wrap">'
  if (api) {
    el += '<div class="data-service ds-sites"'
    el += ' data-api="' + api + '"'
    el += '>'
    el += '<div class="grid-box"></div>'
    el += '</div>'
  } else if (args.group) {
    const links = ctx.theme.config.links || {}
    el += '<div class="grid-box">'
    for (let item of (links[args.group] || [])) {
      if (item?.url && item?.title) {
        el += `<div class="grid-cell site-card">`
        el += `<a class="card-link" target="_blank" rel="external nofollow noopener noreferrer" href="${item.url}">`
        el += `<div class="lazy-box snapshot">`
        el += `<img class="lazy" data-src="${item.cover || item.snapshot || item.screenshot || ('https://image.thum.io/get/width/1280/crop/720/' + item.url)}" onerror="javascript:this.removeAttribute(&quot;data-src&quot;);this.src=&quot;${ctx.theme.config.default.cover}&quot;;"/>`
        el += `<div class="lazy-icon" style="background-image:url(&quot;${ctx.theme.config.default.loading}&quot;);"></div>`
        el += `</div>`
        el += `<div class="info">`
        el += `<div class="lazy-box icon">`
        el += `<img class="lazy" data-src="${item.icon || item.avatar || ctx.theme.config.default.link}" onerror="javascript:this.removeAttribute(&quot;data-src&quot;);this.src=&quot;${item.icon || item.avatar || ctx.theme.config.default.link}&quot;;"/>`
        el += `<div class="lazy-icon" style="background-image:url(&quot;${ctx.theme.config.default.loading}&quot;);"></div>`
        el += `</div>`
        el += `<span class="title">${item.title}</span>`
        el += `<span class="desc">${item.description || item.url}</span>`
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
