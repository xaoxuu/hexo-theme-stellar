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
const APPEARANCE_MIXINS_SOURCE = fs.readFileSync(
  path.join(__dirname, '../source/css/_appearances/_mixins.styl'),
  'utf8'
);
test('本地搜索只为标题下方的可点击链接输出 Spotlight 组合类', () => {
  assert.match(LOCAL_SEARCH_SOURCE, /li\.appendChild\(titleSpan\);[\s\S]*const a = ownerDocument\.createElement\('a'\);/);
  assert.match(LOCAL_SEARCH_SOURCE, /a\.className = ctx\.ui\.classes\.interactiveSpotlight/);
  assert.match(LOCAL_SEARCH_SOURCE, /li\.appendChild\(a\);/);
  assert.doesNotMatch(LOCAL_SEARCH_SOURCE, /titleSpan\.className = ['"]search-result-title card-hover/);
  assert.doesNotMatch(LOCAL_SEARCH_SOURCE, /a\.className = ['"][^'"]*card-hover--tilt/);
});

test('Algolia 将标题移出链接并只为可点击区域输出 Spotlight 组合类', () => {
  assert.match(ALGOLIA_SEARCH_SOURCE, /item\.appendChild\(titleSpan\);\s*item\.appendChild\(link\);/);
  assert.match(ALGOLIA_SEARCH_SOURCE, /link\.className = ctx\.ui\.classes\.interactiveSpotlight/);
  assert.doesNotMatch(ALGOLIA_SEARCH_SOURCE, /titleSpan\.className = ['"]search-result-title card-hover/);
  assert.doesNotMatch(ALGOLIA_SEARCH_SOURCE, /link\.className = ['"][^'"]*card-hover--tilt/);
});

test('两种搜索服务在替换前卸载旧结果并在插入后挂载新结果', () => {
  assert.match(LOCAL_SEARCH_SOURCE, /unmountResultCards\(\$resultContent\);\s*\$resultContent\.innerHTML = "";/);
  assert.match(LOCAL_SEARCH_SOURCE, /\$resultContent\.appendChild\(ul\);\s*mountResultCards\(ul\);/);
  assert.match(ALGOLIA_SEARCH_SOURCE, /unmountResultCards\(resultArea\);\s*resultArea\.replaceChildren\(resultList\);\s*mountResultCards\(resultList\);/);
  assert.match(ALGOLIA_SEARCH_SOURCE, /unmountResultCards\(resultArea\);\s*resultArea\.replaceChildren\(\);/);
});

test('搜索链接消费统一交互能力，结构层只保留默认表面', () => {
  const searchLinkRule = SEARCH_STYLE_SOURCE.match(/ {4}li a\n[\s\S]*? {4}li\+li/);
  assert.ok(searchLinkRule);
  assert.match(searchLinkRule[0], /background: var\(--block\)/);
  assert.match(searchLinkRule[0], /box-shadow: none/);
  assert.doesNotMatch(SEARCH_STYLE_SOURCE, /--ui-adapter/);
  assert.match(APPEARANCE_MIXINS_SOURCE, /appearance-standard-interactions\(\)[\s\S]*\.ui-interactive:hover[\s\S]*background: var\(--block\)/);
  assert.match(APPEARANCE_MIXINS_SOURCE, /appearance-glass-interactions-light\(\)[\s\S]*\.ui-interactive:hover[\s\S]*linear-gradient/);
  assert.doesNotMatch(APPEARANCE_MIXINS_SOURCE, /\.search-result li a/);
});
