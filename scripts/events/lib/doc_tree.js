/**
 * doc_tree.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 */

'use strict';

module.exports = hexo => {
  const data = hexo.locals.get('data');
  if (hexo.theme.config.wiki === undefined) {
    hexo.theme.config.wiki = {};
  }
  if (hexo.theme.config.wiki.projects === undefined) {
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
    return (p.layout === 'wiki') && (p.wiki !== undefined) && (p.wiki.length > 0);
  });

  // 数据整合：项目组
  var cats = [];
  for (let proj_name of Object.keys(wiki.projects)) {
    let proj = wiki.projects[proj_name];
    if (proj.group !== undefined) {
      if (cats.includes(proj.group) === false) {
        cats.push(proj.group);
      }
    }
  }
  // 补充未分组的项目
  const projs = Object.keys(wiki.projects);
  wiki_pages.forEach((p, i) => {
    if (projs.includes(p.wiki) === false) {
      if (wiki.projects[p.wiki] === undefined) {
        wiki.projects[p.wiki] = {};
        wiki.projects[p.wiki].pages = [];
      }
      var proj = wiki.projects[p.wiki];
      if (proj.description === undefined) {
        proj.description = p.description;
      }
      wiki.projects[p.wiki].pages.push(p);
    }
  });
  // 补充项目名称
  for (let proj_name of Object.keys(wiki.projects)) {
    let proj = wiki.projects[proj_name];
    if (proj.title === undefined || proj.title.length === 0) {
      proj.title = proj_name;
    }
  }

  // 数据整合：每个项目的子页面
  for (let proj_name of Object.keys(wiki.projects)) {
    let proj = wiki.projects[proj_name];
    proj.pages = wiki_pages.filter(function (p) {
      return p.wiki === proj_name;
    }).sort('order');
    proj.pages.limit(1).forEach((p, i) => {
      proj.path = p.path;
    });
  }

  var groups = {};
  cats.forEach((group_name, i) => {
    var projs = [];
    for (let proj_name of Object.keys(wiki.projects)) {
      let proj = wiki.projects[proj_name];
      if (proj.group === group_name && projs.includes(group_name) === false) {
        projs.push(proj);
      }
    }
    groups[group_name] = {
      title: group_name,
      path: (hexo.config.wiki_dir || 'wiki') + '/categories/' + group_name + '/index.html',
      projects: projs
    };
  });
  wiki.groups = groups;
  wiki.all_pages = wiki_pages;
};
