'use strict';

const { escapeHTML, url_for } = require('hexo-util');
const { imageFallbackAsset } = require('../../lib/image-fallback');
const { mapImageTags, parseImageAttributes } = require('../../lib/html-images');

function addImageError(imgTag, handler) {
  const closing = /\s*\/?\s*>$/.exec(imgTag)[0];
  const attrs = parseImageAttributes(imgTag.slice(4, -closing.length));
  if (attrs.some(attr => attr.name === 'onerror')) return imgTag;
  // data-src 是真实图片；懒加载的 data:image 占位符也需要失败兜底。
  const source = attrs.find(attr => attr.name === 'data-src')
    || attrs.find(attr => attr.name === 'src');
  if (!source?.value || /^data:image/i.test(source.value)) return imgTag;
  return imgTag.slice(0, -closing.length) + ` onerror="${handler}"` + closing;
}

function imageErrorHandler(ctx) {
  const fallback = ctx.utils.iconData('image:onerror');
  const asset = imageFallbackAsset(fallback);
  const source = asset ? url_for.call(ctx, `/${asset.path}`, { relative: false }) : fallback;
  return escapeHTML(`this.onerror=null;this.src=${JSON.stringify(source)}`);
}

module.exports.processSite = function(htmlContent) {
  // 短路：无 <img 的页面（如 404）无需正则扫描
  if (typeof htmlContent !== 'string' || !/<img/i.test(htmlContent)) {
    return htmlContent;
  }
  const handler = imageErrorHandler(this);
  return mapImageTags(htmlContent, imgTag => addImageError(imgTag, handler));
};

module.exports.addImageError = addImageError;
module.exports.imageErrorHandler = imageErrorHandler;
