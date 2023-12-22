/**
 * gallery.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% gallery %}
 * ![title](/xxx.png)
 * ![title](/xxx.png)
 * ![title](/xxx.png)
 * ![title](/xxx.png)
 * {% endgallery %}
 */

'use strict'

function img(src, alt) {
  let img = ''
  img += `<img src="${src}"`
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
  var el = ''
  el += `<div class="tag-plugin gallery">`
  const img_mds = content.split('\n').filter(item => item.trim().length > 0)
  for (let md of img_mds) {
    const matches = md.match(/\!\[(.*?)\]\((.*?)\)/i)
    if (matches?.length > 2) {
      let alt = matches[1]
      let src = matches[2]
      el += `<div class="cell">${img(src, alt)}</div>`
    }
  }
  el += `</div>`
  return el
}
