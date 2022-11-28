/**
 * https://github.com/wzpan/hexo-generator-search
 */

hexo.extend.generator.register('search_json_generator', function (locals) {
  if (this.theme.config.search.service != 'local_search') {
    return {}
  }
  var config = this.config
  const { local_search } = this.theme.config.search

  var searchfield = local_search.field
  var content = local_search.content

  var posts, pages

  if (searchfield.trim() != '') {
      searchfield = searchfield.trim()
      if (searchfield == 'post'){
          posts = locals.posts.sort('-date')
      } else if (searchfield == 'page') {
          pages = locals.pages
      } else {
          posts = locals.posts.sort('-date')
          pages = locals.pages
      }
  } else {
      posts = locals.posts.sort('-date')
  }

  var res = new Array() 
  var index = 0
  
  if (posts) {     
      posts.each(function(post) {
          if (post.indexing != undefined && !post.indexing) return
          var temp_post = new Object() 
          if (post.title) { 
              temp_post.title = post.title 
          }
          if (post.path) { 
              temp_post.url = config.root + post.path 
          } 
          if (content != false && post._content) { 
              temp_post.content = post._content 
          } 
          if (post.tags && post.tags.length > 0) { 
              var tags = []
              post.tags.forEach(function (tag) {
                  tags.push(tag.name)
              }) 
              temp_post.tags = tags 
          } 
          if (post.categories && post.categories.length > 0) { 
              var categories = []
              post.categories.forEach(function (cate) {
                  categories.push(cate.name)
              }) 
              temp_post.categories = categories 
          } 
          res[index] = temp_post  
          index += 1 
    }) 
  } 
  if (pages) { 
      pages.each(function(page) {
          if (page.indexing != undefined && !page.indexing) return
          var temp_page = new Object() 
          if (page.title) { 
              temp_page.title = page.title 
          } 
          if (page.path) { 
              temp_page.url = config.root + page.path 
          } 
          if (content != false && page._content) { 
              temp_page.content = page._content 
          } 
          if (page.tags && page.tags.length > 0) { 
              var tags = new Array() 
              var tag_index = 0 
              page.tags.each(function (tag) {
                  tags[tag_index] = tag.name 
              }) 
              temp_page.tags = tags 
          } 
          if (page.categories && page.categories.length > 0) {
              temp_page.categories = []
              (page.categories.each || page.categories.forEach)(function (item) {
                  temp_page.categories.push(item)
              })
          } 
          res[index] = temp_page  
          index += 1 
      }) 
  } 

  var json = JSON.stringify(res)

  return {
      path: local_search.path,
      data: json
  }
})