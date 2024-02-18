/**
 * posters.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% posters [group] [repo:owner/repo] [api:http] [size:s/m/l/xl/mix] %}
 */

'use strict'

module.exports = ctx => function(args) {
  var args = ctx.args.map(args, ['repo', 'api', 'size'], ['group'])
  if (args.size == null) {
    args.size = 'm'
  }
  var api
  if (args.api) {
    api = args.api
  } else if (args.repo) {
    api = 'https://api.vlts.cc/output_data/v2/' + args.repo
  }
  
  var el = ''
  el += `<div class="tag-plugin posters-wrap">`
  if (api) {
    el += `<div class="ds-friends" api="${api}"><div class="tag-plugin gallery grid-box" layout="grid" ratio="square" ${ctx.args.joinTags(args, ['size']).join(' ')}></div></div>`
  } else if (args.group) {
    const links = ctx.theme.config.links || {}
    el += `<div class="tag-plugin gallery grid-box" layout="grid" ratio="portrait" ${ctx.args.joinTags(args, ['size']).join(' ')}>`
    for (let item of (links[args.group] || [])) {
      if (item?.url) {
        el += `<div class="grid-cell poster-card">`
        el += `<a class="card-link" target="_blank" rel="external nofollow noopener noreferrer" href="${item.url}">`
        el += `<img src="${item.cover || item.icon || item.avatar || ctx.theme.config.default.cover}" onerror="javascript:this.removeAttribute(&quot;data-src&quot;);this.src=&quot;${ctx.theme.config.default.cover}&quot;;"/>`
        el += `<div class="image-meta">`
        if (item.title) {
          el += `<span class="image-caption">${item.title}</span>`
        }
        el += `</div>`
        el += `</a>`
        el += `</div>`
      }
    }
    el += `</div>`
  }
  el += `</div>`
  return el
}
