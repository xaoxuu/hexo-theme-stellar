'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const LOCAL_SEARCH_SOURCE = fs.readFileSync(
  path.join(__dirname, '../source/js/search/local-search.js'),
  'utf8'
);
const ALGOLIA_SEARCH_SOURCE = fs.readFileSync(
  path.join(__dirname, '../source/js/search/algolia-search.js'),
  'utf8'
);
const SEARCH_STYLE_SOURCE = fs.readFileSync(
  path.join(__dirname, '../source/css/_components/sidebar/search.styl'),
  'utf8'
);
const HOVER_CLASSES = 'card-hover card-hover--spotlight';

test('本地搜索只为标题下方的可点击链接输出 Spotlight 组合类', () => {
  assert.match(LOCAL_SEARCH_SOURCE, /li\.appendChild\(titleSpan\);[\s\S]*const a = document\.createElement\('a'\);/);
  assert.match(LOCAL_SEARCH_SOURCE, new RegExp(`a\\.className = '${HOVER_CLASSES}'`));
  assert.match(LOCAL_SEARCH_SOURCE, /li\.appendChild\(a\);/);
  assert.doesNotMatch(LOCAL_SEARCH_SOURCE, /titleSpan\.className = ['"]search-result-title card-hover/);
  assert.doesNotMatch(LOCAL_SEARCH_SOURCE, /a\.className = ['"][^'"]*card-hover--tilt/);
});

test('Algolia 将标题移出链接并只为可点击区域输出 Spotlight 组合类', () => {
  assert.match(ALGOLIA_SEARCH_SOURCE, /item\.appendChild\(titleSpan\);\s*item\.appendChild\(link\);/);
  assert.match(ALGOLIA_SEARCH_SOURCE, new RegExp(`link\\.className = "${HOVER_CLASSES}"`));
  assert.doesNotMatch(ALGOLIA_SEARCH_SOURCE, /titleSpan\.className = ['"]search-result-title card-hover/);
  assert.doesNotMatch(ALGOLIA_SEARCH_SOURCE, /link\.className = ['"][^'"]*card-hover--tilt/);
});

test('两种搜索服务在替换前卸载旧结果并在插入后挂载新结果', () => {
  assert.match(LOCAL_SEARCH_SOURCE, /unmountResultCards\(\$resultContent\);\s*\$resultContent\.innerHTML = "";/);
  assert.match(LOCAL_SEARCH_SOURCE, /\$resultContent\.appendChild\(ul\);\s*mountResultCards\(ul\);/);
  assert.match(ALGOLIA_SEARCH_SOURCE, /unmountResultCards\(resultArea\);\s*resultArea\.replaceChildren\(resultList\);\s*mountResultCards\(resultList\);/);
  assert.match(ALGOLIA_SEARCH_SOURCE, /unmountResultCards\(resultArea\);\s*resultArea\.replaceChildren\(\);/);
});

test('搜索链接默认使用 surface 玻璃高亮且 hover 不再切换背景', () => {
  assert.match(SEARCH_STYLE_SOURCE, /li a[\s\S]*background: var\(--ui-adapter-bg-hover\)/);
  assert.match(SEARCH_STYLE_SOURCE, /li a[\s\S]*box-shadow: var\(--ui-adapter-shadow-hover\)/);
  assert.doesNotMatch(SEARCH_STYLE_SOURCE, /li a[\s\S]*&:hover[\s\S]*background:/);
});
