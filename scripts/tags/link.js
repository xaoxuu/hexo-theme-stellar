/**
 * link.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 * 
 * {% link url title [description] [img:src] %}
 */

'use strict';

const { ArgsMap } = require('./utils');

hexo.extend.tag.register('link', function(args) {
  args = ArgsMap(args, ['src'], ['url', 'title', 'description']);
  var el = '';
  el += '<div class="tag-plugin tag link">';
  el += '<a class="link-card" title="' + args.title + '" href="' + args.url + '">';

  // left
  el += '<div class="left">';
  el += '<span class="title">' + args.title + '</span><span class="url">' + (args.description || args.url) + '</span>';
  el += '</div>';

  // right
  el += '<div class="right">';
  el += '<img src="' + (args.img || hexo.theme.config.tag_plugins.link.default_img) + '"/>';
  el += '</div>';

  // end
  el += '</a></div>';

  return el;
});
