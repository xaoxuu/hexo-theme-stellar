/**
 * img_lazyload.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 */

'use strict';

const fs = require('hexo-fs');

function lazyProcess(htmlContent) {
  const cfg = this.theme.config.plugins.lazyload;
  if (cfg == undefined || cfg.enable != true) {
    return htmlContent;
  }
  return htmlContent.replace(/<img(.*?)src="(.*?)"(.*?)>/gi, function(imgTag, src_before, src_value, src_after) {
    // might be duplicate
    if (/data-srcset/gi.test(imgTag)) {
      return imgTag;
    }
    if (/src="data:image(.*?)/gi.test(imgTag)) {
      return imgTag;
    }
    if (imgTag.includes(' no-lazy ')) {
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
