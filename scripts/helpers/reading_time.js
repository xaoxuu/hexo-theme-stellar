/* global hexo */
'use strict';

const { countWords, readingMinutes } = require('../lib/reading_time');

hexo.extend.helper.register('word_count', function(page) {
  return countWords(page && (page.content || page._content || ''));
});

hexo.extend.helper.register('reading_time', function(page) {
  return readingMinutes(page && (page.content || page._content || ''));
});
