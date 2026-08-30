'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const applyThemeUtils = require('../scripts/events/lib/utils.js');

const HOVER_CLASSES = 'card-hover card-hover--spotlight card-hover--tilt';
const SPOTLIGHT_ONLY_CLASSES = 'card-hover card-hover--spotlight';
const INTERACTIVE_SPOTLIGHT_CLASSES = 'ui-interactive card-hover card-hover--spotlight';
const COLLECTION_ITEM_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/components/collection-item.ejs'), 'utf8');
const LAYOUT_DROPDOWN_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/dropdown.ejs'), 'utf8');
const FOOTER_ACTIONS_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/widgets/actions.ejs'), 'utf8');
const SETTINGS_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/widgets/settings.ejs'), 'utf8');
const REGION_WIDGETS_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/regions/widgets.ejs'), 'utf8');
const RECENT_WIDGET_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/widgets/recent.ejs'), 'utf8');
const TOC_WIDGET_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/widgets/toc.ejs'), 'utf8');
const WIDGET_STYLES_SOURCE = fs.readFileSync(path.join(__dirname, '../source/css/_components/widgets/widgets.styl'), 'utf8');
const TOC_STYLES_SOURCE = fs.readFileSync(path.join(__dirname, '../source/css/_components/widgets/toc.styl'), 'utf8');
const APPEARANCE_MIXINS_SOURCE = fs.readFileSync(path.join(__dirname, '../source/css/_appearances/_mixins.styl'), 'utf8');
const ICON_STYLE_SOURCE = fs.readFileSync(path.join(__dirname, '../source/css/_common/icon.styl'), 'utf8');
const PIN_SLIDER_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/main/pin_slider.ejs'), 'utf8');
const LATEST_POST_CARD_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/main/post_list/latest_post_card.ejs'), 'utf8');
const WIKI_COVER_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/cover/wiki_cover.ejs'), 'utf8');

function createContext() {
  const fakeHexo = {
    stellar: {
      config: {
        fallbacks: { linkCard: '/images/default-link.svg' },
        services: { siteInfo: { provider: null } }
      }
    },
    theme: {
      config: {
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
  assert.match(COLLECTION_ITEM_SOURCE, /ui_classes\('', 'collectionItem'/);
  assert.match(LAYOUT_DROPDOWN_SOURCE, /ui_classes\('dropdown-item', 'collectionItem'\)/);
  assert.doesNotMatch(COLLECTION_ITEM_SOURCE, /ui_classes\([^\n]*'hoverCard'/);
  assert.doesNotMatch(LAYOUT_DROPDOWN_SOURCE, /ui_classes\([^\n]*'hoverCard'/);
});

test('侧边栏 Footer 交互项统一输出 collection 与 Spotlight 组合类', () => {
  assert.match(FOOTER_ACTIONS_SOURCE, /ui_classes\('social', 'collectionItem', 'is-icon-only'\)/);
  assert.match(SETTINGS_SOURCE, /ui_classes\('settings-widget', 'collectionItem'\)/);
  assert.match(REGION_WIDGETS_SOURCE, /ui_classes\('leftbar-state-toggle', 'collectionItem', 'is-icon-only'\)/);
  assert.doesNotMatch(FOOTER_ACTIONS_SOURCE, /social-spacer[^>]*ui-collection__item/);
});

test('Widget Header Cap Action 独立组合 Spotlight 与 Appearance 交互状态', () => {
  assert.match(RECENT_WIDGET_SOURCE, /ui_classes\('cap-action'\)/);
  assert.match(TOC_WIDGET_SOURCE, /ui_classes\('cap-action'\)/);
  assert.doesNotMatch(RECENT_WIDGET_SOURCE, /cap-action[^"\n]*ui-collection__item/);
  assert.doesNotMatch(TOC_WIDGET_SOURCE, /cap-action[^"\n]*ui-collection__item/);
  assert.doesNotMatch(WIDGET_STYLES_SOURCE, /--ui-action|\.cap-action[\s\S]{0,240}background:/);
  assert.doesNotMatch(TOC_STYLES_SOURCE, /--ui-action|\.widget-wrapper\.toc\.collapse[\s\S]*\.cap-action[\s\S]{0,120}background:/);
  assert.match(APPEARANCE_MIXINS_SOURCE, /appearance-standard-interactions\(\)[\s\S]*\.ui-interactive[\s\S]*background: transparent[\s\S]*background: var\(--block\)/);
  assert.match(APPEARANCE_MIXINS_SOURCE, /appearance-glass-interactions-light\(\)[\s\S]*\.ui-interactive:hover[\s\S]*linear-gradient/);
  assert.doesNotMatch(APPEARANCE_MIXINS_SOURCE, /\.widget-header \.cap-action/);
  assert.doesNotMatch(TOC_STYLES_SOURCE, /cap-action[\s\S]{0,160}sidebar-light/);
});

test('常驻 Hover 表面不复用 Active 图标状态', () => {
  assert.match(APPEARANCE_MIXINS_SOURCE, /\.ui-interactive\.has-hover-surface,[\s\S]*background: var\(--block\)/);
  assert.match(APPEARANCE_MIXINS_SOURCE, /appearance-glass-interactions-light\(\)[\s\S]*\.ui-interactive\.has-hover-surface,[\s\S]*linear-gradient/);
  assert.doesNotMatch(ICON_STYLE_SOURCE, /has-hover-surface/);
});

test('dropdown 标签条目只输出 Spotlight 组合类', () => {
  const ctx = createContext();
  const renderDropdown = require('../scripts/tags/lib/dropdown.js')(ctx);
  const html = renderDropdown(['更多'], '- [文档](/wiki/)');

  assert.match(html, new RegExp(`class="dropdown-item ui-collection__item ${INTERACTIVE_SPOTLIGHT_CLASSES}"`));
  assert.doesNotMatch(html, /ui-collection__item[^"\n]*card-hover--tilt/);
});

test('置顶轮播容器和专栏最新文章卡片复用 Hover 能力', () => {
  assert.match(PIN_SLIDER_SOURCE, /ui_classes\('pin-slider', 'hoverCard'\)/);
  assert.match(LATEST_POST_CARD_SOURCE, /ui_classes\('[^']*', 'hoverCard'\)/);
});

test('Wiki Hero 操作按钮只输出 Spotlight 组合类', () => {
  const actionButtons = WIKI_COVER_SOURCE.match(/ui_classes\('button(?: wiki-cover-source)?', 'spotlight'\)/g);

  assert.equal(actionButtons.length, 3);
  assert.doesNotMatch(WIKI_COVER_SOURCE, /card-hover--tilt/);
});
