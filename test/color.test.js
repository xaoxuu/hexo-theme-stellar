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
