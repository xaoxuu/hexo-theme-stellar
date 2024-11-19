/**
 * https://github.com/wzpan/hexo-generator-search
 */
const { stripHTML } = require('hexo-util')

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
    if (cfg.content != false && post.content) {
      var content = stripHTML(post.content.replace(/<span class="line">\d+<\/span>/g, '')).trim()
      // 部分HTML标签
      content = content.replace(/<iframe[\s|\S]+iframe>/g, '')
      content = content.replace(/<hr>/g, '')
      content = content.replace(/<br>/g, '')
      // 去除HTML实体
      content = content.replace(/&[^\s;]+;/g, "")
      // 换行符换成空格
      content = content.replace(/\\n/g, ' ')
      content = content.replace(/\n/g, ' ')
      // 多个连续空格换成单个空格
      content = content.replace(/[\s]{2,}/g, ' ')
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

  function matchAndExit(path, patterns) {
    for (let pattern of patterns) {
        const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        if (path.match(regexPattern)) {
            // console.log("Matched pattern:", pattern);
            return true;
        }
    }
    return false;
  }

  if (posts) {
    posts.each(function(post) {
      var layout_list = ["post"]
      if (!layout_list.includes(post.layout)) return
      if (cfg.skip_search && matchAndExit(post.path, cfg.skip_search)) return
      if (post.indexing == false) return
      let temp_post = generateJson(post)
      res.push(temp_post)
    }) 
  } 
  if (pages) {
    pages.each(function(page) {
      var layout_list = ["page", "wiki"]
      if (!layout_list.includes(page.layout)) return
      if (cfg.skip_search && matchAndExit(page.path, cfg.skip_search)) return
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
