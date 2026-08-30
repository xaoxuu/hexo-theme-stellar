'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let renderer;
global.hexo = {
  extend: { renderer: { register(_extension, _output, registered) { renderer = registered; } } }
};
require('hexo-renderer-ejs');
delete global.hexo;

const WIKI_COVER_PATH = path.join(__dirname, '../layout/_partial/cover/wiki_cover.ejs');
const WIKI_COVER_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/cover/wiki_cover.ejs'), 'utf8');
const MAIN_SOURCE = fs.readFileSync(path.join(__dirname, '../source/js/main.js'), 'utf8');

function renderWikiCover(actions) {
  return renderer({ path: WIKI_COVER_PATH, text: WIKI_COVER_SOURCE }, {
    viewModel: {
      collection: { profile: 'wiki' },
      render: {
        cover: {
          enabled: true,
          background: {},
          preview: {},
          actions,
          title: 'Stellar',
          description: '',
          repository: '',
          projectName: 'Stellar',
          siteName: 'Example'
        }
      }
    },
    escape_html: value => String(value),
    pretty_url: value => value,
    ui_classes: value => value,
    icon: value => `<svg data-icon="${value}"></svg>`,
    __: key => key
  });
}

test('Wiki Hero 分别从 hero.background.image 和 effect 判断图片与 Galaxy', () => {
  assert.match(WIKI_COVER_SOURCE, /var isImageBackground = background\.length > 0;/);
  assert.match(WIKI_COVER_SOURCE, /var isGalaxy = effect\.type === 'galaxy';/);
  assert.doesNotMatch(WIKI_COVER_SOURCE, /background === ['"]galaxy['"]/);
});

test('Wiki Hero 可同时输出背景图片和带参数的 Galaxy Canvas', () => {
  const imageBranch = WIKI_COVER_SOURCE.indexOf('if (isImageBackground)');
  const galaxyBranch = WIKI_COVER_SOURCE.indexOf('if (isGalaxy)', imageBranch);

  assert.ok(imageBranch >= 0);
  assert.ok(galaxyBranch > imageBranch);
  assert.match(WIKI_COVER_SOURCE, /data-galaxy-params=/);
  assert.match(WIKI_COVER_SOURCE, /escape_html\(JSON\.stringify\(galaxyParams\)\)/);
});

test('Wiki Hero 图片优先作为文字自适应来源，Galaxy 单独使用黑底基准', () => {
  assert.match(WIKI_COVER_SOURCE, /if \(isImageBackground\)[\s\S]*else if \(isGalaxy\)/);
  assert.match(WIKI_COVER_SOURCE, /--adaptive-background:#000000/);
});

test('Wiki Hero 在减少动态效果时不加载 Galaxy 插件', () => {
  assert.match(MAIN_SOURCE, /prefers-reduced-motion: reduce/);
  assert.match(MAIN_SOURCE, /if \(reduceMotion \|\| galaxyCanvases\.length === 0\) return;/);
});

test('Wiki Hero actions 的相对链接留在当前窗口，外部链接打开新窗口', () => {
  const html = renderWikiCover([
    { title: '开始使用', url: '/wiki/stellar/start/' },
    { title: 'GitHub', url: 'https://github.com/xaoxuu/hexo-theme-stellar' }
  ]);
  const relativeLink = html.match(/<a[^>]*href="\/wiki\/stellar\/start\/"[^>]*>/)?.[0];
  const externalLink = html.match(/<a[^>]*href="https:\/\/github\.com\/xaoxuu\/hexo-theme-stellar"[^>]*>/)?.[0];

  assert.ok(relativeLink);
  assert.doesNotMatch(relativeLink, /target="_blank"|rel="external/);
  assert.ok(externalLink);
  assert.match(externalLink, /target="_blank"/);
  assert.match(externalLink, /rel="external nofollow noopener noreferrer"/);
});
