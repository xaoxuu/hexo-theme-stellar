'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const MENU_TEMPLATE_SOURCE = fs.readFileSync(
  path.join(__dirname, '../layout/_partial/sidebar/menu.ejs'),
  'utf8'
);
const SEARCH_TRIGGER_TEMPLATE_SOURCE = fs.readFileSync(
  path.join(__dirname, '../layout/_partial/sidebar/search.ejs'),
  'utf8'
);
const BRAND_TEMPLATE_SOURCE = fs.readFileSync(
  path.join(__dirname, '../layout/_partial/sidebar/brand.ejs'),
  'utf8'
);
const LAYOUT_TEMPLATE_SOURCE = fs.readFileSync(
  path.join(__dirname, '../layout/layout.ejs'),
  'utf8'
);
const SEARCH_DIALOG_TEMPLATE_SOURCE = fs.readFileSync(
  path.join(__dirname, '../layout/_partial/search/dialog.ejs'),
  'utf8'
);
const SEARCH_PLUGIN_SOURCE = fs.readFileSync(
  path.join(__dirname, '../source/js/runtime/extensions/search.mjs'),
  'utf8'
);
const LOCAL_SEARCH_SOURCE = fs.readFileSync(
  path.join(__dirname, '../source/js/search/local-search.js'),
  'utf8'
);
const ALGOLIA_SEARCH_SOURCE = fs.readFileSync(
  path.join(__dirname, '../source/js/search/algolia-search.js'),
  'utf8'
);
const SETTINGS_SOURCE = fs.readFileSync(
  path.join(__dirname, '../source/js/runtime/extensions/settings.mjs'),
  'utf8'
);
const SEARCH_STYLE_SOURCE = fs.readFileSync(
  path.join(__dirname, '../source/css/_components/sidebar/search.styl'),
  'utf8'
);
const INPUT_STYLE_SOURCE = fs.readFileSync(
  path.join(__dirname, '../source/css/_common/input.styl'),
  'utf8'
);
const SEARCH_BUTTON_LABELS = Object.fromEntries(
  ['en', 'zh-CN', 'zh-TW'].map(language => [
    language,
    yaml.load(fs.readFileSync(path.join(__dirname, `../languages/${language}.yml`), 'utf8')).btn.search
  ])
);
const SEARCH_SCOPE_LABELS = Object.fromEntries(
  ['en', 'zh-CN', 'zh-TW'].map(language => {
    const search = yaml.load(fs.readFileSync(path.join(__dirname, `../languages/${language}.yml`), 'utf8')).search;
    return [language, [search.scope, search.scope_all, search.scope_blog]];
  })
);

test('Search Menu Item 输出共享浮层入口并隔离 Algolia 路径范围', () => {
  assert.match(MENU_TEMPLATE_SOURCE, /menuItem\?\.type === 'search'/);
  assert.match(MENU_TEMPLATE_SOURCE, /type: 'button'/);
  assert.match(MENU_TEMPLATE_SOURCE, /'data-shell-action': 'open-search'/);
  assert.match(MENU_TEMPLATE_SOURCE, /searchProvider === 'algolia'/);
  assert.match(MENU_TEMPLATE_SOURCE, /searchAttrs\['data-algolia-filter-path'\] = algoliaFilterPath/);
  assert.match(MENU_TEMPLATE_SOURCE, /'data-search-placeholder': searchPlaceholder/);
  assert.match(MENU_TEMPLATE_SOURCE, /render\.layout\.algoliaFilterPath/);
  assert.doesNotMatch(MENU_TEMPLATE_SOURCE, /data-search-filter|data-filter/);
});

test('唯一 Search Menu Item 复用固定运行时实例', () => {
  assert.match(MENU_TEMPLATE_SOURCE, /'data-search-instance': 'menu-search'/);
});

test('Collection Brand 搜索复用 Search Item 并保证共享浮层存在', () => {
  assert.match(BRAND_TEMPLATE_SOURCE, /activeBrandSource !== 'collection'/);
  assert.match(BRAND_TEMPLATE_SOURCE, /partial\('_partial\/sidebar\/search'/);
  assert.match(BRAND_TEMPLATE_SOURCE, /instanceId: 'collection-brand-search'/);
  assert.match(BRAND_TEMPLATE_SOURCE, /hoverSurface: true/);
  assert.match(SEARCH_TRIGGER_TEMPLATE_SOURCE, /'search-trigger has-hover-surface'/);
  assert.doesNotMatch(SEARCH_TRIGGER_TEMPLATE_SOURCE, /'search-trigger is-active'/);
  assert.match(SEARCH_TRIGGER_TEMPLATE_SOURCE, /var searchScope = search_scope\(page,/);
  assert.match(SEARCH_TRIGGER_TEMPLATE_SOURCE, /searchAttrs\['data-search-domain'\] = searchScope\.current/);
  assert.match(SEARCH_TRIGGER_TEMPLATE_SOURCE, /searchAttrs\['data-search-domain-label'\] = searchScope\.currentLabel/);
  assert.match(LAYOUT_TEMPLATE_SOURCE, /region\?\.brand === 'collection_brand'/);
});

test('Search Menu Item 与 Link Item 共用视觉字段和响应式规则', () => {
  assert.match(MENU_TEMPLATE_SOURCE, /icon: menuItem\.icon \|\| 'default:search'/);
  assert.match(MENU_TEMPLATE_SOURCE, /theme: menuItem\.accent/);
  assert.match(MENU_TEMPLATE_SOURCE, /className: menuItem\.accent\?\.length > 0 \? 'search-trigger is-themed' : 'search-trigger'/);
  assert.doesNotMatch(MENU_TEMPLATE_SOURCE, /iconOnly:/);
});

test('Search Menu Item 按钮文案固定使用配置 title，缺省为“搜索”', () => {
  assert.match(MENU_TEMPLATE_SOURCE, /var searchTitle = menuItem\.title == null \? __\('btn\.search'\) : __\(menuItem\.title\)/);
  assert.match(MENU_TEMPLATE_SOURCE, /title: searchTitle/);
  assert.match(MENU_TEMPLATE_SOURCE, /'aria-label': searchTitle/);
  assert.doesNotMatch(MENU_TEMPLATE_SOURCE, /title: searchPlaceholder/);
  assert.doesNotMatch(MENU_TEMPLATE_SOURCE, /'aria-label': searchPlaceholder/);
  assert.deepEqual(SEARCH_BUTTON_LABELS, {
    en: 'Search',
    'zh-CN': '搜索',
    'zh-TW': '搜尋'
  });
});

test('所有内置搜索入口使用同一 Solar 图标且没有状态着色', () => {
  for (const source of [MENU_TEMPLATE_SOURCE, SEARCH_TRIGGER_TEMPLATE_SOURCE, SEARCH_DIALOG_TEMPLATE_SOURCE]) {
    assert.match(source, /default:search/);
    assert.doesNotMatch(source, /solar:minimalistic-magnifer-line-duotone/);
  }
  assert.doesNotMatch(SEARCH_STYLE_SOURCE, /p-id=["']1562["']/);
  assert.doesNotMatch(SEARCH_STYLE_SOURCE, /\[searching='true'\][\s\S]*?\.search-button/);
  assert.doesNotMatch(SEARCH_STYLE_SOURCE, /\.noresult\[searching='true'\][\s\S]*?\.search-button/);
});

test('Search Menu Item 不输出内联事件或独立表单', () => {
  assert.doesNotMatch(MENU_TEMPLATE_SOURCE, /onclick=/);
  assert.doesNotMatch(MENU_TEMPLATE_SOURCE, /<form class="search-form"/);
});

test('搜索扩展关闭时安全跳过 Search Menu Item', () => {
  assert.match(MENU_TEMPLATE_SOURCE, /if \(!stellar_config\('search\.provider'\)\) continue/);
});

test('本地搜索与 Algolia 从公共入口加载同一份快捷键脚本', () => {
  assert.match(SEARCH_PLUGIN_SOURCE, /config\.provider === 'algolia'[\s\S]*assets\.script\(config\.assets\.provider\)/);
  assert.match(SEARCH_PLUGIN_SOURCE, /config\.provider === 'local'[\s\S]*assets\.script\(config\.assets\.provider\)/);
  assert.match(SEARCH_PLUGIN_SOURCE, /await assets\.script\(config\.assets\.shortcut\)/);
  assert.doesNotMatch(SEARCH_PLUGIN_SOURCE, /['"]\/js\/search\//);
});

test('搜索浮层保持固定高度且搜索图标与输入框不换行', () => {
  assert.match(SEARCH_STYLE_SOURCE, /height: unquote\('min\(80dvh, 720px\)'\)/);
  assert.match(SEARCH_STYLE_SOURCE, /\.search-dialog__panel[\s\S]*?height: 100%/);
  assert.match(SEARCH_STYLE_SOURCE, /\.search-dialog__header[\s\S]*?flex-wrap: nowrap/);
  assert.match(SEARCH_STYLE_SOURCE, /\.search-form[\s\S]*?height: 40px[\s\S]*?flex-flow: row nowrap/);
  assert.match(SEARCH_STYLE_SOURCE, /\.search-input[\s\S]*?flex: 1 1 auto[\s\S]*?min-width: 0[\s\S]*?width: auto[\s\S]*?height: 100%[\s\S]*?padding: 0/);
});

test('仅 Local Search 渲染真实单选搜索域并支持动态 Collection 名称', () => {
  assert.match(SEARCH_DIALOG_TEMPLATE_SOURCE, /var localSearch = stellar_config\('search\.provider'\) === 'local'/);
  assert.match(SEARCH_DIALOG_TEMPLATE_SOURCE, /if \(localSearch\)[\s\S]*role="radiogroup"/);
  assert.match(SEARCH_DIALOG_TEMPLATE_SOURCE, /type="radio" name="site-search-scope" value="all"/);
  assert.match(SEARCH_DIALOG_TEMPLATE_SOURCE, /type="radio" name="site-search-scope" value="blog"/);
  assert.match(SEARCH_DIALOG_TEMPLATE_SOURCE, /type="radio" name="site-search-scope" value="current"/);
  assert.match(SEARCH_DIALOG_TEMPLATE_SOURCE, /data-search-scope-current-label/);
  assert.doesNotMatch(SEARCH_DIALOG_TEMPLATE_SOURCE, /search-dialog__scope-separator|aria-hidden="true">\//);
  assert.match(MENU_TEMPLATE_SOURCE, /'data-search-domain':?\s*searchScope\.current|searchAttrs\['data-search-domain'\] = searchScope\.current/);
  assert.match(MENU_TEMPLATE_SOURCE, /searchAttrs\['data-search-domain-label'\] = searchScope\.currentLabel/);
  assert.deepEqual(SEARCH_SCOPE_LABELS, {
    en: ['Search scope', 'All', 'Blog'],
    'zh-CN': ['搜索域', '全站', '博客'],
    'zh-TW': ['搜尋範圍', '全站', '部落格']
  });
});

test('搜索域单行显示通用主题色 radio，长 Collection 名称省略且结果区弹性占满', () => {
  assert.match(SEARCH_STYLE_SOURCE, /\.search-dialog__scope[\s\S]*?display: flex[\s\S]*?min-width: 0[\s\S]*?overflow: hidden/);
  assert.match(SEARCH_DIALOG_TEMPLATE_SOURCE, /<input class="ui-radio" type="radio"/);
  assert.match(INPUT_STYLE_SOURCE, /input\.ui-radio[\s\S]*?border: 2px solid var\(--text-p3\)[\s\S]*?border-color: var\(--theme\)/);
  assert.doesNotMatch(SEARCH_STYLE_SOURCE, /input\[type=['"]radio['"]\]/);
  assert.match(SEARCH_STYLE_SOURCE, /data-search-scope-option='current'[\s\S]*?text-overflow: ellipsis/);
  assert.match(SEARCH_STYLE_SOURCE, /\.search-dialog \.search-result[\s\S]*?flex: 1 1 auto[\s\S]*?min-height: 0[\s\S]*?max-height: none/);
});

test('Local Provider 按 domains 过滤并使用排除旧索引的新缓存版本', () => {
  assert.match(LOCAL_SEARCH_SOURCE, /var activeDomain = this\.getAttribute\('data-domain'\) \|\| ''/);
  assert.match(LOCAL_SEARCH_SOURCE, /activeDomain && !data\.domains\?\.includes\(activeDomain\)/);
  assert.match(LOCAL_SEARCH_SOURCE, /search_cache_v5/);
  assert.match(SETTINGS_SOURCE, /SEARCH_CACHE_KEY = 'search_cache_v5'/);
  assert.doesNotMatch(LOCAL_SEARCH_SOURCE, /search_cache_v4/);
  assert.doesNotMatch(LOCAL_SEARCH_SOURCE, /data-filter|data-search-filter|data-algolia-filter-path/);
  assert.doesNotMatch(LOCAL_SEARCH_SOURCE, /resolveSearchFilter|activeFilter|\.path\.includes\(/);
});

test('Algolia Provider 仅消费专用路径字段', () => {
  assert.match(ALGOLIA_SEARCH_SOURCE, /getAttribute\('data-algolia-filter-path'\)/);
  assert.match(ALGOLIA_SEARCH_SOURCE, /filterResults\(responses\.hits, filterPath\)/);
  assert.doesNotMatch(ALGOLIA_SEARCH_SOURCE, /getAttribute\('data-filter'\)|data-search-filter/);
});
