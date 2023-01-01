/**
 * utils v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

'use strict';

hexo.extend.helper.register('get_page', function(id) {
  const pages = hexo.locals.get('pages');
  let page = pages.data.find(element => element._id == id)
  if (page && page._id == id) {
    return page
  } else {
    const posts = hexo.locals.get('posts');
    let post = posts.data.find(element => element._id == id)
    if (post && post._id == id) {
      return post
    }
  }
  return null
});
