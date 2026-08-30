'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { composeUiClasses } = require('../scripts/lib/ui-capabilities');

let renderer;
global.hexo = {
  extend: {
    renderer: {
      register(extension, output, registered) {
        assert.equal(extension, 'ejs');
        assert.equal(output, 'html');
        renderer = registered;
      }
    }
  }
};
require('hexo-renderer-ejs');
delete global.hexo;

const BRAND_TEMPLATE = fs.readFileSync(
  path.join(__dirname, '../layout/_partial/sidebar/brand.ejs'),
  'utf8'
);
const BRAND_STYLE = fs.readFileSync(
  path.join(__dirname, '../source/css/_components/sidebar/brand.styl'),
  'utf8'
);
const LAYOUT_TEMPLATE = fs.readFileSync(
  path.join(__dirname, '../layout/layout.ejs'),
  'utf8'
);
const LAYOUT_STYLE = fs.readFileSync(
  path.join(__dirname, '../source/css/_components/layout.styl'),
  'utf8'
);

const BRAND_PATH = path.join(__dirname, '../layout/_partial/sidebar/brand.ejs');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderBrand({ brandModel, brandSource = 'site', placement = 'leftbar', username = 'xaoxuu', viewModel = null, searchProvider = 'local' }) {
  return renderer({ path: BRAND_PATH, text: BRAND_TEMPLATE }, {
    brandModel,
    brandSource,
    placement,
    viewModel,
    brandText: value => value == null ? '' : String(value),
    brandGithubUsername: () => username,
    stellar_config: key => {
      if (key === 'extensions.services.github.apiUrl') return 'https://api.github.com';
      if (key === 'extensions.search.provider') return searchProvider;
      return 'never';
    },
    escape_html: escapeHtml,
    url_for: value => value,
    pretty_url: value => value,
    ui_classes: composeUiClasses,
    icon: () => '<svg></svg>',
    __: key => key === 'btn.all_wiki' ? 'All Products' : key,
    partial: (name, data) => name === '_partial/sidebar/search'
      ? `<div class="ui-collection" data-instance="${data.instanceId}"><button class="ui-collection__item search-trigger${data.hoverSurface ? ' has-hover-surface' : ''}" type="button">Search</button></div>`
      : ''
  }).trim();
}

test('Brand 模板只输出统一 wrapper 和三种语义样式 class', () => {
  assert.match(BRAND_TEMPLATE, /class="brand-image brand-image--\$\{variant\}"/);
  assert.match(BRAND_TEMPLATE, /class="brand-wrap"/);
  assert.match(BRAND_TEMPLATE, /class="brand-header/);
  assert.doesNotMatch(BRAND_TEMPLATE, /logo-wrap|class="icon"|class="avatar"/);
});

test('Brand 图片背景不再开放配置，标题始终使用 name', () => {
  assert.doesNotMatch(BRAND_TEMPLATE, /image\.background|brand-image-background/);
  assert.doesNotMatch(BRAND_STYLE, /brand-image-background/);
  assert.doesNotMatch(BRAND_TEMPLATE, /wordmark|brand-wordmark/);
  assert.doesNotMatch(BRAND_STYLE, /brand-wordmark/);
  assert.match(BRAND_TEMPLATE, /class="brand-name"/);
});

test('Brand 图片和标题统一使用模型派生的来源首页 href', () => {
  const html = renderBrand({
    brandSource: 'collection',
    brandModel: {
      image: { src: '/stellar.svg', variant: 'icon' },
      name: 'Stellar',
      href: '/wiki/stellar/'
    }
  });
  assert.match(html, /<a class="brand-image brand-image--icon" href="\/wiki\/stellar\/">/);
  assert.match(html, /<a class="brand-title" href="\/wiki\/stellar\/">/);
  assert.doesNotMatch(BRAND_TEMPLATE, /image\.href/);
});

test('Leftbar Site Brand 纵向显示 96px 头像和预留空间的 GitHub 数据区', () => {
  const html = renderBrand({
    brandModel: {
      image: { src: '/avatar.webp', variant: 'avatar' },
      name: 'XAOXUU',
      tagline: 'Stellar creator',
      href: '/'
    }
  });
  assert.match(html, /brand-header--site/);
  assert.match(html, /brand-tagline[^>]*>Stellar creator</);
  assert.match(html, /class="brand-stats data-service ds-ghinfo" data-api="https:\/\/api\.github\.com\/users\/xaoxuu"/);
  for (const id of ['followers', 'following', 'public_repos']) {
    assert.match(html, new RegExp(`class="brand-stat__value" type="text" id="${id}"><\\/span>`));
  }
  assert.match(BRAND_STYLE, /\.brand-header--site[\s\S]*width: 96px[\s\S]*height: 96px/);
  assert.match(BRAND_STYLE, /\.brand-stat__value[\s\S]*min-height: 1\.2em[\s\S]*line-height: 1\.2/);
});

test('Brand 数据按钮复用组件无关的通用交互效果', () => {
  const html = renderBrand({
    brandModel: {
      image: { src: '/avatar.webp', variant: 'avatar' },
      name: 'XAOXUU'
    }
  });
  const items = html.match(/<a class="brand-stat[^"]*"/g) || [];
  assert.equal(items.length, 3);
  for (const item of items) {
    assert.match(item, /class="brand-stat ui-interactive card-hover card-hover--spotlight"/);
  }
  const styleStart = BRAND_STYLE.indexOf('  .brand-stat\n');
  const styleEnd = BRAND_STYLE.indexOf('  .brand-stat__value', styleStart);
  assert.doesNotMatch(BRAND_STYLE.slice(styleStart, styleEnd), /&:hover|background:/);
});

test('未配置 ghuser 时 Site Brand 省略整个数据区', () => {
  const html = renderBrand({ brandModel: { name: 'XAOXUU' }, username: '' });
  assert.match(html, /brand-header--site/);
  assert.doesNotMatch(html, /brand-stats|ds-ghinfo/);
});

test('Leftbar Collection Brand 保持横向 icon、标题和副标题，不输出数据区', () => {
  const html = renderBrand({
    brandSource: 'collection',
    brandModel: {
      image: { src: '/stellar.svg', variant: 'icon' },
      name: 'Stellar',
      tagline: '每个人的独立博客',
      href: '/wiki/stellar/'
    }
  });
  assert.match(html, /brand-header--collection/);
  assert.match(html, /brand-image--icon/);
  assert.match(html, /brand-tagline[^>]*>每个人的独立博客</);
  assert.doesNotMatch(html, /brand-stats|ds-ghinfo/);
});

test('Leftbar Collection Brand 底部复用菜单同款 Search Item', () => {
  const html = renderBrand({
    brandSource: 'collection',
    brandModel: {
      image: { src: '/stellar.svg', variant: 'icon' },
      name: 'Stellar'
    }
  });
  assert.match(html, /<div class="brand-wrap">[\s\S]*<\/div><div class="brand-search">/);
  assert.match(html, /class="ui-collection__item search-trigger has-hover-surface"/);
  assert.doesNotMatch(html, /\bis-active\b|aria-current/);
  assert.match(html, /data-instance="collection-brand-search"/);
  assert.match(BRAND_TEMPLATE, /partial\('_partial\/sidebar\/search'/);
  assert.match(BRAND_TEMPLATE, /hoverSurface: true/);
  assert.match(BRAND_STYLE, /\.brand-header--collection \.brand-search[\s\S]*margin-top: \.5rem/);
  assert.match(LAYOUT_STYLE, /\.widget-instance--brand[\s\S]*\.brand-search \.search-trigger[\s\S]*width: 40px[\s\S]*height: 40px[\s\S]*padding: 8px/);

  const siteBrand = renderBrand({brandModel: {name: 'XAOXUU'}});
  const topbarCollectionBrand = renderBrand({
    brandSource: 'collection',
    placement: 'topbar',
    brandModel: {name: 'Stellar'}
  });
  const searchDisabledBrand = renderBrand({
    brandSource: 'collection',
    brandModel: {name: 'Stellar'},
    searchProvider: null
  });
  assert.doesNotMatch(siteBrand, /brand-search/);
  assert.doesNotMatch(topbarCollectionBrand, /brand-search/);
  assert.doesNotMatch(searchDisabledBrand, /brand-search/);
});

test('Wiki 返回入口只位于 Leftbar Collection Brand 内部最上方', () => {
  const html = renderBrand({
    brandSource: 'collection',
    brandModel: {
      image: { src: '/stellar.svg', variant: 'icon' },
      name: 'Stellar',
      href: '/wiki/stellar/'
    },
    viewModel: {
      collection: { profile: 'wiki' },
      render: { layout: { wikiIndexPath: '/wiki/' } }
    }
  });

  assert.match(html, /<header class="brand-header[^>]*>[\s\S]*<div class="brand-navigation">/);
  assert.match(html, /<a class="brand-navigation__back cap" href="\/wiki\/">/);
  assert.ok(html.indexOf('class="brand-navigation"') < html.indexOf('class="brand-wrap"'));
  assert.doesNotMatch(html, /wiki-home-wrap|class="wiki-home"/);

  const siteBrand = renderBrand({
    brandSource: 'site',
    brandModel: { name: 'XAOXUU' },
    viewModel: {
      collection: { profile: 'wiki' },
      render: { layout: { wikiIndexPath: '/wiki/' } }
    }
  });
  assert.doesNotMatch(siteBrand, /brand-navigation/);

  const topbar = renderBrand({
    placement: 'topbar',
    brandModel: { name: 'XAOXUU' },
    viewModel: {
      collection: { profile: 'wiki' },
      render: { layout: { wikiIndexPath: '/wiki/' } }
    }
  });
  assert.doesNotMatch(topbar, /brand-navigation/);
});

test('Topbar Brand 只输出 32px 图片和 name，窄屏下不收缩', () => {
  const html = renderBrand({
    placement: 'topbar',
    brandModel: {
      image: { src: '/avatar.webp', variant: 'avatar' },
      name: 'XAOXUU',
      tagline: 'Hidden'
    }
  });
  assert.match(html, /brand-header--topbar/);
  assert.match(html, /brand-name">XAOXUU</);
  assert.doesNotMatch(html, /brand-tagline|brand-stats|ds-ghinfo/);
  assert.match(BRAND_STYLE, /\.brand-header--topbar[\s\S]*width: 32px[\s\S]*height: 32px/);
  assert.match(BRAND_STYLE, /\.brand-header--topbar[\s\S]*\.brand-title[\s\S]*flex: 0 0 auto[\s\S]*white-space: nowrap/);
  assert.match(LAYOUT_STYLE, /\.site-region--topbar[\s\S]*\.widget-instance--brand\s*\n\s+flex: 0 0 auto/);
  assert.match(LAYOUT_STYLE, /\.site-region--topbar[\s\S]*\.widget-instance--brand[\s\S]*\.brand-image[\s\S]*width: 32px[\s\S]*height: 32px/);
});

test('Rail 只保留图片，Drawer 直接复用 Site 与 Collection 完整尺寸', () => {
  assert.match(LAYOUT_STYLE, /leftbar-rail\(\)[\s\S]*\.brand-title[\s\S]*display: none[\s\S]*\.brand-stats[\s\S]*display: none/);
  assert.match(LAYOUT_STYLE, /\.site-shell:not\(\[data-drawer='leftbar'\]\) \.site-region--leftbar\s*\n\s+leftbar-rail\(\)/);
  assert.doesNotMatch(LAYOUT_STYLE, /leftbar-expanded\(\)/);
  assert.match(BRAND_STYLE, /\.brand-title[\s\S]*display: block/);
  assert.match(BRAND_STYLE, /\.brand-header--site[\s\S]*\.brand-image[\s\S]*width: 96px[\s\S]*\.brand-stats[\s\S]*display: grid/);
  assert.match(BRAND_STYLE, /\.brand-wrap[\s\S]*\.brand-image[\s\S]*width: 48px[\s\S]*height: 48px/);
  assert.match(LAYOUT_STYLE, /\.site-shell\[data-regions~='topbar'\] \.site-region--leftbar[\s\S]*top: calc\(var\(--shell-topbar-height\) \+ 8px\)/);
});

test('avatar、icon、plain 分别遵守裁剪和填充契约', () => {
  assert.match(BRAND_STYLE, /\.brand-image--avatar[\s\S]*border-radius: 50%[\s\S]*object-fit: cover/);
  assert.match(BRAND_STYLE, /\.brand-image--icon[\s\S]*border-radius: \$border-card-s[\s\S]*object-fit: contain/);
  assert.match(BRAND_STYLE, /\.brand-image--plain[\s\S]*background: transparent[\s\S]*object-fit: contain/);
  const plainStart = BRAND_STYLE.indexOf('.brand-image--plain');
  const plainEnd = BRAND_STYLE.indexOf('\n\n  .brand-title', plainStart);
  assert.doesNotMatch(BRAND_STYLE.slice(plainStart, plainEnd), /overflow: hidden/);
});

test('avatar 图片填满容器且不包含光环或动画', () => {
  const start = BRAND_STYLE.indexOf('.brand-image--avatar');
  const end = BRAND_STYLE.indexOf('\n  .brand-image--icon', start);
  const avatarStyle = BRAND_STYLE.slice(start, end);
  assert.match(avatarStyle, /img[\s\S]*object-fit: cover/);
  assert.doesNotMatch(BRAND_TEMPLATE, /brand-image-bg|appearance\.motion/);
  assert.doesNotMatch(BRAND_STYLE, /brand-image-bg|avatar_ring|@keyframes|animation:/);
  assert.doesNotMatch(LAYOUT_STYLE, /\.brand-image img[\s\S]*width: 2rem[\s\S]*height: 2rem/);
});

test('tagline 只输出单一静态节点', () => {
  assert.match(BRAND_TEMPLATE, /brandText\(brand\.tagline\)/);
  assert.doesNotMatch(BRAND_TEMPLATE, /taglineHover|brand\.tagline\?\.|class="brand-tagline hover|class="brand-tagline normal/);
  assert.doesNotMatch(BRAND_STYLE, /\.brand-tagline[\s\S]*&\[href\]:hover/);
});

test('手机端 Brand 只通过页面类型 helper 决定，不读取页面开关', () => {
  assert.match(LAYOUT_TEMPLATE, /showMobileBrand\(page/);
  assert.match(LAYOUT_TEMPLATE, /if \(mobileBrandVisible && !legacyRegions\.topbar && !legacyRegions\.leftbar\)/);
  assert.doesNotMatch(LAYOUT_TEMPLATE, /mobile_header/);
});
