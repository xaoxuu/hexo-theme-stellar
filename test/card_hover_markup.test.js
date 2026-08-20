'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const applyThemeUtils = require('../scripts/events/lib/utils.js');

const HOVER_CLASSES = 'card-hover card-hover--spotlight card-hover--tilt';
const SPOTLIGHT_ONLY_CLASSES = 'card-hover card-hover--spotlight';
const COLLECTION_ITEM_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/components/collection-item.ejs'), 'utf8');
const LAYOUT_DROPDOWN_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/dropdown.ejs'), 'utf8');
const PIN_SLIDER_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/main/pin_slider.ejs'), 'utf8');
const LATEST_POST_CARD_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/main/post_list/latest_post_card.ejs'), 'utf8');
const WIKI_COVER_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/cover/wiki_cover.ejs'), 'utf8');

function createContext() {
  const fakeHexo = {
    theme: {
      config: {
        default: { link: '/images/default-link.svg' },
        data_services: { siteinfo: {} },
        icons: {}
      }
    },
    config: { root: '/', url: 'https://example.com' },
    render: {
      renderSync({ text }) {
        return `<p>${text.trim()}</p>`;
      }
    }
  };
  applyThemeUtils(fakeHexo);
  return fakeHexo;
}

test('link 标签始终为链接卡片输出 Hover 组合类', () => {
  const ctx = createContext();
  const renderLink = require('../scripts/tags/lib/link.js')(ctx);
  const html = renderLink(['https://example.com/docs', '文档']);

  assert.match(html, new RegExp(`class="link-card plain ${HOVER_CLASSES}"`));
});

test('grid 仅在 bg:card 时为每个 cell 输出 Hover 组合类', () => {
  const ctx = createContext();
  const renderGrid = require('../scripts/tags/lib/grid.js')(ctx);
  const content = '第一项\n<!-- cell -->\n第二项';
  const cardHtml = renderGrid(['bg:card'], content);
  const boxHtml = renderGrid(['bg:box'], content);
  const plainHtml = renderGrid([], content);

  assert.equal(cardHtml.match(new RegExp(`class="cell ${HOVER_CLASSES}"`, 'g')).length, 2);
  assert.doesNotMatch(boxHtml, /class="cell card-hover/);
  assert.doesNotMatch(plainHtml, /class="cell card-hover/);
});

test('公共 collection 条目和布局 dropdown 只输出 Spotlight 组合类', () => {
  assert.match(COLLECTION_ITEM_SOURCE, new RegExp(`ui-collection__item ${SPOTLIGHT_ONLY_CLASSES}`));
  assert.match(LAYOUT_DROPDOWN_SOURCE, new RegExp(`ui-collection__item ${SPOTLIGHT_ONLY_CLASSES}`));
  assert.doesNotMatch(COLLECTION_ITEM_SOURCE, /ui-collection__item[^'\n]*card-hover--tilt/);
  assert.doesNotMatch(LAYOUT_DROPDOWN_SOURCE, /ui-collection__item[^"\n]*card-hover--tilt/);
});

test('dropdown 标签条目只输出 Spotlight 组合类', () => {
  const ctx = createContext();
  const renderDropdown = require('../scripts/tags/lib/dropdown.js')(ctx);
  const html = renderDropdown(['更多'], '- [文档](/wiki/)');

  assert.match(html, new RegExp(`class="dropdown-item ui-collection__item ${SPOTLIGHT_ONLY_CLASSES}"`));
  assert.doesNotMatch(html, /ui-collection__item[^"\n]*card-hover--tilt/);
});

test('置顶轮播容器和专栏最新文章卡片输出完整 Hover 组合类', () => {
  assert.match(PIN_SLIDER_SOURCE, new RegExp(`class="pin-slider ${HOVER_CLASSES}"`));
  assert.match(LATEST_POST_CARD_SOURCE, new RegExp(`class="cover ${HOVER_CLASSES}"`));
});

test('Wiki Hero 操作按钮只输出 Spotlight 组合类', () => {
  const actionButtons = WIKI_COVER_SOURCE.match(/class="button(?: wiki-cover-source)? card-hover card-hover--spotlight"/g);

  assert.equal(actionButtons.length, 3);
  assert.doesNotMatch(WIKI_COVER_SOURCE, /card-hover--tilt/);
});
