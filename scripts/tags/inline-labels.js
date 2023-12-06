/**
 * 修饰文本标签 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * example:
 * {% psw 这是密码 %}
 */

'use strict'


hexo.extend.tag.register('u', function(args) {
  return `<u>${args.join(' ')}</u>`
})
hexo.extend.tag.register('emp', function(args) {
  return `<emp>${args.join(' ')}</emp>`
})
hexo.extend.tag.register('wavy', function(args) {
  return `<wavy>${args.join(' ')}</wavy>`
})
hexo.extend.tag.register('del', function(args) {
  return `<del>${args.join(' ')}</del>`
})
hexo.extend.tag.register('kbd', function(args) {
  return `<kbd>${args.join(' ')}</kbd>`
})
hexo.extend.tag.register('psw', function(args) {
  return `<psw>${args.join(' ')}</psw>`
})
hexo.extend.tag.register('sup', function(args) {
  args = hexo.args.map(args, ['color'], ['text'])
  var el = ''
  el += '<sup class="tag-plugin colorful sup"' + ' ' + hexo.args.joinTags(args, ['color']).join(' ') + '>'
  el += args.text
  el += '</sup>'
  return el
})
hexo.extend.tag.register('sub', function(args) {
  args = hexo.args.map(args, ['color'], ['text'])
  var el = ''
  el += '<sub class="tag-plugin colorful sub"' + ' ' + hexo.args.joinTags(args, ['color']).join(' ') + '>'
  el += args.text
  el += '</sub>'
  return el
})
