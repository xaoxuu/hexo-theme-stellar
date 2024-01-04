/**
 * author v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

hexo.extend.generator.register('author', function (locals) {
  const { authors } = hexo.theme.config
  var pages = []
  for (let key of Object.keys(authors)) {
    const author = authors[key]
    if (author.hidden) {
      continue
    }
    pages.push({
      path: author.path,
      layout: ['archive'],
      data: {
        'author': author
      }
    })
  }
  return pages
});
