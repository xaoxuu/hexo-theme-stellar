/**
 * image.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% image src [alt] [width:400px] [bg:#eee] [download:true/false/url] [fancybox:true/false/url] [ratio] %}
 */

'use strict'

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['width', 'height', 'bg', 'download', 'padding', 'fancybox', 'ratio'], ['src', 'alt'])
  var style = ''
  if (args.width) {
    style += 'width:' + args.width + ';'
  }
  if (args.height) {
    style += 'height:' + args.height + ';'
  }
  // fancybox 默认开启（不再支持全局关闭），单图可用 fancybox:false 关闭
  var fancybox = true
  var fancyboxHref = null
  if (args.fancybox && args.fancybox.length > 0) {
    if (args.fancybox == 'false') {
      fancybox = false
    } else if (args.fancybox === 'true') {
      fancybox = true
    } else {
      fancybox = true
      fancyboxHref = args.fancybox
    }
  }

  var safeAlt = require('hexo-util').escapeHTML(args.alt || '')
  // 懒加载占位图（1x1 透明 PNG），真实地址放在 data-src
  const loadingImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAADa6r/EAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII='
  function img(src, alt, style) {
    let a = '<a data-fancybox'
    let img = ''
    img += `<img class="lazy" src="${loadingImg}" data-src="${src}"`
    if (safeAlt) {
      img += ` alt="${safeAlt}"`
      a += ` data-caption="${safeAlt}"`
    }
    if (fancybox && !fancyboxHref) {
      img += ` data-fancybox="${fancybox}"`
    }
    if (style.length > 0 && !args.ratio) {
      img += ' style="' + style + '"'
    }
    img += `onerror="this.src=&quot;${ctx.theme.config.default.image_onerror || ctx.utils.iconData('image:onerror')}&quot;"`
    img += '/>'
    // loading
    img += `<div class="lazy-icon"></div>`
    if (fancyboxHref) {
      a += ` href="${fancyboxHref}">${img}</a>`
      return a
    }
    return img
  }

  var el = ''
  // wrap
  el += '<div class="tag-plugin image">'
  // bg
  el += `<div class="image-bg"`
  if (args.bg || args.padding || args.ratio || style) {
    el += ' style="'
    if (args.bg && args.bg.length > 0) {
      el += 'background:' + args.bg + ';'
    }
    if (args.padding) {
      el += 'padding:' + args.padding + ';'
    }
    if (args.ratio) {
      el += 'aspect-ratio:' + args.ratio + ';'
      if (style) {
        el += style
      }
    } else if (style) {
      // 如果设置了图片宽度，但没有长宽比，那背景区就要铺满宽度
      el += 'width:100%;'
    }
    el += '"'
  }
  el += '>'
  el += img(args.src, args.alt, style)
  if (args.download && args.download.length > 0) {
    let href = args.download
    if (args.download == 'true') {
      href = args.src
    }
    let download = ''
    if (args.alt) {
      download = ' download="' + args.alt + '"'
    }
    el += '<a class="image-download blur" style="opacity:0" target="_blank"' + download + ' href="' + href + '">' + ctx.utils.icon('image:download') + '</a>'
  }
  el += '</div>'

  if (safeAlt) {
    el += '<div class="image-meta">'
    el += '<span class="image-caption center">' + safeAlt + '</span>'
    el += '</div>'
  }

  el += '</div>'
  return el
}
