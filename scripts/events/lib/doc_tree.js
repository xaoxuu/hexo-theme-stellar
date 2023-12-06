/**
 * doc_tree.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

'use strict';

class WikiPage {
  constructor(page) { 
    this.id = page._id
    this.wiki = page.wiki
    this.title = page.title
    this.seo_title = page.seo_title
    this.path = page.path
    this.path_key = page.path.replace('.html', '')
    this.layout = page.layout
    this.updated = page.updated
  }
}

function getWikiObject(ctx) {
  var wiki = { tree:{} }
  const data = ctx.locals.get('data')
  var list = []
  for (let key of Object.keys(data)) {
    if (key.includes('wiki/') && key.length > 5) {
      let newKey = key.replace('wiki/', '')
      let obj = data[key]
      if ((typeof obj.tags == 'string') && obj.tags.constructor == String) {
        obj.tags = [obj.tags]
      }
      if ((typeof obj.toc == 'object') && obj.toc.constructor == Array) {
        obj.toc = { '': obj.toc }
      }
      obj.id = newKey
      if (obj.sort == null) {
        obj.sort = 0
      }
      list.push(obj)
    }
  }
  list = list.sort((p1, p2) => p1.sort - p2.sort)
  for (let item of list) {
    wiki.tree[item.id] = item
  }
  return wiki
}

module.exports = ctx => {
  // wiki 配置
  var wiki = getWikiObject(ctx)
  const pages = ctx.locals.get('pages')
  // wiki 所有页面
  const wiki_pages = pages.filter(p => (p.layout === 'wiki')).map(p => new WikiPage(p))
  const wiki_list = Object.keys(wiki.tree)

  // 数据整合：项目标签
  var all_tag_name = []
  for (let id of wiki_list) {
    let item = wiki.tree[id]
    let tags = item.tags
    if (tags) {
      tags.forEach((tag, i) => {
        if (all_tag_name.includes(tag) === false) {
          all_tag_name.push(tag)
        }
      })
      wiki.tree[id].tags = tags
    }
  }

  // 补充项目名称和首页
  for (let id of wiki_list) {
    let item = wiki.tree[id]
    item.id = id
    if (item.title == undefined || item.title.length === 0) {
      item.title = id
    }
    if (item.name == undefined || item.name.length == 0) {
      item.name = id
    }
  }
  
  // 数据整合：每个项目的子页面
  for (let id of wiki_list) {
    let item = wiki.tree[id]
    let sub_pages = wiki_pages.filter(p => p.wiki === id)
    if (!sub_pages || sub_pages.length == 0) {
      continue
    }

    // 首页
    // 未特别指定首页时，获取TOC第一页作为首页
    if (item.homepage == null && item.toc != null) {
      for (let id of Object.keys(item.toc)) {
        const path_key = item.toc[id]
        let hs = sub_pages.filter(p => (p.path_key.endsWith(path_key)))
        if (hs.length > 0) {
          item.homepage = hs[0]
          break
        }
      }
    }
    if (item.homepage == null) {
      item.homepage = sub_pages[0]
    }
    item.homepage.is_homepage = true
    // 内页分组
    var sections = []
    var others = sub_pages
    if (item.toc) {
      for (let title of Object.keys(item.toc)) {
        let key_list = item.toc[title]
        var arr = []
        for (let key of key_list) {
          arr = arr.concat(sub_pages.filter(p => p.path_key.endsWith(key)))
          others = others.filter(p => p.path_key.endsWith(key) == false)
        }
        sections.push({
          title: title,
          pages: arr
        })
      }
    }
    if (others.length > 0) {
      sections.push({
        pages: others
      })
    }
    item.sections = sections
    item.pages = sub_pages
  }

  // 全站所有的项目标签
  var all_tags = {}
  all_tag_name.forEach((tag_name, i) => {
    var subs = []
    for (let id of wiki_list) {
      let item = wiki.tree[id]
      if (item.tags && item.tags.includes(tag_name) === true && subs.includes(tag_name) === false) {
        subs.push(item.id)
      }
    }
    all_tags[tag_name] = {
      name: tag_name,
      path: (ctx.config.wiki_dir || 'wiki') + '/tags/' + tag_name + '/index.html',
      items: subs
    }
  })

  // 关联相似项目
  for (let id of wiki_list) {
    let item = wiki.tree[id]
    if (item.tags) {
      var related = []
      item.tags.forEach((tag_name, i) => {
        let tagObj = all_tags[tag_name]
        related = related.concat(tagObj.items)
        related = [...new Set(related)]
      })
      item.related = related
    }
  }

  wiki.all_tags = all_tags
  wiki.all_pages = wiki_pages
  ctx.theme.config.wiki = wiki

}
