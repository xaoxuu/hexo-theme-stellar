/**
 * audio.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% audio src %}
 *
 */

'use strict';

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['type', 'netease', 'playlist', 'autoplay'], ['src'])
  if (args.netease) {
    return `
    <div class="tag-plugin audio">
    <iframe src="//music.163.com/outchain/player?type=2&id=${args.netease}&auto=${args.autoplay}&height=66" frameborder="no" border="0" marginwidth="0" marginheight="0" width=100% height=86>
    </iframe>
    </div>
    `
  }
  if (args.playlist) {
    return `
    <div class="tag-plugin audio">
    <iframe src="//music.163.com/outchain/player?type=0&id=${args.playlist}&auto=${args.autoplay}&height=430" frameborder="no" border="0" marginwidth="0" marginheight="0" width=100% height=450>
    </iframe>
    </div>
    `
  }
  if (args.type == null) {
    args.type = 'audio/mp3'
    const autoplayAttr = args.autoplay ? 'autoplay' : ''
    return `
    <div class="tag-plugin audio">
    <audio controls preload ${autoplayAttr} > 
    <source src="${args.src}" type="${args.type}">Your browser does not support the audio tag.
    </audio>
    </div>
    `
  }
}