'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SEARCH_TEMPLATE_SOURCE = fs.readFileSync(
  path.join(__dirname, '../layout/_partial/sidebar/search.ejs'),
  'utf8'
);
const SEARCH_PLUGIN_SOURCE = fs.readFileSync(
  path.join(__dirname, '../layout/_plugins/index.ejs'),
  'utf8'
);

test('搜索控件使用搜索地标、原生标签关联和 search 输入框', () => {
  assert.match(SEARCH_TEMPLATE_SOURCE, /<div class="search-form" role="search">/);
  assert.match(SEARCH_TEMPLATE_SOURCE, /<label class="search-button" for="search-input" aria-hidden="true">/);
  assert.match(SEARCH_TEMPLATE_SOURCE, /<input type="search" class="search-input" id="search-input" aria-label="\$\{escapedPlaceholder\}"/);
  assert.match(SEARCH_TEMPLATE_SOURCE, /placeholder="\$\{escapedPlaceholder\}"/);
});

test('搜索控件不再输出伪链接、内联聚焦事件或可提交表单', () => {
  assert.doesNotMatch(SEARCH_TEMPLATE_SOURCE, /<a class="search-button"/);
  assert.doesNotMatch(SEARCH_TEMPLATE_SOURCE, /onclick=/);
  assert.doesNotMatch(SEARCH_TEMPLATE_SOURCE, /<form class="search-form"/);
});

test('page.search 为 false 时仍跳过搜索控件', () => {
  assert.match(SEARCH_TEMPLATE_SOURCE, /if \(page\.search == false\) \{\s+return el\s+\}/);
});

test('本地搜索与 Algolia 从公共入口加载同一份快捷键脚本', () => {
  const shortcutReferences = SEARCH_PLUGIN_SOURCE.match(/\/js\/search\/shortcut\.js/g) || [];
  assert.equal(shortcutReferences.length, 1);
  assert.match(SEARCH_PLUGIN_SOURCE, /if \(theme\.search\[theme\.search\.service\]\) \{[\s\S]*shortcut\.js[\s\S]*partial\(`search\/\$\{theme\.search\.service\}`/);
});
