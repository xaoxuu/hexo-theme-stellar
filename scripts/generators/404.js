/**
 * 404 v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

hexo.extend.generator.register('404', function (locals) {
  const { root } = hexo.theme.config
  return {
    path: root.error_page['404'],
    layout: ['404'],
    data: {
      layout: '404',
      menu_id: root.error_page.menu_id
    }
  }
})