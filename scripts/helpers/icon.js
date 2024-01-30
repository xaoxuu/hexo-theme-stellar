'use strict';

hexo.extend.helper.register('icon', function(key, args) {
  const { icons } = hexo.theme.config
  var result = ''
  if (icons[key]) {
    result = icons[key]
  } else {
    result = key
  }
  if (result.startsWith('/') || result.startsWith('https://') || result.startsWith('http://')) {
    return `<img ${args?.length > 0 ? args : ''} src="${result}" />`
  } else {
    return result
  }
})
