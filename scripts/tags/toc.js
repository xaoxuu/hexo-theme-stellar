/**
 * toc.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 * 格式与官方标签插件一致使用空格分隔，中括号内的是可选参数（中括号不需要写出来）
 *
 * {% toc wiki:xxx [open:true] [display:mobile] title %}
 */

'use strict';

function layoutDocTree(pages) {
  var el = '';
  el += '<ul class="toc">';
  pages.forEach((p, i) => {
    el += '<li>';
    el += '<a class="list-link" href="' + p.permalink + '">';
    el += '<span>' + (p.title || p.seo_title) + '</span>';
    el += '</a>';
    el += '</li>';
  });
  el += '</ul>';
  return el;
}

hexo.extend.tag.register('toc', function(args) {
  args = hexo.args.map(args, ['wiki', 'open', 'display'], ['title']);

  var el = '';
  el += '<div class="tag-plugin toc"';
  el += ' ' + hexo.args.joinTags(args, ['display']).join(' ');
  if (args.display === 'mobile') {
    el += ' style="display:none"';
  }
  el += '>';

  el += '<details class="toc"';
  if (args.open !== false) {
    el += ' open';
  }
  el += '>';
  el += '<summary>';
  el += args.title || 'TOC';
  el += '</summary>';

  if (args.wiki) {
    const proj = hexo.theme.config.wiki.projects[args.wiki];
    if (proj == undefined) {
      return '';
    }
    if (proj.sections && proj.sections.length > 1) {
      el += '<div class="body fs14 multi">';
      proj.sections.forEach((sec, i) => {
        el += '<section>';
        el += '<div class="header">';
        el += sec.title;
        el += '</div>';
        el += layoutDocTree(sec.pages);
        el += '</section>';
      });
      el += '</div>';
    } else {
      el += '<div class="body fs14">';
      el += '<div class="body">';
      el += layoutDocTree(proj.pages);
      el += '</div>';
      el += '</div>';
    }
  }
  el += '</details>';
  // end
  el += '</div>';
  return el;
});
