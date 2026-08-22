'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildWikiTree } = require('../scripts/lib/doc_tree');

function collection(id) {
  return { type: 'wiki', id };
}

function makeFixture() {
  const data = {
    'wiki/alpha': {
      name: 'Alpha',
      headline: 'Alpha Project',
      listing: { sort: 2 },
      tags: ['guide'],
      tree: {
        '基础': ['intro.html', 'setup.md'],
        '进阶': ['advanced.html']
      },
      routing: { base_dir: '/wiki/alpha/' }
    },
    'wiki/beta': {
      name: 'Beta',
      listing: { sort: 1 },
      tree: ['one.html', 'two.html'],
      tags: ['guide', 'extra'],
      routing: { base_dir: 'wiki/beta' }
    },
    'wiki/gamma': { name: 'Gamma', listing: { sort: 0 }, tags: ['empty'] },
    'wiki/delta': {
      name: 'Delta',
      listing: { sort: 0 },
      tree: { S: ['nonexistent.html'] },
      tags: ['solo']
    }
  };
  const pages = [
    { _id: 'p1', collection: collection('alpha'), title: 'Intro', path: 'wiki/alpha/intro.html', layout: 'wiki', updated: '2026-01-01' },
    { _id: 'p2', collection: collection('alpha'), title: 'Setup', path: 'wiki/alpha/setup.md', layout: 'wiki', updated: '2026-01-02' },
    { _id: 'p3', collection: collection('alpha'), title: 'Advanced', path: 'wiki/alpha/advanced.html', layout: 'wiki', updated: '2026-01-03' },
    { _id: 'p7', collection: collection('alpha'), title: 'Advanced Dup', path: 'wiki/alpha/advanced/', layout: 'wiki', updated: '2026-01-05' },
    { _id: 'p6', collection: collection('alpha'), title: 'Extra', path: 'wiki/alpha/extra.html', layout: 'wiki', updated: '2026-01-04' },
    { _id: 'p4', collection: collection('beta'), title: 'One', path: 'wiki/beta/one.html', layout: 'wiki', updated: '2026-02-01' },
    { _id: 'p5', collection: collection('beta'), title: 'Two', path: 'wiki/beta/two.html', layout: 'wiki', updated: '2026-02-02' },
    { _id: 'p8', collection: collection('delta'), title: 'Delta One', path: 'wiki/delta/one.html', layout: 'wiki', updated: '2026-03-01' },
    { _id: 'p9', collection: collection('delta'), title: 'Delta Two', path: 'wiki/delta/two.html', layout: 'wiki', updated: '2026-03-02' },
    { _id: 'p11', collection: collection('alpha'), title: 'Hidden', path: 'wiki/alpha/hidden.html', visibility: { listed: false } },
    { _id: 'p10', title: 'No Wiki', path: 'about/index.html', layout: 'page', updated: '2026-04-01' }
  ];
  return { data, pages, shelf: ['alpha', 'beta'], wikiIndexPath: '/wiki/' };
}

test('doc_tree 按 v2 collection 归属页面并规范化路由', () => {
  const wiki = buildWikiTree(structuredClone(makeFixture()));

  assert.deepStrictEqual(Object.keys(wiki.tree), ['alpha', 'beta', 'gamma', 'delta']);
  assert.deepStrictEqual(wiki.all_pages.map(page => page.collectionId), [
    'alpha', 'alpha', 'alpha', 'alpha', 'alpha', 'beta', 'beta', 'delta', 'delta'
  ]);
  assert.equal(wiki.tree.alpha.routing.base_dir, 'wiki/alpha/');
  assert.equal(wiki.tree.beta.routing.base_dir, 'wiki/beta/');
  assert.equal(wiki.tree.beta.headline, 'Beta');
});

test('doc_tree 生成首页、分组与连续页码', () => {
  const wiki = buildWikiTree(structuredClone(makeFixture()));

  assert.equal(wiki.tree.alpha.homepage.title, 'Intro');
  assert.equal(wiki.tree.beta.homepage.title, 'One');
  assert.equal(wiki.tree.delta.homepage.title, 'Delta One');
  assert.equal(wiki.tree.delta.homepage.is_homepage, true);
  assert.deepStrictEqual(wiki.tree.alpha.sections.map(section => section.title), ['基础', '进阶', '...']);
  assert.deepStrictEqual(wiki.tree.alpha.sections[0].pages.map(page => page.title), ['Intro', 'Setup']);
  assert.deepStrictEqual(wiki.tree.alpha.sections[1].pages.map(page => page.title), ['Advanced', 'Advanced Dup']);
  assert.deepStrictEqual(wiki.tree.alpha.sections[2].pages.map(page => page.title), ['Extra']);
  assert.deepStrictEqual(
    wiki.tree.alpha.sections.flatMap(section => section.pages.map(page => page.page_number)),
    [0, 1, 2, 3, 4]
  );
});

test('doc_tree 汇总上架项目标签与关联项目', () => {
  const wiki = buildWikiTree(structuredClone(makeFixture()));

  assert.deepStrictEqual(wiki.all_tags.guide.items, ['alpha', 'beta']);
  assert.deepStrictEqual(wiki.all_tags.extra.items, ['beta']);
  assert.deepStrictEqual(wiki.all_tags.solo.items, []);
  assert.equal(wiki.all_tags.guide.path, 'wiki/tags/guide/index.html');
  assert.deepStrictEqual(wiki.tree.alpha.relatedItems, [{ name: 'guide', items: ['beta'] }]);
  assert.deepStrictEqual(wiki.tree.beta.relatedItems, [{ name: 'guide', items: ['alpha'] }]);
});

test('doc_tree 不把 visibility.listed=false 页面放入目录和最近列表', () => {
  const wiki = buildWikiTree(structuredClone(makeFixture()));
  assert.equal(wiki.all_pages.some(page => page.title === 'Hidden'), false);
  assert.equal(wiki.tree.alpha.pages.some(page => page.title === 'Hidden'), false);
});

test('项目 id 与标签同名时不丢失其它项目', () => {
  const fixture = {
    data: {
      'wiki/guide': { name: 'Guide', listing: { sort: 5 }, tags: ['guide'] },
      'wiki/other': { name: 'Other', listing: { sort: 4 }, tags: ['guide'] }
    },
    pages: [
      { _id: 'g1', collection: collection('guide'), title: 'G', path: 'wiki/guide/a.html' },
      { _id: 'o1', collection: collection('other'), title: 'O', path: 'wiki/other/b.html' }
    ],
    shelf: ['guide', 'other'],
    wikiIndexPath: '/wiki/'
  };
  const wiki = buildWikiTree(structuredClone(fixture));
  assert.deepStrictEqual(wiki.all_tags.guide.items, ['guide', 'other']);
});
