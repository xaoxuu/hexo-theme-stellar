'use strict';

hexo.extend.helper.register('icon', function(key) {
  const { icons } = hexo.theme.config
  var result = ''
  if (icons[key]) {
    result = icons[key]
  } else {
    result = key
  }
  if (result.startsWith('/') || result.startsWith('https://') || result.startsWith('http://')) {
    return `<img src="${result}" />`
  } else {
    return result
  }
})
