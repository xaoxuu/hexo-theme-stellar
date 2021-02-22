/**
 * wiki v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

hexo.extend.generator.register('wiki', function (locals) {
  var hasWiki = false;
  locals.pages.forEach((page, i) => {
    if (page.layout == 'wiki') {
      hasWiki = true;
    }
  });
  if (hasWiki) {
    return {
      path: (hexo.config.wiki_dir || 'wiki') + '/index.html',
      data: locals.posts,
      layout: ['wiki']
    }
  } else {
    return {};
  }
});
