/**
 * img_lazyload.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 */

'use strict';

// 懒加载强制开启：不再读取 enable 配置，no-lazy 是唯一例外
function lazyProcess(htmlContent) {
  // 短路：无 <img 的页面（如 404）无需正则扫描
  if (typeof htmlContent !== 'string' || !/<img/i.test(htmlContent)) {
    return htmlContent;
  }
  return htmlContent.replace(/<img(.*?)src="(.*?)"(.*?)>/gi, function(imgTag, src_before, src_value, src_after) {
    // 已由 tag 插件输出懒加载标记（data-src / data-srcset）的图片不重复处理
    if (/data-src/gi.test(imgTag)) {
      return imgTag;
    }
    // 使用 srcset 的图片交给浏览器原生处理，避免占位图与 srcset 冲突
    if (/srcset=/gi.test(imgTag)) {
      return imgTag;
    }
    if (/src="data:image(.*?)/gi.test(imgTag)) {
      return imgTag;
    }
    // no-lazy 兼容 `no-lazy` / `no-lazy=""` 两种写法
    if (/\bno-lazy\b/gi.test(imgTag)) {
      return imgTag;
    }
    var newImgTag = imgTag;
    if (newImgTag.includes(' class="') == false) {
      newImgTag = newImgTag.slice(0,4) + ' class=""' + newImgTag.slice(4);
    }
    // class 中增加 lazy
    newImgTag = newImgTag.replace(/(.*?) class="(.*?)" (.*?)>/gi, function(ori, before, value, after){
      var newClass = value;
      if (newClass.length > 0) {
        newClass += ' ';
      }
      newClass += 'lazy';
      if (value) {
        return ori.replace('class="' + value, 'class="' + newClass);
      } else {
        return ori.replace('class="', 'class="' + newClass);
      }
    });
    // 加载图
    const loadingImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAADa6r/EAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=';
    newImgTag = newImgTag.replace(src_value, loadingImg + '" data-src="' + src_value);
    return newImgTag;
  });
}

module.exports.processSite = function(htmlContent) {
  return lazyProcess.call(this, htmlContent);
};
