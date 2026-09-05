/* global hexo */
'use strict';

const { caption } = require('../lib/caption');

hexo.extend.helper.register('caption', function(item) {
  return caption(item);
});
