/**
 * English.js v1.1 | https://github.com/HcGys/stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * English: 用于纯英文文本，主要是让英文单词不截断换行
 * {% English %}
 *  content
 * {% endEnglish %}
 *
 */

'use strict'

module.exports = ctx => function(args, content) {
  var el = ''

  el += '<div class="tag-plugin English">'

  el += '<div class="content">'

  el += ctx.render.renderSync({text: content, engine: 'markdown'})

  el += '</div></div>'

  return el
}