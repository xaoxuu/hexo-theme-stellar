/**
 * 404 v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

hexo.extend.generator.register('404', function (locals) {
  const { site_tree } = hexo.theme.config
  return {
    path: site_tree.error_page['404'],
    layout: ['404'],
    data: {
      layout: '404',
      navigation: { menu: site_tree.error_page.navigation.menu }
    }
  }
})
