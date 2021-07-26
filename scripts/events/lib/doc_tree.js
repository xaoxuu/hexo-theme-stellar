/**
 * doc_tree.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

'use strict';

function page(page) {
  return {
    title: page.title,
    path: page.path,
    wiki: page.wiki
  };
}

module.exports = hexo => {
  const data = hexo.locals.get('data');
  if (hexo.theme.config.wiki == undefined) {
    hexo.theme.config.wiki = {};
  }
  if (hexo.theme.config.wiki.projects == undefined) {
    hexo.theme.config.wiki.projects = {};
  }
  if (data.projects) {
    for (let id of Object.keys(data.projects)) {
      hexo.theme.config.wiki.projects[id] = data.projects[id];
    }
  }

  // wiki 配置
  var wiki = hexo.theme.config.wiki;
  // wiki 所有页面
  const wiki_pages = hexo.locals.get('pages').filter(function (p) {
    return (p.layout === 'wiki') && (p.wiki != undefined) && (p.wiki.length > 0);
  });

  // 数据整合：项目标签
  var tagNames = [];
  for (let id of Object.keys(wiki.projects)) {
    let proj = wiki.projects[id];
    let tags = proj.tags;
    if (tags) {
      if ((typeof tags == 'string') && tags.constructor == String) {
        if (tagNames.includes(tags) === false) {
          tagNames.push(tags);
        }
        // 类型转换
        tags = [tags];
      } else if ((typeof tags == 'object') && tags.constructor == Array) {
        tags.forEach((tag, i) => {
          if (tagNames.includes(tag) === false) {
            tagNames.push(tag);
          }
        });
      }
      wiki.projects[id].tags = tags;
    }
  }
  // 补充未分组的项目
  const projs = Object.keys(wiki.projects);
  wiki_pages.forEach((p, i) => {
    if (projs.includes(p.wiki) == false) {
      if (wiki.projects[p.wiki] == undefined) {
        wiki.projects[p.wiki] = {};
        wiki.projects[p.wiki].pages = [];
      }
      var proj = wiki.projects[p.wiki];
      if (proj.description == undefined) {
        proj.description = p.description;
      }
      wiki.projects[p.wiki].pages.push(p);
    }
  });
  // 补充项目名称和首页
  for (let id of Object.keys(wiki.projects)) {
    let proj = wiki.projects[id];
    proj.id = id;
    if (proj.title == undefined || proj.title.length === 0) {
      proj.title = id;
    }
  }
  // 补充 order
  wiki_pages.forEach((p, i) => {
    if (p.order == undefined) {
      p.order = 0;
    }
  });

  // 数据整合：每个项目的子页面
  for (let id of Object.keys(wiki.projects)) {
    let proj = wiki.projects[id];
    proj.pages = wiki_pages.filter(function (p) {
      return p.wiki === id;
    }).sort('order');
    proj.pages.limit(1).forEach((p, i) => {
      proj.homepage = p;
    });
    // 内页按 section 分组
    var sectionConfigs = [];
    if (proj.sections) {
      for (let t of Object.keys(proj.sections)) {
        let range = proj.sections[t];
        if (range.length > 1) {
          sectionConfigs.push({
            title: t,
            from: range[0],
            to: range[1]
          });
        }
      }
    }
    var sections = [];
    sectionConfigs.forEach((sec, i) => {
      const pages = proj.pages.filter(function (p) {
        return p.order >= sec.from && p.order <= sec.to;
      });
      if (pages && pages.length > 0) {
        sections.push({
          title: sec.title,
          pages: pages
        });
      }
    });
    proj.sections = sections;
  }

  // 全站所有的项目标签
  var all_tags = {};
  tagNames.forEach((tagName, i) => {
    var projs = [];
    for (let id of Object.keys(wiki.projects)) {
      let proj = wiki.projects[id];
      if (proj.tags && proj.tags.includes(tagName) === true && projs.includes(tagName) === false) {
        projs.push(proj.id);
      }
    }
    all_tags[tagName] = {
      name: tagName,
      path: (hexo.config.wiki_dir || 'wiki') + '/tags/' + tagName + '/index.html',
      items: projs
    };
  });

  // 整合相似项目
  for (let id of Object.keys(wiki.projects)) {
    let proj = wiki.projects[id];
    if (proj.tags) {
      var related = [];
      proj.tags.forEach((tagName, i) => {
        let tagObj = all_tags[tagName];
        related = related.concat(tagObj.items);
        related = [...new Set(related)];
      });
      proj.related = related;
    }
  }

  wiki.all_tags = all_tags;
  wiki.all_pages = wiki_pages;
};
