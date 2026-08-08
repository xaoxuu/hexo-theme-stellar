/**
 * emoji.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% emoji [source] name [height:1.75em] %}
 * {% emoji url:https://example.com/emoji.png [name:alt] [height:1.75em] %}
 *
 */

'use strict'

module.exports = ctx => function(args) {
  const config = ctx.theme.config.tag_plugins.emoji
  args = ctx.args.map(args, ['url', 'height', 'name'], ['source', 'name'])
  var el = ''
  el += '<span class="tag-plugin emoji">'
  if (args.url) {
    // 直接引用外部图片，不再走 source 配置查找
    el += '<img no-lazy="" class="inline"'
    el += ' src="' + args.url + '"'
    if (args.name) {
      el += ' alt="' + args.name + '"'
    }
    if (args.height) {
      el += ' style="height:' + args.height + '"'
    }
    el += '/>'
    el += '</span>'
    return el
  }
  if (args.source == undefined) {
    return el
  }
  if (args.name == undefined) {
    // 省略了 source
    for (let id in config) {
      if (config[id]) {
        args.name = args.source
        args.source = id
        break
      }
    }
  }
  if (config[args.source] && args.name) {
    let url = config[args.source].replace('{name}', args.name)
    el += '<img no-lazy="" class="inline"'
    el += ' src="' + url + '"'
    if (args.height) {
      el += ' style="height:' + args.height + '"'
    }
    el += '/>'
  }
  el += '</span>'
  return el
}
