/**
 * image.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% image src [alt] [width:400px] [bg:#eee] [download:true/false/url] [fancybox:true/false/url] %}
 */

'use strict'

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['width', 'height', 'bg', 'download', 'padding', 'fancybox'], ['src', 'alt'])
  var style = ''
  if (args.width) {
    style += 'width:' + args.width + ';'
  }
  if (args.height) {
    style += 'height:' + args.height + ';'
  }
  // fancybox
  var fancybox = false
  var fancyboxHref = null
  if (ctx.theme.config.plugins.fancybox && ctx.theme.config.plugins.fancybox.enable) {
    // 主题配置
    if (ctx.theme.config.tag_plugins.image && ctx.theme.config.tag_plugins.image.fancybox) {
      fancybox = ctx.theme.config.tag_plugins.image.fancybox
    }
    // 覆盖配置
    if (args.fancybox && args.fancybox.length > 0) {
      if (args.fancybox == 'false') {
        fancybox = false
      } else if (args.fancybox === 'true') {
        fancybox = args.fancybox
      } else {
        fancybox = true
        fancyboxHref = args.fancybox
      }
    }
  }

  function img(src, alt, style) {
    let img = ''
    img += '<img src="' + src + '"'
    let a = '<a data-fancybox'
    if (alt) {
      img += ' alt="' + alt + '"'
      a += ` data-caption="${alt}"`
    }
    if (fancybox && !fancyboxHref) {
      img += ` data-fancybox="${fancybox}"`
    }
    if (style.length > 0) {
      img += ' style="' + style + '"'
    }
    img += '/>'

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
  el += '<div class="image-bg"'
  if (args.bg || args.padding) {
    el += ' style="'
    if (args.bg && args.bg.length > 0) {
      el += 'background:' + args.bg + ';'
    }
    if (args.padding) {
      el += 'padding:' + args.padding + ';'
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
    el += '<a class="image-download blur" style="opacity:0" target="_blank"' + download + ' href="' + href + '"><svg class="icon" style="width: 1em; height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3734"><path d="M561.00682908 685.55838913a111.03077546 111.03077546 0 0 1-106.8895062 0L256.23182837 487.72885783a55.96309219 55.96309219 0 0 1 79.13181253-79.18777574L450.70357448 523.88101491V181.55477937a55.96309219 55.96309219 0 0 1 111.92618438 0v344.06109173l117.07478902-117.07478901a55.96309219 55.96309219 0 0 1 79.13181252 79.18777574zM282.81429711 797.1487951h447.70473912a55.96309219 55.96309219 0 0 1 0 111.92618438H282.81429711a55.96309219 55.96309219 0 0 1 0-111.92618438z" p-id="3735"></path></svg></a>'
  }
  el += '</div>'

  if (args.alt && args.alt.length > 0) {
    el += '<div class="image-meta">'
    el += '<span class="image-caption center">' + args.alt + '</span>'
    el += '</div>'
  }

  el += '</div>'
  return el
}
