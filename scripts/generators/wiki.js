/**
 * wiki v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

hexo.extend.generator.register('wiki', function (locals) {
  return {
    path: (hexo.config.wiki_dir || 'wiki') + '/index.html',
    data: locals.posts,
    layout: ['wiki']
  }
});