/**
 * tags v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

 hexo.extend.generator.register('tags', function (locals) {
  return {
    path: hexo.config.tag_dir + '/index.html',
    data: locals.posts,
    layout: ['tags']
  }
});