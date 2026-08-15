'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { firstContentImage, postImages, postDescription } = require('../scripts/lib/seo');

test('firstContentImage 优先取 data-src', () => {
  const html = '<p>文字</p><img class="lazy" src="data:image/png;base64,xxx" data-src="https://res.xaox.cc/a.webp"><img src="https://res.xaox.cc/b.webp">';
  assert.equal(firstContentImage(html), 'https://res.xaox.cc/a.webp');
});

test('firstContentImage 无 data-src 时取 src', () => {
  const html = '<p>文字</p><img src="https://res.xaox.cc/b.webp">';
  assert.equal(firstContentImage(html), 'https://res.xaox.cc/b.webp');
});

test('firstContentImage 空内容返回空串', () => {
  assert.equal(firstContentImage(''), '');
  assert.equal(firstContentImage(null), '');
  assert.equal(firstContentImage('<p>无图</p>'), '');
});

test('postImages 优先级：cover 优先于 banner/photos', () => {
  const result = postImages({
    cover: 'https://res.xaox.cc/cover.webp',
    banner: 'https://res.xaox.cc/banner.webp',
    photos: ['https://res.xaox.cc/p1.webp'],
    content: '<img src="https://res.xaox.cc/in.webp">'
  });
  assert.deepEqual(result, ['https://res.xaox.cc/cover.webp', 'https://res.xaox.cc/p1.webp']);
});

test('postImages 无 cover 时 banner 前置', () => {
  const result = postImages({
    banner: 'https://res.xaox.cc/banner.webp',
    photos: ['https://res.xaox.cc/p1.webp']
  });
  assert.deepEqual(result, ['https://res.xaox.cc/banner.webp', 'https://res.xaox.cc/p1.webp']);
});

test('postImages 兜底：正文首图 → 默认封面', () => {
  const fromContent = postImages({
    content: '<img data-src="https://res.xaox.cc/first.webp">'
  });
  assert.deepEqual(fromContent, ['https://res.xaox.cc/first.webp']);

  const fromDefault = postImages({
    content: '<p>无图</p>',
    defaultCover: 'https://res.xaox.cc/default.svg'
  });
  assert.deepEqual(fromDefault, ['https://res.xaox.cc/default.svg']);

  const empty = postImages({ content: '<p>无图</p>' });
  assert.deepEqual(empty, []);
});

test('postDescription 优先摘要，缺失时回退正文并截断', () => {
  assert.equal(postDescription({ excerpt: '摘要文本', content: '<p>正文</p>' }), '摘要文本');
  const long = '字'.repeat(300);
  const desc = postDescription({ content: '<p>' + long + '</p>' });
  assert.ok(desc.length <= 200);
  assert.ok(desc.startsWith('字'));
});
