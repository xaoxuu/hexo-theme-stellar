'use strict';

hexo.extend.helper.register('icon', function(args){
  const { icons } = hexo.theme.config
  var result = ''
  if (icons[args]) {
    result = icons[args]
  } else {
    result = args
  }
  if (result.startsWith('/') || result.startsWith('https://') || result.startsWith('http://')) {
    return `<img src="${result}" />`
  } else {
    return result
  }
})
