/**
 * quot.js v1.2 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * quot:
 * {% quot [el:h2] [icon:default] text %}
 *
 */

'use strict'

module.exports = ctx => function(args) {
  var el = ''
  args = ctx.args.map(args, ['el', 'icon'], ['text'])
  if (!args.el) {
    args.el = 'p'
  }

  var type = ''
  if (args.icon && args.icon != 'square' && args.icon != 'quotes') {
    type = ' type="icon"'
  } else {
    type = ' type="text"'
  }
  function content() {
    if (!args.icon) {
      return args.text
    }
    var el = ''
    const cfg = ctx.theme.config.tag_plugins.quot[args.icon]
    if (cfg && cfg.prefix) {
      el += '<img class="icon prefix" src="' + cfg.prefix + '" />'
    }
    el += args.text
    if (cfg && cfg.suffix) {
      el += '<img class="icon suffix" src="' + cfg.suffix + '" />'
    }
    return el
  }
  if (args.el.includes('h')) {
    el += '<div' + ' class="tag-plugin quot">'
    el += '<' + args.el + ' class="content" id="' + args.text + '"' + type + '>'
    el += '<a href="#' + args.text + '" class="headerlink" title="' + args.text + '"></a>'
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
