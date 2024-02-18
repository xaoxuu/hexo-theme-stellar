/**
 * link.js v1.1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% link url [title] [desc:true/false] [icon:src] %}
 */

'use strict'

module.exports = ctx => function(args) {
  const full_url_for = require('hexo-util').full_url_for.bind(ctx)
  args = ctx.args.map(args, ['icon', 'desc'], ['url', 'title'])
  if (args.url == null) {
    return '';
  }
  const url = full_url_for(args.url)
  args.api = ctx.theme.config.data_services.siteinfo?.api
  if (args.api) {
    args.api = args.api.replace('{href}', url)
  }
  var autofill = []
  if (!args.title) {
    autofill.push('title')
  }
  if (!args.icon) {
    autofill.push('icon')
  }
  if (args.desc) {
    autofill.push('desc')
  }
  var el = ''
  el += '<div class="tag-plugin link dis-select">'
  el += '<a class="link-card' + (args.desc ? ' rich' : ' plain') + '" title="' + (args.title || '') + '" href="' + args.url + '"'
  if (args.url.includes('://')) {
    el += ' target="_blank" rel="external nofollow noopener noreferrer"'
  }
  el += ' cardlink'
  if (args.api) {
    el += ` api="${args.api}"`
  }
  el += ' autofill="'
  el += autofill.join(',')
  el += '"'
  el += '>'

  function loadIcon() {
    var el = ''
    if (ctx.theme.config.plugins.lazyload && ctx.theme.config.plugins.lazyload.enable) {
      el += '<div class="lazy img" data-bg="' + (args.icon || ctx.theme.config.default.link) + '"></div>'
    } else {
      el += '<div class="lazy img" style="background-image:url(&quot;' + (args.icon || ctx.theme.config.default.link) + '&quot;)"></div>'
    }
    return el
  }
  function loadTitle() {
    return '<span class="title">' + (args.title || args.url) + '</span>'
  }
  function loadDesc() {
    return '<span class="cap desc footnote"></span>'
  }
  function loadLink() {
    return '<span class="cap link footnote">' + full_url_for(args.url) + '</span>'
  }

  if (args.desc) {
    // top
    el += '<div class="top">'
    el += loadIcon() + loadLink()
    el += '</div>'
    // bottom
    el += '<div class="bottom">'
    el += loadTitle() + loadDesc()
    el += '</div>'
  } else {
    // left
    el += '<div class="left">'
    el += loadTitle() + loadLink()
    el += '</div>'
    // right
    el += '<div class="right">'
    el += loadIcon()
    el += '</div>'
  }

  // end
  el += '</a></div>'

  return el
}
