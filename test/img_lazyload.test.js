'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('cheerio');

const { lazyProcess, processSite } = require('../scripts/filters/lib/img_lazyload');

function assertLazyImage(html, originalSrc) {
  const image = load(html, null, false)('img');
  assert.equal(image.length, 1);
  assert.match(image.attr('src'), /^data:image/);
  assert.equal(image.attr('data-src'), originalSrc);
  const fallback = load(html, { scriptingEnabled: false }, false)('noscript img');
  assert.equal(fallback.attr('src'), originalSrc);
  assert.equal(fallback.attr('id'), undefined);
  assert.equal(fallback.attr('data-src'), undefined);
}

test('带引号 src 的图片：延迟请求并提供无脚本后备', () => {
  const html = '<p>文字</p><img src="https://res.xaox.cc/a.webp">';
  const out = lazyProcess(html);
  assertLazyImage(out, 'https://res.xaox.cc/a.webp');
});

test('压缩后无引号 src 的图片：同样处理且不越界到后续内容', () => {
  const html = '<img src=https://res.xaox.cc/a.webp><span>ok</span>';
  const out = lazyProcess(html);
  assertLazyImage(out, 'https://res.xaox.cc/a.webp');
  assert.ok(out.includes('<span>ok</span>'));
});

test('回归：无引号 img 后的内联脚本 s.src="..." 不被改写', () => {
  const html =
    '<img src=https://res.xaox.cc/a.webp><script>var s=document.createElement("script");s.src="/js/utils.js?v=1.41.0";</script>';
  const out = lazyProcess(html);
  assert.ok(out.includes('s.src="/js/utils.js?v=1.41.0"'));
  assert.ok(!out.includes('data-src="/js/utils.js'));
  assert.ok(out.includes('src="https://res.xaox.cc/a.webp"'));
});

test('已有延迟地址保留且重复执行幂等', () => {
  const html = '<img class="lazy" src="data:image/png;base64,xxx" data-src="https://res.xaox.cc/a.webp">';
  const output = lazyProcess(html);
  assertLazyImage(output, 'https://res.xaox.cc/a.webp');
  assert.equal(lazyProcess(output), output);
});

test('srcset 图片交给浏览器原生处理', () => {
  const html = '<img srcset="https://res.xaox.cc/a.webp 1x, https://res.xaox.cc/b.webp 2x">';
  assert.equal(lazyProcess(html), html);
});

test('data:image src 不再处理', () => {
  const html = '<img src="data:image/gif;base64,xxx">';
  assert.equal(lazyProcess(html), html);
  const inline = load(lazyProcess('<img class="lazy" src="data:image/gif;base64,xxx">'))('img');
  assert.equal(inline.attr('class'), undefined);
  assert.equal(inline.attr('data-src'), undefined);
});

test('no-lazy 两种写法都跳过', () => {
  const a = '<img no-lazy src="https://res.xaox.cc/a.webp">';
  const b = '<img no-lazy="" src="https://res.xaox.cc/a.webp">';
  assert.equal(lazyProcess(a), a);
  assert.equal(lazyProcess(b), b);
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
  assert.ok(out.includes('src="real.png"'));
});

test('processSite 入口可用', () => {
  assert.equal(typeof processSite, 'function');
  const out = processSite('<img src="https://res.xaox.cc/a.webp">');
  assert.ok(out.includes('src="https://res.xaox.cc/a.webp"'));
});

test('显式加载属性、srcset 和 sizes 原样保留', () => {
  const image = load(lazyProcess('<img src="a.png" srcset="b.png 2x" sizes="100vw" loading="eager" fetchpriority="high">'))('img');
  for (const [key, value] of Object.entries({ src: 'a.png', srcset: 'b.png 2x', sizes: '100vw', loading: 'eager', fetchpriority: 'high' })) assert.equal(image.attr(key), value);
});


test('后备不重复 ID 或再次改写，保留普通属性和显式 loading', () => {
  const output = lazyProcess('<img id="photo" src="a.png" loading="lazy" width="100" alt="a &amp; b">');
  assert.equal(lazyProcess(output), output);
  const all = load(output, { scriptingEnabled: false }, false);
  assert.equal(all('[id="photo"]').length, 1);
  assert.equal(all('img[data-src]').attr('loading'), 'lazy');
  assert.equal(all('noscript img').attr('width'), '100');
  assert.equal(all('noscript img').attr('alt'), 'a & b');
});

test('响应式和直接加载图片不进入延迟请求流程', () => {
  for (const attributes of ['no-lazy', 'loading="eager"', 'fetchpriority="high"', 'srcset="b.png 2x"']) {
    const output = lazyProcess(`<img class="custom lazy" src="a.png" ${attributes}>`);
    const image = load(output)('img');
    assert.equal(image.attr('src'), 'a.png');
    assert.equal(image.attr('class'), 'custom');
    assert.equal(image.attr('data-src'), undefined);
  }
  const picture = '<picture><source srcset="a.avif"><img src="a.png" alt="photo"></picture>';
  assert.equal(lazyProcess(picture), picture);
});
