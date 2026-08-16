'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// 加载浏览器脚本 source/js/color.js（IIFE 挂载到 window.stellar.color），
// 通过 vm 沙箱模拟浏览器全局，避免引入额外依赖。
function loadColor() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'source', 'js', 'color.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'source/js/color.js' });
  return sandbox.window.stellar.color;
}

const color = loadColor();

// vm 沙箱内创建的对象原型链与宿主不同，deepStrictEqual 需要先复制为宿主对象
function toHost(obj) {
  return { r: obj.r, g: obj.g, b: obj.b };
}

test('parse 支持 hex 与 rgb/rgba', () => {
  assert.deepEqual(toHost(color.parse('#ffffff')), { r: 255, g: 255, b: 255 });
  assert.deepEqual(toHost(color.parse('#fff')), { r: 255, g: 255, b: 255 });
  assert.deepEqual(toHost(color.parse('#abc')), { r: 170, g: 187, b: 204 });
  assert.deepEqual(toHost(color.parse('#ff000080')), { r: 255, g: 0, b: 0 });
  assert.deepEqual(toHost(color.parse('rgb(1, 2, 3)')), { r: 1, g: 2, b: 3 });
  assert.deepEqual(toHost(color.parse('rgba(1,2,3,0.5)')), { r: 1, g: 2, b: 3 });
  assert.deepEqual(toHost(color.parse('rgb(255 255 255)')), { r: 255, g: 255, b: 255 });
  assert.equal(color.parse('not-a-color'), null);
  assert.equal(color.parse(null), null);
});

test('parse 支持 hsl/hsla 与 alpha（逗号与空格/斜杠语法）', () => {
  assert.deepEqual(toHost(color.parse('hsl(0, 100%, 50%)')), { r: 255, g: 0, b: 0 });
  assert.deepEqual(toHost(color.parse('hsl(120 100% 25%)')), { r: 0, g: 128, b: 0 });
  assert.deepEqual(toHost(color.parse('hsla(210deg 20% 98% / 1)')), { r: 249, g: 250, b: 251 });
  assert.equal(color.parse('hsla(120, 100%, 25%, 0.5)').a, 0.5);
  assert.equal(color.parse('hsla(120 100% 25% / 50%)').a, 0.5);
  assert.equal(color.parse('#ff000080').a, 128 / 255);
  assert.equal(color.parse('rgba(1,2,3,0.25)').a, 0.25);
});

test('blendToBackground 按平均透明度向背景色混合', () => {
  // 完全透明 → 背景色
  assert.deepEqual(toHost(color.blendToBackground({ r: 0, g: 0, b: 0, a: 0 }, { r: 250, g: 250, b: 250 })), { r: 250, g: 250, b: 250 });
  // 完全不透明 → 原色（背景不参与）
  assert.deepEqual(toHost(color.blendToBackground({ r: 28, g: 28, b: 28, a: 255 }, { r: 250, g: 250, b: 250 })), { r: 28, g: 28, b: 28 });
  // 半透明混合：128/255 透明 → 0.502 原色 + 0.498 背景
  assert.deepEqual(toHost(color.blendToBackground({ r: 0, g: 0, b: 0, a: 128 }, { r: 255, g: 255, b: 255 })), { r: 127, g: 127, b: 127 });
  // 无背景 → 原色（去掉 alpha）
  assert.deepEqual(toHost(color.blendToBackground({ r: 28, g: 28, b: 28, a: 16 })), { r: 28, g: 28, b: 28 });
  // 背景支持颜色字符串
  assert.deepEqual(toHost(color.blendToBackground({ r: 0, g: 0, b: 0, a: 0 }, '#ffffff')), { r: 255, g: 255, b: 255 });
});

test('luminance 使用 WCAG 相对亮度', () => {
  assert.equal(color.luminance({ r: 0, g: 0, b: 0 }), 0);
  assert.equal(color.luminance({ r: 255, g: 255, b: 255 }), 1);
  // #777 ≈ 0.184（WCAG 相对亮度）
  assert.ok(Math.abs(color.luminance(color.parse('#777777')) - 0.184) < 0.01);
});

test('isDark 默认阈值 0.5，可自定义阈值', () => {
  assert.equal(color.isDark({ r: 0, g: 0, b: 0 }), true);
  assert.equal(color.isDark({ r: 255, g: 255, b: 255 }), false);
  assert.equal(color.isDark({ r: 128, g: 128, b: 128 }), true);
  assert.equal(color.isDark({ r: 200, g: 200, b: 200 }), false);
  assert.equal(color.isDark({ r: 200, g: 200, b: 200 }, 0.6), true);
});

test('lighten/darken 设定目标明度并保留色相', () => {
  // 无彩色：明度即通道值（round(0.85*255)=217、round(0.3*255)=77）
  assert.equal(color.lighten({ r: 0, g: 0, b: 0 }, 0.85), 'rgb(217,217,217)');
  assert.equal(color.darken({ r: 255, g: 255, b: 255 }, 0.3), 'rgb(77,77,77)');
  // 红色 hsl(0,100%,50%) 明度不变时保持原色
  assert.equal(color.lighten({ r: 255, g: 0, b: 0 }, 0.5), 'rgb(255,0,0)');
  // 蓝色色相保留（b 最高、r 最低）
  const light = color.parse(color.lighten({ r: 33, g: 150, b: 243 }, 0.85));
  assert.ok(light.b >= light.g && light.g >= light.r);
});

test('adaptiveTextColor 样式1（contrast）：深色背景白字、浅色背景深字', () => {
  assert.equal(color.adaptiveTextColor('#000000', { style: 'contrast' }), '#ffffff');
  assert.equal(color.adaptiveTextColor('#ffffff', { style: 'contrast' }), '#111111');
  assert.equal(color.adaptiveTextColor({ r: 240, g: 240, b: 240 }, { style: 'contrast' }), '#111111');
});

test('adaptiveTextColor 默认阈值 0.6 偏向浅色文字，可显式覆盖阈值', () => {
  // #bcbcbc 相对亮度 ≈ 0.503，介于 0.5~0.6：默认判定为深色 → 浅色文字
  assert.equal(color.adaptiveTextColor('#bcbcbc', { style: 'contrast' }), '#ffffff');
  // 显式 threshold 0.5 时判定为浅色 → 深色文字
  assert.equal(color.adaptiveTextColor('#bcbcbc', { style: 'contrast', threshold: 0.5 }), '#111111');
});

test('effectiveThreshold：彩色背景阈值上浮（浅粉判深 → 白字），中性灰保持 0.6', () => {
  // 浅粉 rgb(244,191,192)：亮度 ≈ 0.603，饱和度 ≈ 0.71 → 彩色阈值 0.65 → 白字
  assert.equal(color.adaptiveTextColor('#f4bfc0', { style: 'contrast' }), '#ffffff');
  // 浅灰 #d0d0d0：亮度 ≈ 0.631，饱和度 0 → 中性阈值 0.6 → 深字
  assert.equal(color.adaptiveTextColor('#d0d0d0', { style: 'contrast' }), '#111111');
  // 显式 threshold 优先于 effectiveThreshold
  assert.equal(color.adaptiveTextColor('#f4bfc0', { style: 'contrast', threshold: 0.5 }), '#111111');
});

test('adaptiveTextColor 样式2（theme）：以背景色为基色 lighten/darken', () => {
  // 深色背景 → lighten 到 0.85（灰阶下即 217）
  assert.equal(color.adaptiveTextColor('#111111', { style: 'theme' }), 'rgb(217,217,217)');
  // 浅色背景 → darken 到 0.3（灰阶下即 77）
  assert.equal(color.adaptiveTextColor('#f0f0f0', { style: 'theme' }), 'rgb(77,77,77)');
  // 彩色背景保留色相
  const result = color.parse(color.adaptiveTextColor('#2196f3', { style: 'theme' }));
  assert.ok(result.b >= result.g && result.g >= result.r);
  // 默认 style 为 theme
  assert.equal(color.adaptiveTextColor('#111111'), 'rgb(217,217,217)');
});

test('enhanceSaturation：低饱和彩色平均色抬升饱和度，中性/高饱和不变', () => {
  // 浅灰蓝 rgb(238,240,242)：s≈0.133 → 抬升到 0.3，色相 210° 保留（b 通道更高）
  const boosted = toHost(color.enhanceSaturation({ r: 238, g: 240, b: 242 }));
  assert.ok(boosted.b >= boosted.g && boosted.g >= boosted.r);
  assert.ok(boosted.b - boosted.r >= 8);
  // 完全中性不变
  assert.deepEqual(toHost(color.enhanceSaturation({ r: 200, g: 200, b: 200 })), { r: 200, g: 200, b: 200 });
  // 已饱和（浅粉 s≈0.7）不变
  assert.deepEqual(toHost(color.enhanceSaturation({ r: 244, g: 191, b: 192 })), { r: 244, g: 191, b: 192 });
});

test('adaptiveTextColor theme：低饱和蓝灰平均色带出蓝色倾向', () => {
  // 大面积极浅灰 + 蓝色 logo 的平均色：增强后主题小字应明显偏蓝（b-g 通道高于 r）
  const result = toHost(color.parse(color.adaptiveTextColor({ r: 238, g: 240, b: 242 }, { style: 'theme' })));
  assert.ok(result.b - result.r > 30);
  assert.ok(result.b >= result.g && result.g >= result.r);
});

test('adaptiveTextColor saturationScale：调小更接近黑白，保留一点色相', () => {
  const full = toHost(color.parse(color.adaptiveTextColor({ r: 238, g: 240, b: 242 }, { style: 'theme' })));
  const scaled = toHost(color.parse(color.adaptiveTextColor({ r: 238, g: 240, b: 242 }, { style: 'theme', saturationScale: 0.15 })));
  const zero = toHost(color.parse(color.adaptiveTextColor({ r: 238, g: 240, b: 242 }, { style: 'theme', saturationScale: 0 })));
  // 完整 theme 明显偏蓝
  assert.ok(full.b - full.r > 30);
  // 0.15：接近黑白（通道差距小），但仍保留一点蓝色倾向
  assert.ok(scaled.b - scaled.r < 10);
  assert.ok(scaled.b > scaled.r);
  // 0：纯灰
  assert.deepEqual(zero, { r: 77, g: 77, b: 77 });
});
