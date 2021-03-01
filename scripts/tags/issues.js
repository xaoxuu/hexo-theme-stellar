/**
 * issues.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% issues [sites/timeline/friends] api:xxx [group:key=value1,value2,value3] %}
 *
 * example:
 * {% issues sites api:https://api.github.com/repos/volantis-x/examples/issues?sort=updated&state=open&page=1&per_page=100 group:version=版本：^4.0,版本：^3.0,版本：^2.0 %}
 */

'use strict';

hexo.extend.tag.register('issues', function(args) {
  args = hexo.args.map(args, ['api', 'group'], ['type']);
  // 所有支持的参数
  let type = args.type || '';
  let api = args.api || '';
  let group = args.group || '';
  if (type.length == 0 || api.length == 0) {
    return;
  }
  // 布局
  var el = '<div class="tag-plugin issues-wrap ' + type + '" id="issues-api"';
  el += 'api="' + api + '"';
  if (group.length > 0) {
    el += 'group="' + group + '"';
  }
  el += '></div>';
  return el;
});
