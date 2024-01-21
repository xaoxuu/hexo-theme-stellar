/**
 * gallery.js v2.1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% gallery [layout:grid/flow] [size:mix/s/m/l/xl] [ratio:origin/square] %}
 * ![title](/xxx.png)
 * ![title](/xxx.png)
 * ![title](/xxx.png)
 * ![title](/xxx.png)
 * {% endgallery %}
 * 
 * layout:grid 网格布局，支持通过 size/ratio 设置尺寸和长宽比
 * layout:flow 瀑布流布局，竖排，适合图片量大的时候使用（体验不佳请慎用）
 */

'use strict'

var index = 0

function img(src, alt) {
  let img = ''
  img += `<img data-fancybox="gallery-${index}" src="${src}"`
  if (alt?.length > 0) {
    img += ` alt="${alt}"`
  }
  img += `/>`
  // cap
  img += `<div class="image-meta">`
  if (alt?.length > 0) {
    img += `<span class="image-caption">${alt}</span>`
  }
  img += `</div>`
  return img
}

module.exports = ctx => function(args, content) {
  args = ctx.args.map(args, ['layout', 'size', 'ratio'])
  if (args.size == null) {
    args.size = ctx.theme.config.tag_plugins.gallery.size
  }
  if (args.ratio == null) {
    args.ratio = ctx.theme.config.tag_plugins.gallery.ratio
  }
  var el = ''
  var layoutType = 'grid'
  if (args.layout == 'flow') {
    layoutType = 'flow'
  }
  index += 1
  el += `<div class="tag-plugin gallery ${layoutType}-box" ${ctx.args.joinTags(args, ['size', 'ratio']).join(' ')}>`
  const img_mds = content.split('\n').filter(item => item.trim().length > 0)
  for (let md of img_mds) {
    const matches = md.match(/\!\[(.*?)\]\((.*?)\)/i)
    if (matches?.length > 2) {
      let alt = matches[1]
      let src = matches[2]
      el += `<div class="${layoutType}-cell">${img(src, alt)}</div>`
    }
  }
  el += `</div>`
  return el
}
