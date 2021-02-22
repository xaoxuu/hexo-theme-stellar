/**
 * categories v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

hexo.extend.generator.register('categories', function (locals) {
  if (locals.categories && locals.categories.length > 0) {
    return {
      path: hexo.config.category_dir + '/index.html',
      data: locals.posts,
      layout: ['categories']
    }
  } else {
    return {};
  }
});
