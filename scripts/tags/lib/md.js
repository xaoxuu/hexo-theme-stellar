/**
 * md.js v1.0 | https://github.com/volantis-x/hexo-theme-volantis/
 * contributor: @MHuiG
 * 
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% md src %}
 *
 */
'use strict'

var md_index = 0

module.exports = ctx => function(args) {
  args = ctx.args.map(args, [''], ['src'])
  const md_id = "md_" + ++md_index
  return `
  <div class="ds-mdrender" src="${args.src}" id="${md_id}"></div>
  `
}