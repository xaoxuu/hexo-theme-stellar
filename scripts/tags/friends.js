/**
 * friends.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% friends [group] [repo:owner/repo] [api:http] %}
 */

'use strict';

hexo.extend.tag.register('friends', function(args) {
  args = hexo.args.map(args, ['repo', 'api'], ['group']);
  var links = hexo.locals.get('data').links;
  if (links == undefined) {
    links = {};
  }
  var api;
  if (args.api) {
    api = args.api;
  } else if (args.repo) {
    api = 'https://api.vlts.cc/output_data/v2/' + args.repo;
  }
  
  var el = '<div class="tag-plugin users-wrap">';
  if (api) {
    el += '<div class="stellar-friends-api"';
    el += ' api="' + api + '"';
    el += '>';
    el += '<div class="group-body"></div>';
    el += '</div>';
  } else if (args.group) {
    function cell(item) {
      if (item.url && item.title) {
        var cell = '<div class="user-card">';
        cell += '<a class="card-link" target="_blank" rel="external nofollow noopener noreferrer" href="' + item.url + '">';
        cell += '<img src="' + (item.avatar || hexo.theme.config.default.avatar) + '" onerror="javascript:this.removeAttribute(&quot;data-src&quot;);this.src=&quot;' + hexo.theme.config.default.avatar + '&quot;;"/>';
        cell += '<div class="name"><span>' + item.title + '</span></div>';
        cell += '</a></div>'
        return cell;
      } else {
        return '';
      }
    }
    el += '<div class="group-body">';
    const items = links[args.group] || [];
    items.forEach((item, i) => {
      el += cell(item);
    });
    el += '</div>';
  }
  
  el += '</div>';
  return el;
});
