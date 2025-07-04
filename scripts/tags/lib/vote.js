/**
 * vote.js v1.0 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * vote:
 * {% vote id %}
 *
 */

'use strict'

module.exports = ctx => function (args) {
  args = ctx.args.map(args, ['id'], [''])
  const api = ctx.theme.config.data_services.vote.api
  const id = args.id || 'default'

  // ✅ 不再绑定 onclick，而使用 class 让 JS 绑定事件
  return `
<div class="tag-plugin ds-vote" data-api="${api}" data-api="${api}" data-id="${id}">
  <button class="vote-up">👍 <span class="up">0</span></button>
  <button class="vote-down">👎 <span class="down">0</span></button>
</div>
`.trim()
}