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
    if (hexo.theme.config.wiki && hexo.theme.config.wiki.groups) {
      for (let group_name of Object.keys(hexo.theme.config.wiki.groups)) {
        let group = hexo.theme.config.wiki.groups[group_name];
        ret.push({
          path: group.path,
          data: {
            'filter': true,
            'title': group.title,
            'group': group.title
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
