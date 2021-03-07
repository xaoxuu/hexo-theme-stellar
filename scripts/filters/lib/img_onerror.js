/**
 * img_onerror.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 发现这个和 img_lazyload 有点冲突，会被 img_lazyload 覆盖
 */

'use strict';

const fs = require('hexo-fs');

module.exports.processSite = function(htmlContent) {
  const default_image = this.theme.config.default.image;
  return htmlContent.replace(/<img(.*?)src="(.*?)"(.*?)>/gi, function(imgTag) {
    if (/="data:image(.*?)/gi.test(imgTag)) {
      return imgTag;
    }
    if (/onerror/gi.test(imgTag)) {
      return imgTag;
    }
    if (imgTag.includes(' no-lazy ') == false) {
      return imgTag;
    }
    return imgTag.slice(0,imgTag.length-1) + ' onerror="javascript:this.classList.add(\'error\');this.src=\'' + default_image + '\';"' + imgTag.slice(imgTag.length-1);
  });
};
