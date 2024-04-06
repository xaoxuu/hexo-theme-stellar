/**
 * swiper.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% swiper [width:max] [effect:cards] %}
 * ![img](src)
 * {% endswiper %}
 */

'use strict'

module.exports = ctx => function(args, content) {
  args = ctx.args.map(args, ['width', 'effect'])
  var el = ''
  function slide() {
    let matches = content.match(/!\[.*?\]\((.*?)\)/g) || [];
    let imgUrls = matches.map(img => {
      let match = img.match(/!\[.*?\]\((.*?)\)/);
      return match && match[1];
    });

    if (imgUrls.length > 0) {
      imgUrls.forEach((url, i) => {
        el += `<div class="swiper-slide"><img no-lazy src="${url}" alt="image-${i}"></div>`;
      });
    }
  }

  el += '<div class="tag-plugin swiper fancybox" id="swiper-api"'
  el += ' ' + ctx.args.joinTags(args, ['width', 'effect']).join(' ')
  el += '>'
  el += '<div class="swiper-wrapper">'
  slide()
  el += '</div>'
  el += '<div class="swiper-pagination"></div>'
  el += '<div class="swiper-button-prev blur"></div>'
  el += '<div class="swiper-button-next blur"></div>'
  el += '</div>'
  return el
}
