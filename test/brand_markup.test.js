'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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

test('Brand 模板只输出统一 wrapper 和三种语义样式 class', () => {
  assert.match(BRAND_TEMPLATE, /class="brand-image brand-image--\$\{style\}"/);
  assert.match(BRAND_TEMPLATE, /class="brand-wrap"/);
  assert.match(BRAND_TEMPLATE, /class="brand-header/);
  assert.doesNotMatch(BRAND_TEMPLATE, /logo-wrap|class="icon"|class="avatar"/);
});

test('Brand 图片背景只由显式配置写入 CSS 变量', () => {
  assert.match(BRAND_TEMPLATE, /image\.background \? ` style="--brand-image-background:/);
  assert.match(BRAND_STYLE, /background: var\(--brand-image-background, transparent\)/);
});

test('avatar、icon、plain 分别遵守裁剪和填充契约', () => {
  assert.match(BRAND_STYLE, /\.brand-image--avatar[\s\S]*border-radius: 50%[\s\S]*object-fit: cover/);
  assert.match(BRAND_STYLE, /\.brand-image--icon[\s\S]*border-radius: \$border-card-s[\s\S]*object-fit: contain/);
  assert.match(BRAND_STYLE, /\.brand-image--plain[\s\S]*background: transparent[\s\S]*object-fit: contain/);
  assert.doesNotMatch(BRAND_STYLE, /\.brand-image--plain[\s\S]*?overflow: hidden/);
});

test('avatar 图片用 inset 在光环内保持同心，不使用 margin 或字符串 calc', () => {
  const start = BRAND_STYLE.indexOf('.brand-image--avatar');
  const end = BRAND_STYLE.indexOf('\n  .brand-image--icon', start);
  const avatarStyle = BRAND_STYLE.slice(start, end);
  assert.match(avatarStyle, /img[\s\S]*position: absolute[\s\S]*inset:\s2px/);
  assert.doesNotMatch(avatarStyle, /margin: 2px|"calc\(/);
});

test('头像旋转背景仅由 avatar 分支生成和控制', () => {
  assert.match(BRAND_TEMPLATE, /style === 'avatar'[\s\S]*brand-image-bg/);
  assert.match(BRAND_STYLE, /\.brand-image--avatar[\s\S]*\.brand-image-bg/);
  assert.doesNotMatch(BRAND_STYLE, /\.brand-image--(?:icon|plain)[\s\S]*\.brand-image-bg/);
});

test('手机端 Brand 只通过页面类型 helper 决定，不读取页面开关', () => {
  assert.match(LAYOUT_TEMPLATE, /showMobileBrand\(page/);
  assert.match(LAYOUT_TEMPLATE, /if \(mobileBrandVisible\)/);
  assert.doesNotMatch(LAYOUT_TEMPLATE, /mobile_header/);
});
