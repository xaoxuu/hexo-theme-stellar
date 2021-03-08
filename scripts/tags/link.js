/**
 * link.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% link url title [description] [img:src] %}
 */

'use strict';

hexo.extend.tag.register('link', function(args) {
  args = hexo.args.map(args, ['img'], ['url', 'title', 'description']);

  var el = '';
  el += '<div class="tag-plugin link dis-select">';
  el += '<a class="link-card" title="' + args.title + '" href="' + args.url + '"';
  if (args.url.includes('://')) {
    el += ' target="_blank" rel="external nofollow noopener noreferrer"';
  }
  el += '>';
  // left
  el += '<div class="left">';
  el += '<span class="title fs14">' + args.title + '</span><span class="url fs12">' + (args.description || args.url) + '</span>';
  el += '</div>';

  // right
  el += '<div class="right">';
  if (hexo.theme.config.plugins.lazyload && hexo.theme.config.plugins.lazyload.enable) {
    el += '<div class="lazy img" data-bg="' + (args.img || hexo.theme.config.default.link) + '"></div>';
  } else {
    el += '<div class="lazy img" style="background-image:url(&quot;' + (args.img || hexo.theme.config.default.link) + '&quot;)"></div>';
  }

  el += '</div>';

  // end
  el += '</a></div>';

  return el;
});
