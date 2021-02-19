/**
 * 404 v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

hexo.extend.generator.register('404', function (locals) {
  return {
    path: '/404.html',
    layout: ['404']
  }
});