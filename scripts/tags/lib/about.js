/**
 * about.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% about [avatar:xxx] [height:80px] %}
 * title / body
 * {% endabout %}
 */

'use strict';

module.exports = ctx => function(args, content) {
  const url_for = require('hexo-util').url_for.bind(ctx)
  args = ctx.args.map(args, ['avatar', 'height', 'border', 'back'])
  var rows = ctx.render.renderSync({text: content, engine: 'markdown'}).split('\n')
  var el = ''
  // wrapper
  el += '<div class="tag-plugin about">'
  if (args.back) {
    el += '<a class="nav-back cap" href="' + url_for(ctx.config.root) + '">'
    el += ctx.utils.icon('default:arrow-left')
    el += '</a>'
  }
  // avatar
  var avatar_url = args.avatar
  if (avatar_url) {
    el += '<div class="about-header">'
    el += '<div class="avatar">'
    el += '<img src="' + avatar_url + '"'
    if (args.border && args.border.length > 0) {
      el += ' style="border-radius:' + args.border + '"'
    }
    if (args.height && args.height.length > 0) {
      el += ' height="' + args.height + '"'
    }
    el += '/>'
    el += '</div>'
    el += '</div>'
  }

  // content
  el += '<div class="about-body fs14">'
  el += rows.join('')
  el += '</div>'

  el += '</div>'
  return el
}
