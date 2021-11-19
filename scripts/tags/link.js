/**
 * link.js v1.1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% link url title [description] [icon:src] %}
 */

'use strict';

hexo.extend.tag.register('link', function(args) {
  args = hexo.args.map(args, ['icon'], ['url', 'title', 'description']);

  var el = '';
  el += '<div class="tag-plugin link dis-select">';
  el += '<a class="link-card' + (args.description ? ' rich' : ' plain') + '" title="' + args.title + '" href="' + args.url + '"';
  if (args.url.includes('://')) {
    el += ' target="_blank" rel="external nofollow noopener noreferrer"';
  }
  el += '>';

  function loadIcon() {
    var el = '';
    if (hexo.theme.config.plugins.lazyload && hexo.theme.config.plugins.lazyload.enable) {
      el += '<div class="lazy img" data-bg="' + (args.icon || hexo.theme.config.default.link) + '"></div>';
    } else {
      el += '<div class="lazy img" style="background-image:url(&quot;' + (args.icon || hexo.theme.config.default.link) + '&quot;)"></div>';
    }
    return el;
  }
  function loadTitle() {
    return '<span class="title fs14">' + args.title + '</span>';
  }
  function loadDesc() {
    return '<span class="url fs12">' + (args.description || args.url) + '</span>';
  }

  if (args.description) {
    // top
    el += '<div class="top">';
    el += loadIcon();
    el += '<span class="url fs12">' + args.url + '</span>';
    el += '</div>';
    // bottom
    el += '<div class="bottom">';
    el += loadTitle() + loadDesc();
    el += '</div>';
  } else {
    // left
    el += '<div class="left">';
    el += loadTitle() + loadDesc();
    el += '</div>';
    // right
    el += '<div class="right">';
    el += loadIcon();
    el += '</div>';
  }

  // end
  el += '</a></div>';

  return el;
});
