'use strict';

const { mapImageTags } = require('../../lib/html-images');
const { processImgTag } = require('./img_lazyload');
const { addImageError, imageErrorHandler } = require('./img_onerror');

module.exports.processSite = function processSite(htmlContent) {
  if (typeof htmlContent !== 'string' || !/<img/i.test(htmlContent)) {
    return htmlContent;
  }
  const handler = imageErrorHandler(this);
  return mapImageTags(htmlContent, imgTag => addImageError(processImgTag(imgTag), handler));
};
