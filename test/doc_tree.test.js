'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildWikiTree, WikiPage } = require('../scripts/lib/doc_tree');
const { normalize_path } = require('../scripts/lib/path_utils');

// ---------------------------------------------------------------------------
// 旧实现参照：逐字取自 git HEAD scripts/events/lib/doc_tree.js，
// 仅增加可调用包装（fake ctx），用于验证重构后输出与旧算法完全一致。
// ---------------------------------------------------------------------------

function referenceGetWikiObject(ctx) {
  var wiki = { tree:{} }
  const data = ctx.locals.get('data')
  var list = []
  for (let key of Object.keys(data)) {
    if (key.endsWith('.DS_Store')) {
      continue
    }
    if (key.includes('wiki/') && key.length > 5) {
      let newKey = key.replace('wiki/', '')
      let obj = data[key]
      if ((typeof obj.tags == 'string') && obj.tags.constructor == String) {
        obj.tags = [obj.tags]
      }
      if ((typeof obj.tree == 'object') && obj.tree.constructor == Array) {
        obj.tree = { '': obj.tree }
      }
      obj.id = newKey
      if (obj.sort == null) {
        obj.sort = 0
      }
      if (obj.base_dir) {
        if (obj.base_dir.startsWith('/')) {
          obj.base_dir = obj.base_dir.substring(1)
        }
        if (obj.base_dir.length > 1 && obj.base_dir.endsWith('/') == false) {
          obj.base_dir = obj.base_dir + '/'
        }
      } else {
        obj.base_dir = ''
      }
      list.push(obj)
    }
  }
  list = list.sort((p1, p2) => p2.sort - p1.sort)
  for (let item of list) {
    wiki.tree[item.id] = item
  }
  return wiki
}

function referenceBuildWikiTree({ data, pages, shelf, siteTree }) {
  const ctx = {
    locals: {
      // 旧实现从 ctx.locals.get('data').wiki 读取上架列表
      get: key => (key === 'data' ? { ...data, wiki: shelf } : pages)
    },
    theme: {
      config: {
        site_tree: siteTree
      }
    }
  }

  // wiki 配置
  var wiki = referenceGetWikiObject(ctx)
  const allPages = ctx.locals.get('pages')
  // wiki 所有页面
  const wiki_pages = allPages.filter(p => (p.wiki != null)).map(p => new WikiPage(p))
  const wiki_list = Object.keys(wiki.tree).filter(id => wiki_pages.some(p => p.wiki === id))
  // 上架的项目列表
  wiki.shelf = ctx.locals.get('data').wiki || []

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
  for (let i = 0; i < wiki_list.length; i++) {
    let id = wiki_list[i];
    let item = wiki.tree[id]
    let sub_pages = wiki_pages.filter(p => p.wiki === id)

    // 首页
    // 未特别指定首页时，获取TOC第一页作为首页
    var homepage = item.homepage
    if (homepage == null && item.tree != null) {
      for (let tid of Object.keys(item.tree)) {
        const sec = item.tree[tid]
        for (let key of sec) {
          let hs = sub_pages.filter(p => p.path_key == normalize_path(item.base_dir + key))
          if (hs.length > 0) {
            homepage = hs[0]
            break
          }
        }
        if (homepage != null) {
          break
        }
      }
    }
    if (homepage == null) {
      homepage = sub_pages[0]
    }
    if (typeof homepage == 'string') {
      homepage = {path: homepage}
    }
    homepage.is_homepage = true
    item.homepage = homepage
    // 内页分组
    var sections = []
    var others = sub_pages
    if (item.tree) {
      // 根据配置设置顺序
      for (let title of Object.keys(item.tree)) {
        var sec = { title: title, pages: []}
        for (let key of item.tree[title]) {
          const pagePathKey = normalize_path(item.base_dir + key)
          sec.pages = sec.pages.concat(sub_pages.filter(p => p.path_key == pagePathKey))
          others = others.filter(p => p.path_key != pagePathKey)
        }
        sections.push(sec)
      }
      if (others.length > 0 && others.filter(p => p.title?.length > 0).length > 0) {
        sections.push({
          title: '...',
          pages: others.sort((p1, p2) => p1.title - p2.title)
        })
      }
    } else {
      // 自动设置顺序
      sections.push({
        pages: sub_pages.sort((p1, p2) => p1.title - p2.title)
      })
    }

    // page number
    var page_number = 0
    for (let sec of sections) {
      for (let page of sec.pages) {
        page.page_number = page_number++
      }
    }
    item.sections = sections
    item.pages = sub_pages
  }

  // 全站所有的项目标签
  var all_tags = {}
  all_tag_name.forEach((tag_name, i) => {
    var items = []
    for (let id of wiki_list) {
      let item = wiki.tree[id]
      // 过滤掉找不到页面的项目
      if (item.homepage == null) {
        continue
      }
      // 过滤掉未上架的项目
      if (!wiki.shelf.includes(item.id)) {
        continue
      }
      if (item.tags && item.tags.includes(tag_name) === true && items.includes(tag_name) === false) {
        items.push(item.id)
      }
    }
    all_tags[tag_name] = {
      name: tag_name,
      path: (ctx.theme.config.site_tree.index_wiki.base_dir) + '/tags/' + tag_name + '/index.html',
      items: items
    }
  })

  // 关联相似项目
  for (let id of wiki_list) {
    let item = wiki.tree[id]
    if (item.tags) {
      var relatedItems = []
      item.tags.forEach((tag_name, i) => {
        let relatedOtherItems = all_tags[tag_name].items.filter(name => name != item.id)
        if (relatedOtherItems.length > 0) {
          relatedItems.push({
            name: tag_name,
            items: relatedOtherItems
          })
        }
      })
      item.relatedItems = relatedItems
    }
  }

  wiki.all_tags = all_tags
  wiki.all_pages = wiki_pages
  return wiki
}

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

function makeFixture() {
  const data = {
    'wiki/alpha': {
      sort: 2,
      title: 'Alpha Project',
      tags: 'guide',
      tree: {
        '基础': ['intro.html', 'setup.md'],
        '进阶': ['advanced.html']
      },
      base_dir: '/wiki/alpha/'
    },
    'wiki/beta': {
      sort: 1,
      tree: ['one.html', 'two.html'],
      tags: ['guide', 'extra'],
      base_dir: 'wiki/beta'
    },
    'wiki/gamma': {
      sort: 0,
      tags: ['empty']
    },
    'wiki/delta': {
      sort: 0,
      tree: { 'S': ['nonexistent.html'] },
      tags: ['solo']
    }
  };
  const pages = [
    { _id: 'p1', wiki: 'alpha', title: 'Intro', path: 'wiki/alpha/intro.html', layout: 'wiki', updated: '2026-01-01' },
    { _id: 'p2', wiki: 'alpha', title: 'Setup', path: 'wiki/alpha/setup.md', layout: 'wiki', updated: '2026-01-02' },
    { _id: 'p3', wiki: 'alpha', title: 'Advanced', path: 'wiki/alpha/advanced.html', layout: 'wiki', updated: '2026-01-03' },
    { _id: 'p7', wiki: 'alpha', title: 'Advanced Dup', path: 'wiki/alpha/advanced/', layout: 'wiki', updated: '2026-01-05' },
    { _id: 'p6', wiki: 'alpha', title: 'Extra', path: 'wiki/alpha/extra.html', layout: 'wiki', updated: '2026-01-04' },
    { _id: 'p4', wiki: 'beta', title: 'One', path: 'wiki/beta/one.html', layout: 'wiki', updated: '2026-02-01' },
    { _id: 'p5', wiki: 'beta', title: 'Two', path: 'wiki/beta/two.html', layout: 'wiki', updated: '2026-02-02' },
    { _id: 'p8', wiki: 'delta', title: 'Delta One', path: 'wiki/delta/one.html', layout: 'wiki', updated: '2026-03-01' },
    { _id: 'p9', wiki: 'delta', title: 'Delta Two', path: 'wiki/delta/two.html', layout: 'wiki', updated: '2026-03-02' },
    { _id: 'p10', title: 'No Wiki', path: 'about/index.html', layout: 'page', updated: '2026-04-01' }
  ];
  const shelf = ['alpha', 'beta'];
  const siteTree = { index_wiki: { base_dir: '/wiki' } };
  return { data, pages, shelf, siteTree };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('doc_tree 重构与旧实现输出一致（基础 fixture）', () => {
  const actual = buildWikiTree(structuredClone(makeFixture()));
  const expected = referenceBuildWikiTree(structuredClone(makeFixture()));
  assert.deepStrictEqual(actual, expected);
});

test('doc_tree 重构与旧实现输出一致（项目 id 等于标签名的去重边界）', () => {
  const fixture = {
    data: {
      'wiki/guide': { sort: 5, tags: ['guide'] },
      'wiki/other': { sort: 4, tags: ['guide'] }
    },
    pages: [
      { _id: 'g1', wiki: 'guide', title: 'G', path: 'wiki/guide/a.html', layout: 'wiki', updated: '2026-01-01' },
      { _id: 'o1', wiki: 'other', title: 'O', path: 'wiki/other/b.html', layout: 'wiki', updated: '2026-01-02' }
    ],
    shelf: ['guide', 'other'],
    siteTree: { index_wiki: { base_dir: '/wiki' } }
  };
  const actual = buildWikiTree(structuredClone(fixture));
  const expected = referenceBuildWikiTree(structuredClone(fixture));
  assert.deepStrictEqual(actual, expected);
  assert.deepStrictEqual(actual.all_tags.guide.items, ['guide']);
});

test('doc_tree 输出结构语义正确', () => {
  const wiki = buildWikiTree(structuredClone(makeFixture()));

  // tree 键序按 sort 降序（相等时保持插入序）
  assert.deepStrictEqual(Object.keys(wiki.tree), ['alpha', 'beta', 'gamma', 'delta']);
  // 无页面的项目不进入 wiki_list（gamma 有 tree 键但无页面）
  assert.deepStrictEqual(wiki.all_pages.map(p => p.wiki), ['alpha', 'alpha', 'alpha', 'alpha', 'alpha', 'beta', 'beta', 'delta', 'delta']);

  // homepage：TOC 第一匹配页
  assert.equal(wiki.tree.alpha.homepage.title, 'Intro');
  assert.equal(wiki.tree.beta.homepage.title, 'One');
  // tree 键全部不匹配时回退 sub_pages[0]
  assert.equal(wiki.tree.delta.homepage.title, 'Delta One');
  assert.equal(wiki.tree.delta.homepage.is_homepage, true);

  // sections：重复 path_key 页面在对应 section 内按序重复输出，未收录页面归 '...'
  assert.deepStrictEqual(wiki.tree.alpha.sections.map(s => s.title), ['基础', '进阶', '...']);
  assert.deepStrictEqual(wiki.tree.alpha.sections[0].pages.map(p => p.title), ['Intro', 'Setup']);
  assert.deepStrictEqual(wiki.tree.alpha.sections[1].pages.map(p => p.title), ['Advanced', 'Advanced Dup']);
  assert.deepStrictEqual(wiki.tree.alpha.sections[2].pages.map(p => p.title), ['Extra']);

  // page_number 按 sections 顺序连续赋值
  assert.deepStrictEqual(
    wiki.tree.alpha.sections.flatMap(s => s.pages.map(p => p.page_number)),
    [0, 1, 2, 3, 4]
  );

  // all_tags：上架过滤 + 标签聚合
  assert.deepStrictEqual(wiki.all_tags.guide.items, ['alpha', 'beta']);
  assert.deepStrictEqual(wiki.all_tags.extra.items, ['beta']);
  assert.deepStrictEqual(wiki.all_tags.solo.items, []);
  assert.equal(wiki.all_tags.guide.path, '/wiki/tags/guide/index.html');

  // relatedItems：同标签其它项目
  assert.deepStrictEqual(wiki.tree.alpha.relatedItems, [{ name: 'guide', items: ['beta'] }]);
  assert.deepStrictEqual(wiki.tree.beta.relatedItems, [{ name: 'guide', items: ['alpha'] }]);

  // title / name 缺省补为项目 id
  assert.equal(wiki.tree.beta.title, 'beta');
  assert.equal(wiki.tree.beta.name, 'beta');
});
