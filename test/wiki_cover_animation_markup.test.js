'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WIKI_COVER_SOURCE = fs.readFileSync(path.join(__dirname, '../layout/_partial/cover/wiki_cover.ejs'), 'utf8');
const MAIN_SOURCE = fs.readFileSync(path.join(__dirname, '../source/js/main.js'), 'utf8');

test('Wiki Hero 分别从 background 和 animation 判断图片与 Galaxy', () => {
  assert.match(WIKI_COVER_SOURCE, /var isImageBackground = background\.length > 0;/);
  assert.match(WIKI_COVER_SOURCE, /var isGalaxy = animation\.type === 'galaxy';/);
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
