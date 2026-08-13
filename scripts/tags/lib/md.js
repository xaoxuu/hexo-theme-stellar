/**
 * md.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% md src [wrap:true|false] %}
 *
 * wrap 默认 true：渲染结果保留在 .data-service.ds-mdrender 容器内（现状）；
 * wrap:false：渲染后占位元素被原地替换，无外部容器（复用底层 data-replace）。
 *
 * 复用底层组件（scripts/lib/mdrender_html.js）输出渲染占位；
 * 容器结构与现状一致，标题默认适配本地文章格式（id + headerlink，h1 隐藏）。
 */
'use strict'

const { mdrenderHtml } = require('../../lib/mdrender_html')

var md_index = 0

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['wrap'], ['src'])
  const md_id = "md_" + ++md_index
  return mdrenderHtml(args.src, {
    id: md_id,
    ghraw: ctx.theme.config.api_host.ghraw,
    replace: args.wrap === 'false'
  })
}
