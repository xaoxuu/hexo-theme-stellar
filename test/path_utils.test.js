'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { normalize_path } = require('../scripts/lib/path_utils');

test('normalize_path 保留完整 URL', () => {
  assert.equal(normalize_path('https://example.com/a'), 'https://example.com/a');
  assert.equal(normalize_path('http://example.com/'), 'http://example.com/');
});

test('normalize_path 去除 index.html 后缀', () => {
  assert.equal(normalize_path('/index.html'), '/');
  assert.equal(normalize_path('/wiki/stellar/index.html'), '/wiki/stellar');
  assert.equal(normalize_path('/wiki/stellar/index'), '/wiki/stellar');
});

test('normalize_path 去除 .html 后缀', () => {
  assert.equal(normalize_path('/about.html'), '/about');
  assert.equal(normalize_path('/a/b/c.html'), '/a/b/c');
});

test('normalize_path 去除末尾斜杠（根路径除外）', () => {
  assert.equal(normalize_path('/about/'), '/about');
  assert.equal(normalize_path('/'), '/');
});

test('normalize_path 组合与边界场景', () => {
  assert.equal(normalize_path(''), '');
  assert.equal(normalize_path('/a/b/index.html'), '/a/b');
  assert.equal(normalize_path('/a//b/'), '/a//b');
});

test('normalize_path 兼容 pretty_urls.trailing_index（#523）', () => {
  // trailing_index: true 时 page.path 为 xxx/index.html，item.url 省略 index.html
  assert.equal(normalize_path('/about/index.html'), normalize_path('/about'));
  assert.equal(normalize_path('/about/index.html'), normalize_path('/about/'));
  assert.equal(normalize_path('/blog/2026/01/01/index.html'), normalize_path('/blog/2026/01/01'));
  assert.equal(normalize_path('/wiki/stellar/index'), normalize_path('/wiki/stellar'));
});
