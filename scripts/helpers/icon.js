'use strict';

hexo.extend.helper.register('icon', function(key, args, inline) {
  return hexo.utils.icon(key, args, inline)
})
