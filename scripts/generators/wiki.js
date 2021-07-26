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
    var ret = [];
    ret.push({
      path: (hexo.config.wiki_dir || 'wiki') + '/index.html',
      data: {'filter': false},
      layout: ['wiki']
    });
    if (hexo.theme.config.wiki && hexo.theme.config.wiki.all_tags) {
      for (let id of Object.keys(hexo.theme.config.wiki.all_tags)) {
        let tag = hexo.theme.config.wiki.all_tags[id];
        ret.push({
          path: tag.path,
          data: {
            'filter': true,
            'tagName': tag.name
          },
          layout: ['wiki']
        });
      }
    }
    return ret;
  } else {
    return {};
  }
});
