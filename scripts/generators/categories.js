/**
 * categories v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

hexo.extend.generator.register('categories', function (locals) {
  return {
    path: hexo.config.category_dir + '/index.html',
    data: locals.posts,
    layout: ['categories']
  }
});