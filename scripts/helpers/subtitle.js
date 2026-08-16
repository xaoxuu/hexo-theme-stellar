/* global hexo */
'use strict';

const { subtitle } = require('../lib/subtitle');

hexo.extend.helper.register('subtitle', function(post) {
  return subtitle(post);
});
