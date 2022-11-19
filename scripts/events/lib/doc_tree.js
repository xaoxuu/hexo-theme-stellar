/**
 * doc_tree.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

'use strict';

class WikiPage {
  constructor(page) { 
    this.id = page._id
    this.title = page.title
    this.path = page.path
    this.layout = page.layout
    this.seo_title = page.seo_title
    this.wiki = page.wiki
    this.order = page.order || 0
    this.updated = page.updated
  }
}

function createWikiObject(ctx) {
  const wiki = { projects:{} }
  const { projects } = ctx.locals.get('data')
  if (projects) {
    Object.assign(wiki.projects, projects)
  }
  return wiki
}

module.exports = ctx => {
  // wiki 配置
  var wiki = createWikiObject(ctx)
  const pages = ctx.locals.get('pages')
  // wiki 所有页面
  const wiki_pages = pages.filter(p => (p.layout === 'wiki') && (p.wiki != undefined) && (p.wiki.length > 0)).map(p => new WikiPage(p))

  // 数据整合：项目标签
  var all_tag_name = []
  for (let id of Object.keys(wiki.projects)) {
    let proj = wiki.projects[id]
    let tags = proj.tags
    if (tags) {
      if ((typeof tags == 'string') && tags.constructor == String) {
        if (all_tag_name.includes(tags) === false) {
          all_tag_name.push(tags)
        }
        // 类型转换
        tags = [tags]
      } else if ((typeof tags == 'object') && tags.constructor == Array) {
        tags.forEach((tag, i) => {
          if (all_tag_name.includes(tag) === false) {
            all_tag_name.push(tag)
          }
        })
      }
      wiki.projects[id].tags = tags
    }
  }
  // 补充未分组的项目
  const projs = Object.keys(wiki.projects)
  wiki_pages.forEach((p, i) => {
    if (projs.includes(p.wiki) == false) {
      if (wiki.projects[p.wiki] == undefined) {
        wiki.projects[p.wiki] = {}
        wiki.projects[p.wiki].pages = []
      }
      var proj = wiki.projects[p.wiki]
      if (proj.description == undefined) {
        proj.description = p.description
      }
      wiki.projects[p.wiki].pages.push(p)
    }
  })
  // 补充项目名称和首页
  for (let id of Object.keys(wiki.projects)) {
    let proj = wiki.projects[id]
    proj.id = id
    if (proj.title == undefined || proj.title.length === 0) {
      proj.title = id
    }
    if (proj.name == undefined || proj.name.length == 0) {
      proj.name = id
    }
  }
  // 补充 order
  wiki_pages.forEach((p, i) => {
    if (p.order == undefined) {
      p.order = 0
    }
  })

  // 数据整合：每个项目的子页面
  for (let id of Object.keys(wiki.projects)) {
    let proj = wiki.projects[id]
    let proj_pages = wiki_pages.filter(p => p.wiki === id).sort((p1, p2) => p1.order < p2.order ? -1 : 1)
    if (!proj_pages || proj_pages.length == 0) {
      continue
    }
    proj.homepage = proj_pages[0]
    proj.homepage.is_homepage = true
    // 内页按 section 分组
    var section_configs = []
    if (proj.sections) {
      for (let t of Object.keys(proj.sections)) {
        let range = proj.sections[t]
        if (range.length > 1) {
          section_configs.push({
            title: t,
            from: range[0],
            to: range[1]
          })
        }
      }
    }
    var sections = []
    section_configs.forEach((sec, i) => {
      const sec_pages = proj_pages.filter( p => p.order >= sec.from && p.order <= sec.to )
      if (sec_pages && sec_pages.length > 0) {
        sections.push({
          title: sec.title,
          pages: sec_pages
        })
      }
    })
    proj.sections = sections
    proj.pages = proj_pages
  }

  // 全站所有的项目标签
  var all_tags = {}
  all_tag_name.forEach((tag_name, i) => {
    var projs = []
    for (let id of Object.keys(wiki.projects)) {
      let proj = wiki.projects[id]
      if (proj.tags && proj.tags.includes(tag_name) === true && projs.includes(tag_name) === false) {
        projs.push(proj.id)
      }
    }
    all_tags[tag_name] = {
      name: tag_name,
      path: (ctx.config.wiki_dir || 'wiki') + '/tags/' + tag_name + '/index.html',
      items: projs
    }
  })

  // 关联相似项目
  for (let id of Object.keys(wiki.projects)) {
    let proj = wiki.projects[id]
    if (proj.tags) {
      var related = []
      proj.tags.forEach((tag_name, i) => {
        let tagObj = all_tags[tag_name]
        related = related.concat(tagObj.items)
        related = [...new Set(related)]
      })
      proj.related = related
    }
  }

  wiki.all_tags = all_tags
  wiki.all_pages = wiki_pages
  ctx.theme.config.wiki = wiki

}
