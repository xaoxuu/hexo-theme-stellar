/**
 * https://github.com/wzpan/hexo-generator-search
 */
const { normalize_path } = require('../lib/path_utils')
const { buildSearchIndex } = require('../lib/search_index')

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
      const path = normalize_path(root + post.path)
      temp_post.path = path === '/' ? '/' : path + '/'
    }
    if (cfg.content != false && post.content) {
      const { content, anchors } = buildSearchIndex(post.content)
      temp_post.content = content
      if (anchors.length > 0) {
        temp_post.anchors = anchors
      }
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

  // 循环外编译一次 skip_search 正则，避免每个 post/page 重复 new RegExp
  const skipSearchPatterns = (cfg.skip_search || []).map(pattern => new RegExp('^' + pattern.replace(/\*/g, '.*') + '$'));

  function matchAndExit(path, patterns) {
    for (let pattern of patterns) {
        if (path.match(pattern)) {
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
      if (cfg.skip_search && matchAndExit(post.path, skipSearchPatterns)) return
      if (post.indexing == false) return
      let temp_post = generateJson(post)
      res.push(temp_post)
    }) 
  } 
  if (pages) {
    pages.each(function(page) {
      var layout_list = ["page", "wiki"]
      if (!layout_list.includes(page.layout)) return
      if (cfg.skip_search && matchAndExit(page.path, skipSearchPatterns)) return
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
