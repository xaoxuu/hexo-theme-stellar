/**
 * https://github.com/wzpan/hexo-generator-search
 */

hexo.extend.generator.register('search_json_generator', function (locals) {
  if (this.theme.config.search.service != 'local_search') { return {} }
  const { root } = this.config
  const { local_search: cfg } = this.theme.config.search
  cfg.sort = '-date'
  cfg.field = cfg.field?.trim()

  var posts, pages
  if (cfg.field == 'post') {
    posts = locals.posts?.filter(p => p.content?.length > 0).sort(cfg.sort)
  } else if (cfg.field == 'page') {
    pages = locals.pages?.filter(p => p.content?.length > 0)
  } else {
    posts = locals.posts?.filter(p => p.content?.length > 0).sort(cfg.sort)
    pages = locals.pages?.filter(p => p.content?.length > 0)
  }

  var res = new Array()

  function generateJson(post) {
    var temp_post = new Object()
    if (post.title) {
      temp_post.title = post.title.trim()
    }
    if (post.path) {
      temp_post.path = root + post.path
    }
    if (cfg.content != false && post._content) {
      var content = post._content.trim()
      // 过滤掉标签和注释
      if (content.includes('{%')) {
        // 需要保留内容的的标签
        content = content.replace(/{%\s*mark\s*(.*?)\s*%}/g, '$1')
        content = content.replace(/{%\s*folding\s*(.*?)\s*%}/g, '$1')
        content = content.replace(/{%\s*copy\s*(.*?)\s*%}/g, '$1')
        content = content.replace(/{%\s*note\s*(.*?)\s*%}/g, '$1')
        content = content.replace(/{%\s*kbd\s*(.*?)\s*%}/g, '$1')
        content = content.replace(/{%\s*emp\s*(.*?)\s*%}/g, '$1')
        content = content.replace(/{%\s*wavy\s*(.*?)\s*%}/g, '$1')
        content = content.replace(/{%\s*sub\s*(.*?)\s*%}/g, '$1')
        content = content.replace(/{%\s*sup\s*(.*?)\s*%}/g, '$1')
        content = content.replace(/<!--\s*folder(.*?)\s*-->/g, '$1')
        content = content.replace(/<!--\s*tab(.*?)\s*-->/g, '$1')
        content = content.replace(/<!--\s*node(.*?)\s*-->/g, '$1')
        // 不保留内容的标签
        content = content.replace(/{%\s*(.*?)\s*%}/g, '')
        // 注释
        content = content.replace(/<!--\s*(.*?)\s*-->/g, '')
        // ## 标题
        content = content.replace(/[#]{2,} /g, '')
        // 部分HTML标签
        content = content.replace(/<iframe[\s|\S]+iframe>/g, '')
        content = content.replace(/<hr>/g, '')
        content = content.replace(/<br>/g, '')
        // 图片
        content = content.replace(/\!\[(.*?)\]\((.*?)\)/g, '')
        // 链接
        content = content.replace(/\[(.*?)\]\((.*?)\)/g, '$1')
        // 过滤代码块
        if (cfg.codeblock == false) {
          content = content.replace(/```([^`]+)```/g, '')
        }
        // 多个连续空格换成单个空格
        content = content.replace(/[\s]{2,} /g, ' ')
        // 特殊字符
        content = content.replace(/[\r|\n]+/g, '')
      }
      temp_post.content = content.trim()
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
    return temp_post
  }

  if (posts) {
    posts.each(function(post) {
      if (post.indexing == false) return
      let temp_post = generateJson(post)
      res.push(temp_post)
    }) 
  } 
  if (pages) {
    pages.each(function(page) {
      if (page.indexing == false) return
      let temp_post = generateJson(page)
      res.push(temp_post)
    })
  }
  return {
    path: cfg.path,
    data: JSON.stringify(res)
  }
})