/**
 * md_link(theme.menu['home']) is '/'
 * md_text(theme.menu['home']) is 'Home'
 */

'use strict';

hexo.extend.helper.register('md_text', function(args) {
  if (args == undefined) {
    return ''
  }
  const { config } = hexo
  args = args.replace('{config.title}', config.title)
  args = args.replace('{config.subtitle}', config.subtitle)
  args = args.replace('{config.avatar}', config.avatar)
  let tmp = args.split('](')
  if (tmp.length > 1) {
    tmp = tmp[0]
    if (tmp.length > 1) {
      tmp = tmp.substring(1, tmp.length)
    }
  } else {
    tmp = args
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
