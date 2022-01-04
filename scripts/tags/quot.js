/**
 * quot.js v1.1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * quot:
 * {% quot [el:h1] [icon:default] text %}
 *
 */

'use strict';

hexo.extend.tag.register('quot', function(args) {
  var el = '';
  args = hexo.args.map(args, ['el', 'icon'], ['text']);
  if (!args.el) {
    args.el = 'p';
  }

  var type = '';
  if (args.icon && args.icon != 'square' && args.icon != 'quotes') {
    type = ' type="icon"';
  } else {
    type = ' type="text"';
  }
  function content() {
    if (!args.icon) {
      return args.text;
    }
    var el = '';
    const cfg = hexo.theme.config.tag_plugins.quot[args.icon];
    if (cfg && cfg.prefix) {
      el += '<img class="icon prefix" src="' + cfg.prefix + '" />';
    }
    el += args.text;
    if (cfg && cfg.suffix) {
      el += '<img class="icon suffix" src="' + cfg.suffix + '" />';
    }
    return el;
  }
  if (args.el.includes('h')) {
    el += '<' + args.el + ' class="tag-plugin quot"' + type + ' id="' + args.text + '">';
    el += '<a href="#' + args.text + '" class="headerlink" title="' + args.text + '"></a>';
    el += content();
    el += '</' + args.el + '>';
  } else {
    el += '<' + args.el + ' class="tag-plugin quot"' + type + '>';
    el += content();
    el += '</' + args.el + '>';
  }
  return el;
});
