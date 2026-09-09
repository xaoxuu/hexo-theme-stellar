'use strict';

const { enrichImages } = require('../../lib/image-metadata');
const { mapImageTags } = require('../../lib/html-images');
const { processImgTag } = require('./img_lazyload');
const { addImageError, imageErrorHandler } = require('./img_onerror');

module.exports.processSite = function processSite(htmlContent, locals) {
  if (typeof htmlContent !== 'string' || !/<img/i.test(htmlContent)) {
    return htmlContent;
  }
  const handler = imageErrorHandler(this);
  const images = mapImageTags(htmlContent, imgTag => addImageError(processImgTag(imgTag), handler));
  return enrichImages(images, this, locals);
};
