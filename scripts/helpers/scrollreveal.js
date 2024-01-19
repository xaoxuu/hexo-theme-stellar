'use strict';

hexo.extend.helper.register('scrollreveal', function(args) {
  if (hexo.theme.config.plugins.scrollreveal?.enable) {
    return `${args ? args : ''}slide-up`
  } else {
    return ''
  }
})
