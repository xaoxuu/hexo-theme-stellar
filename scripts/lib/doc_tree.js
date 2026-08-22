/**
 * doc_tree.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * Wiki 文档树构建（纯函数，供 events/lib/doc_tree.js 调用与单测覆盖）。
 * 使用 v2 collection/route/listing 结构，并把重复的 filter/some 遍历改为单遍 Map 索引：
 * - 页面按 wiki 分组一次（O(W+P) 替代 O(W*P)）；
 * - 项目内按 path_key 分组一次，首页解析与 sections 组装改走索引查询；
 * - all_tags / relatedItems 用 Set/Map 去重，输出顺序不变。
 */

'use strict';

const { normalize_path } = require('./path_utils');
const { getCollectionId, isListed } = require('./content-config');
const { profilePath } = require("./layout-config");

class WikiPage {
  constructor(page, config) {
    this.id = page._id;
    this.collectionId = getCollectionId(config, "wiki");
    this.title = page.title;
    this.path = page.path;
    this.path_key = normalize_path(page.path);
    this.layout = page.layout;
    this.updated = page.updated;
    this.listed = isListed(config);
  }
}

function getWikiObject(data) {
  var wiki = { tree: {} };
  var list = [];
  for (let key of Object.keys(data)) {
    if (key.endsWith('.DS_Store')) {
      continue;
    }
    if (key.includes('wiki/') && key.length > 5) {
      let newKey = key.replace('wiki/', '');
      let obj = data[key];
      const tree = obj.navigation?.tree;
      if ((typeof tree == "object") && tree.constructor == Array) {
        obj.navigation.tree = { "": tree };
      }
      obj.id = newKey;
      obj.listing ||= {};
      obj.listing.sort ??= 0;
      const baseDir = obj.route?.path || "";
      if (baseDir) {
        if (baseDir.startsWith('/')) {
          obj.route.path = baseDir.substring(1);
        }
        if (obj.route.path.length > 1 && obj.route.path.endsWith("/") == false) {
          obj.route.path = obj.route.path + "/";
        }
      }
      list.push(obj);
    }
  }
  list = list.sort((p1, p2) => p2.listing.sort - p1.listing.sort);
  for (let item of list) {
    wiki.tree[item.id] = item;
  }
  return wiki;
}

/**
 * 构建 wiki 文档树。
 * @param {Object} options
 * @param {Object} options.data 站点 _data（含 wiki/ 前缀的 YAML 数据）
 * @param {Array|Object} options.pages 站点 pages（warehouse Query 或数组）
 * @param {Map} options.pageConfigs 页面对象到冻结 Front Matter 配置的映射
 * @param {Array} options.shelf 上架项目 id 列表
 * @param {string} options.wikiIndexPath 冻结的 Wiki Index Profile 路径
 */
function buildWikiTree({ data, pages, pageConfigs, shelf, wikiIndexPath }) {
  // wiki 配置
  var wiki = getWikiObject(data);
  // wiki 所有页面
  const allWikiPages = pages
    .filter(page => getCollectionId(pageConfigs.get(page), "wiki") != null)
    .map(page => new WikiPage(page, pageConfigs.get(page)));

  // 单遍分组：wiki id → WikiPage[]（保持 wiki_pages 原始顺序）
  const pagesByWiki = new Map();
  for (const wp of allWikiPages) {
    let arr = pagesByWiki.get(wp.collectionId);
    if (arr == null) {
      arr = [];
      pagesByWiki.set(wp.collectionId, arr);
    }
    arr.push(wp);
  }

  // 上架的项目列表
  wiki.shelf = shelf || [];

  // 按 tree 键序过滤出有页面的项目（等价于旧实现 wiki_pages.some 判定）
  const wiki_list = Object.keys(wiki.tree).filter(id => pagesByWiki.has(id));

  // 数据整合：项目标签
  var all_tag_name = [];
  for (let id of wiki_list) {
    let item = wiki.tree[id];
    let tags = item.tags;
    if (tags) {
      tags.forEach((tag, i) => {
        if (all_tag_name.includes(tag) === false) {
          all_tag_name.push(tag);
        }
      });
      wiki.tree[id].tags = tags;
    }
  }

  // 补充项目名称和首页
  for (let id of wiki_list) {
    let item = wiki.tree[id];
    item.id = id;
    if (item.name == undefined || item.name.length == 0) {
      item.name = id;
    }
    if (item.headline == undefined || item.headline.length === 0) {
      item.headline = item.name;
    }
  }

  // 数据整合：每个项目的子页面
  for (let i = 0; i < wiki_list.length; i++) {
    let id = wiki_list[i];
    let item = wiki.tree[id];
    const projectPages = pagesByWiki.get(id) || [];
    let sub_pages = projectPages.filter(page => page.listed);

    // 单遍 path_key 索引：同一 path_key 可能对应多个页面，保持数组与顺序
    const pagesByPathKey = new Map();
    for (const p of projectPages) {
      let arr = pagesByPathKey.get(p.path_key);
      if (arr == null) {
        arr = [];
        pagesByPathKey.set(p.path_key, arr);
      }
      arr.push(p);
    }

    // 首页
    // 未特别指定首页时，获取TOC第一页作为首页
    var homepage = item.homepage;
    if (homepage == null && item.navigation?.tree != null) {
      for (let tid of Object.keys(item.navigation.tree)) {
        const sec = item.navigation.tree[tid];
        for (let key of sec) {
          const hs = pagesByPathKey.get(normalize_path((item.route?.path || "") + key)) || [];
          if (hs.length > 0) {
            homepage = hs[0];
            break;
          }
        }
        if (homepage != null) {
          break;
        }
      }
    }
    if (homepage == null) {
      homepage = projectPages[0];
    }
    if (typeof homepage == 'string') {
      homepage = { path: homepage };
    }
    homepage.is_homepage = true;
    item.homepage = homepage;

    // 内页分组
    var sections = [];
    var others = sub_pages;
    if (item.navigation?.tree) {
      // 根据配置设置顺序
      const assignedPathKeys = new Set();
      for (let title of Object.keys(item.navigation.tree)) {
        var sec = { title: title, pages: [] };
        for (let key of item.navigation.tree[title]) {
          const pagePathKey = normalize_path((item.route?.path || "") + key);
          const matched = (pagesByPathKey.get(pagePathKey) || []).filter(page => page.listed);
          sec.pages = sec.pages.concat(matched);
          if (matched.length > 0) {
            assignedPathKeys.add(pagePathKey);
          }
        }
        sections.push(sec);
      }
      // 未被任何 section 收录的页面归入 '...' 分组（顺序同 sub_pages 过滤结果）
      others = sub_pages.filter(p => !assignedPathKeys.has(p.path_key));
      if (others.length > 0 && others.filter(p => p.title?.length > 0).length > 0) {
        sections.push({
          title: '...',
          pages: others.sort((p1, p2) => p1.title - p2.title)
        });
      }
    } else {
      // 自动设置顺序
      sections.push({
        pages: sub_pages.sort((p1, p2) => p1.title - p2.title)
      });
    }

    // page number
    var page_number = 0;
    for (let sec of sections) {
      for (let page of sec.pages) {
        page.page_number = page_number++;
      }
    }
    item.sections = sections;
    item.pages = sub_pages;
  }

  // 全站所有的项目标签
  var all_tags = {};
  all_tag_name.forEach((tag_name, i) => {
    var items = [];
    var itemsSet = new Set();
    for (let id of wiki_list) {
      let item = wiki.tree[id];
      // 过滤掉找不到页面的项目
      if (item.homepage == null) {
        continue;
      }
      // 过滤掉未上架的项目
      if (!wiki.shelf.includes(item.id)) {
        continue;
      }
      if (item.tags && item.tags.includes(tag_name) === true && itemsSet.has(item.id) === false) {
        itemsSet.add(item.id);
        items.push(item.id);
      }
    }
    all_tags[tag_name] = {
      name: tag_name,
      path: profilePath(wikiIndexPath) + "/tags/" + tag_name + "/index.html",
      items: items
    };
  });

  // 关联相似项目
  for (let id of wiki_list) {
    let item = wiki.tree[id];
    if (item.tags) {
      var relatedItems = [];
      item.tags.forEach((tag_name, i) => {
        let relatedOtherItems = all_tags[tag_name].items.filter(name => name != item.id);
        if (relatedOtherItems.length > 0) {
          relatedItems.push({
            name: tag_name,
            items: relatedOtherItems
          });
        }
      });
      item.relatedItems = relatedItems;
    }
  }

  wiki.all_tags = all_tags;
  wiki.all_pages = allWikiPages.filter(page => page.listed);
  return wiki;
}

module.exports = {
  buildWikiTree,
  WikiPage
};
