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

test('HSLA storage preserves color and alpha with shared Node/browser conversion', () => {
  const nodeColor = require('../source/js/color');
  for (const rgba of [{ r: 255, g: 0, b: 0, a: 0 }, { r: 12, g: 34, b: 56, a: 128 }, { r: 128, g: 128, b: 128, a: 255 }]) {
    const hsla = color.toHsla(rgba);
    assert.deepEqual(Array.from(hsla), nodeColor.toHsla(rgba));
    assert.ok(Math.abs(hsla[3] - rgba.a / 255) < 0.0001);
    assert.deepEqual(toHost(color.fromHsla(hsla)), { r: rgba.r, g: rgba.g, b: rgba.b });
  }
  assert.equal(color.fromHsla([0, 101, 50, 1]), null);
});

test('luminance 使用 WCAG 相对亮度', () => {
  assert.equal(color.luminance({ r: 0, g: 0, b: 0 }), 0);
  assert.equal(color.luminance({ r: 255, g: 255, b: 255 }), 1);
  // #777 ≈ 0.184（WCAG 相对亮度）
  assert.ok(Math.abs(color.luminance(color.parse('#777777')) - 0.184) < 0.01);
});
