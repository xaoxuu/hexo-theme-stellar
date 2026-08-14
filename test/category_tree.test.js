'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildCategoryTree } = require('../scripts/lib/category_tree');

function cat(id, name, parent, posts = []) {
  return {
    _id: id,
    name,
    path: `/${name}`,
    parent: parent || null,
    posts: posts
  };
}

test('buildCategoryTree 兼容字符串 parent id（Hexo 原始形态）', () => {
  const tree = buildCategoryTree([
    cat('a', 'A', null),
    cat('b', 'B', 'a'),
    cat('c', 'C', 'b')
  ]);
  assert.equal(tree[0].children[0].name, 'B');
  assert.equal(tree[0].children[0].children[0].name, 'C');
});

test('buildCategoryTree 兼容对象 parent（populate 后形态）', () => {
  const tree = buildCategoryTree([
    { _id: 'a', name: 'A', path: '/A', parent: null, posts: [] },
    { _id: 'b', name: 'B', path: '/B', parent: { _id: 'a' }, posts: [] }
  ]);
  assert.equal(tree[0].children[0].name, 'B');
});

test('buildCategoryTree 组装一级分类', () => {
  const tree = buildCategoryTree([cat('a', 'A', null)]);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].name, 'A');
  assert.equal(tree[0].children.length, 0);
});

test('buildCategoryTree 支持三级分类（#564）', () => {
  const tree = buildCategoryTree([
    cat('a', 'A', null),
    cat('b', 'B', 'a'),
    cat('c', 'C', 'b')
  ]);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].name, 'A');
  assert.equal(tree[0].children[0].name, 'B');
  assert.equal(tree[0].children[0].children[0].name, 'C');
});

test('buildCategoryTree 子分类挂到正确父节点，孤儿归根', () => {
  const tree = buildCategoryTree([
    cat('a', 'A', null),
    cat('b', 'B', 'a'),
    cat('x', 'X', 'missing')
  ]);
  assert.equal(tree.length, 2);
  const a = tree.find(n => n.name === 'A');
  assert.equal(a.children.length, 1);
  assert.equal(a.children[0].name, 'B');
});

test('buildCategoryTree 统计文章数', () => {
  const tree = buildCategoryTree([cat('a', 'A', null, [{}, {}])]);
  assert.equal(tree[0].count, 2);
});
