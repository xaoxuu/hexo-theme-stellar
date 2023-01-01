/**
 * frame.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% frame iphone11 [img:src] [video:url] [focus:top/bottom] [alt] %}
 */

'use strict'

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['focus', 'img', 'video'], ['device', 'alt'])
  const img = args.img || ''
  const video = args.video || ''
  const device = args.device || ''
  const focus = args.focus || ''
  const alt = args.alt || ''
  if ((img.length == 0 && video.length == 0) || device.length == 0) {
    return
  }
  var el = ''
  function imgTag(url, alt) {
    let i = ''
    i += '<img class="img" src="' + url + '"'
    if (alt.length > 0) {
      i += ' alt="' + alt + '"'
    }
    i += '/>'
    return i
  }
  if (video.length > 0) {
    el += '<div class="tag-plugin video-wrap">'
    el += '<div class="frame-wrap" id="' + device + '"'
    if (focus.length > 0) {
      el += 'focus="' + focus + '">'
    } else {
      el += '>'
    }
    el += '<video'
    if (img.length > 0) {
      el += ' poster="' + img + '"'
    }
    el += ' playsinline="" muted="" loop="" autoplay="" preload="metadata">'
    el += '<source src="' + video + '" type="video/mp4">'
    el += '</video>'

    el += '<div class="frame"></div>'
    el += '</div>'
    el += '</div>'
  } else if (img.length > 0) {
    el += '<div class="tag-plugin img-wrap">'
    el += '<div class="frame-wrap" id="' + device + '"'
    if (focus.length > 0) {
      el += 'focus="' + focus + '">'
    } else {
      el += '>'
    }
    el += imgTag(img, alt)
    el += '<div class="frame"></div>'
    el += '</div>'
    if (alt.length > 0) {
      el += '<span class="image-caption">' + alt + '</span>'
    }
    el += '</div>'
  }
  return el
}
