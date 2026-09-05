'use strict';

const { escapeHTML } = require('hexo-util');
const { mapImageTags, parseImageAttributes } = require('../../lib/html-images');

module.exports.processSite = function(htmlContent) {
  // 短路：无 <img 的页面（如 404）无需正则扫描
  if (typeof htmlContent !== 'string' || !/<img/i.test(htmlContent)) {
    return htmlContent;
  }
  const fallback = this.utils.iconData('image:onerror');
  const handler = escapeHTML(`this.src=${JSON.stringify(fallback)}`);
  return mapImageTags(htmlContent, imgTag => {
    const closing = /\s*\/?\s*>$/.exec(imgTag)[0];
    const attrs = parseImageAttributes(imgTag.slice(4, -closing.length));
    if (attrs.some(attr => attr.name === 'onerror')) return imgTag;
    // data-src 是真实图片；懒加载的 data:image 占位符也需要失败兜底。
    const source = attrs.find(attr => attr.name === 'data-src')
      || attrs.find(attr => attr.name === 'src');
    if (!source?.value || /^data:image/i.test(source.value)) return imgTag;
    return imgTag.slice(0, -closing.length) + ` onerror="${handler}"` + closing;
  });
};
