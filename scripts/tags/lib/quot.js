/**
 * quot.js v1.2 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * quot:
 * {% quot [el:h2] [icon:default] [prefix:icon] text [suffix:icon] %}
 *
 */

'use strict'

module.exports = ctx => function (args) {
  var el = ''
  args = ctx.args.map(args, ['el', 'icon', 'prefix', 'suffix'], ['text'])
  if (!args.el) {
    args.el = 'p'
  }

  var type = ''
  if (args.icon || args.prefix || args.suffix) {
    type = ' type="icon"'
  } else {
    type = ' type="text"'
  }
  function content() {
    const cfg = ctx.theme.config.tag_plugins.quot[args.icon]
    var el = ''
    var prefix = args.prefix || cfg?.prefix
    var suffix = args.suffix || cfg?.suffix
    if (prefix) {
      el += ctx.utils.icon(prefix, 'class="icon prefix"')
    } else {
      el += `<span class="empty"></span>`
    }
    el += `<span class="text">${args.text}</span>`
    if (suffix) {
      el += ctx.utils.icon(suffix, 'class="icon prefix"')
    } else {
      el += `<span class="empty"></span>`
    }
    return el
  }
  if (args.el.includes('h')) {
    el += '<div' + ' class="tag-plugin quot">'
    el += '<' + args.el + ' class="content" id="' + args.text + '"' + type + '>'
    el += content()
    el += '</' + args.el + '>'
    el += '</div>'
  } else {
    el += '<div' + ' class="tag-plugin quot">'
    el += '<' + args.el + ' class="content"' + type + '>'
    el += content()
    el += '</' + args.el + '>'
    el += '</div>'
  }
  return el
}
