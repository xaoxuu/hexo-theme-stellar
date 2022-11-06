/**
 * sites.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% sites [group] [repo:owner/repo] [api:http] %}
 */

'use strict';

hexo.extend.tag.register('sites', function(args) {
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
  
  var el = '<div class="tag-plugin sites-wrap">';
  if (api) {
    el += '<div class="stellar-sites-api"';
    el += ' api="' + api + '"';
    el += '>';
    el += '<div class="group-body"></div>';
    el += '</div>';
  } else if (args.group) {
    function cell(item) {
      if (item.url && item.title) {
        var cell = '<div class="site-card">';
        cell += '<a class="card-link" target="_blank" rel="external nofollow noopener noreferrer" href="' + item.url + '">';
        cell += '<img src="' + (item.screenshot || ('https://screenshot-api.xaoxuu.com/api?url=' + item.url + '&width=1280&height=720')) + '" onerror="javascript:this.removeAttribute(&quot;data-src&quot;);this.src=&quot;' + hexo.theme.config.default.cover + '&quot;;"/>';
        cell += '<div class="info">';
        cell += '<img src="' + (item.avatar || hexo.theme.config.default.link) + '" onerror="javascript:this.removeAttribute(&quot;data-src&quot;);this.src=&quot;' + hexo.theme.config.default.link + '&quot;;"/>';
        cell += '<span class="title">' + item.title + '</span>';
        cell += '<span class="desc">' + (item.description || item.url) + '</span>';
        cell += '</div>';
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
