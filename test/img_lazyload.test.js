'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { lazyProcess, processSite } = require('../scripts/filters/lib/img_lazyload');

const LOADING = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAADa6r/EAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=';

test('带引号 src 的图片：加 lazy 类并替换为占位图 + data-src', () => {
  const html = '<p>文字</p><img src="https://res.xaox.cc/a.webp">';
  const out = lazyProcess(html);
  assert.ok(out.includes('<img class="lazy" src="' + LOADING + '" data-src="https://res.xaox.cc/a.webp">'));
  assert.ok(!out.includes('<img src="https://res.xaox.cc/a.webp">'));
});

test('压缩后无引号 src 的图片：同样处理且不越界到后续内容', () => {
  const html = '<img src=https://res.xaox.cc/a.webp><span>ok</span>';
  const out = lazyProcess(html);
  assert.ok(out.includes('<img class="lazy" src="' + LOADING + '" data-src="https://res.xaox.cc/a.webp">'));
  assert.ok(out.includes('<span>ok</span>'));
});

test('回归：无引号 img 后的内联脚本 s.src="..." 不被改写', () => {
  const html =
    '<img src=https://res.xaox.cc/a.webp><script>var s=document.createElement("script");s.src="/js/utils.js?v=1.41.0";</script>';
  const out = lazyProcess(html);
  assert.ok(out.includes('s.src="/js/utils.js?v=1.41.0"'));
  assert.ok(!out.includes('data-src="/js/utils.js'));
  assert.ok(out.includes('data-src="https://res.xaox.cc/a.webp"'));
});

test('已有 data-src 的图片不重复处理', () => {
  const html = '<img class="lazy" src="data:image/png;base64,xxx" data-src="https://res.xaox.cc/a.webp">';
  assert.equal(lazyProcess(html), html);
});

test('srcset 图片交给浏览器原生处理', () => {
  const html = '<img srcset="https://res.xaox.cc/a.webp 1x, https://res.xaox.cc/b.webp 2x">';
  assert.equal(lazyProcess(html), html);
});

test('data:image src 不再处理', () => {
  const html = '<img src="data:image/gif;base64,xxx">';
  assert.equal(lazyProcess(html), html);
});

test('no-lazy 两种写法都跳过', () => {
  const a = '<img no-lazy src="https://res.xaox.cc/a.webp">';
  const b = '<img no-lazy="" src="https://res.xaox.cc/a.webp">';
  assert.equal(lazyProcess(a), a);
  assert.equal(lazyProcess(b), b);
});

test('class 为末尾属性时也追加 lazy', () => {
  const out = lazyProcess('<img src="https://res.xaox.cc/a.webp" class="foo">');
  assert.ok(out.includes('class="foo lazy"'));
});

test('无引号 class 也追加 lazy 并规范化引号', () => {
  const out = lazyProcess('<img class=foo src="https://res.xaox.cc/a.webp">');
  assert.ok(out.includes('class="foo lazy"'));
});

test('class 与 src 顺序保持且均带引号', () => {
  const out = lazyProcess('<img class="foo" src="https://res.xaox.cc/a.webp">');
  assert.ok(out.includes('<img class="foo lazy" src="' + LOADING + '" data-src="https://res.xaox.cc/a.webp">'));
});

test('自闭合标签处理', () => {
  const out = lazyProcess('<img src="https://res.xaox.cc/a.webp" />');
  assert.ok(out.includes('data-src="https://res.xaox.cc/a.webp" />'));
});

test('空 src / 无 src 原样返回', () => {
  assert.equal(lazyProcess('<img src="">'), '<img src="">');
  assert.equal(lazyProcess('<img alt="x">'), '<img alt="x">');
});

test('无 img 或非字符串原样返回', () => {
  assert.equal(lazyProcess('<p>no image</p>'), '<p>no image</p>');
  assert.equal(lazyProcess(null), null);
  assert.equal(lazyProcess(undefined), undefined);
});

test('script/style/注释中的 <img 不被处理', () => {
  const html =
    '<style>.x{background:url(img.png)}</style><script>const t=`<img src="inside.png">`;</script><!-- <img src="comment.png"> --><img src="real.png">';
  const out = lazyProcess(html);
  assert.ok(out.includes('<img src="inside.png">'));
  assert.ok(out.includes('<img src="comment.png">'));
  assert.ok(out.includes('data-src="real.png"'));
});

test('大写标签名与属性名', () => {
  const out = lazyProcess('<IMG SRC="https://res.xaox.cc/a.webp">');
  assert.ok(out.includes('<img class="lazy" src="' + LOADING + '" data-src="https://res.xaox.cc/a.webp">'));
});

test('processSite 入口可用', () => {
  assert.equal(typeof processSite, 'function');
  const out = processSite('<img src="https://res.xaox.cc/a.webp">');
  assert.ok(out.includes('data-src="https://res.xaox.cc/a.webp"'));
});
