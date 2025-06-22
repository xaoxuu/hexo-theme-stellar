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
    const loadingImage = cfg.loading_image || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    newImgTag = newImgTag.replace(src_value, loadingImage + '" data-src="' + src_value);
    return newImgTag;
  });
}

module.exports.processSite = function(htmlContent) {
  return lazyProcess.call(this, htmlContent);
};
