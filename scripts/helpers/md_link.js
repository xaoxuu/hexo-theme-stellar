'use strict';

const { processPost } = require('../filters/lib/md_link');

hexo.extend.helper.register('enhance_md_links', function(html) {
  return processPost.call(hexo, { content: html }).content;
});
