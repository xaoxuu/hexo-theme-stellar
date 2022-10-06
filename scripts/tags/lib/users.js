/**
 * users.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% users api:https://api.github.com/repos/xaoxuu/hexo-theme-stellar/contributors %}
 */

'use strict';

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['api']);
  var el = '<div class="tag-plugin users-wrap">';
  
  el += '<div class="stellar-friends-api"';
  el += ' api="' + args.api + '"';
  el += '>';
  el += '<div class="group-body"></div>';
  el += '</div>';

  el += '</div>';
  return el;
};
