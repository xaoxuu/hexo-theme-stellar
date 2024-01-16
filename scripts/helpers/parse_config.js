/**
 * md_link(theme.menu['home']) is '/'
 * md_text(theme.menu['home']) is 'Home'
 */

'use strict';

hexo.extend.helper.register('md_text', function(args) {
  if (args == undefined) {
    return ''
  }
  let tmp = args.split('](')
  if (tmp.length > 1) {
    tmp = tmp[0]
    if (tmp.length > 1) {
      tmp = tmp.substring(1, tmp.length)
    }
  }
  if (tmp == 'config.title' || tmp == '${config.title}') {
    tmp = hexo.config.title
  } else if (tmp == 'config.avatar' || tmp == '${config.avatar}') {
    tmp = hexo.config.avatar
  }
  return tmp
})

hexo.extend.helper.register('md_link', function(args) {
  if (args == undefined) {
    return ''
  }
  let tmp = args.split('](')
  if (tmp.length > 1) {
    tmp = tmp[1]
    if (tmp.length > 1) {
      tmp = tmp.substring(0, tmp.length-1)
    }
  } else {
    return ''
  }
  return tmp
})
