/**
 * video.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% video src %}
 *
 */

'use strict';

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['type'], ['src'])
  if (args.type == null) {
    args.type = 'video/mp4'
  }
  return `
  <div class="tag-plugin video">
  <video controls preload>
  <source src="${args.src}" type="${args.type}">Your browser does not support the video tag.
  </video>
  </div>
  `
}
