'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { subtitle } = require('../scripts/lib/subtitle');

test('subtitle 优先取 post.subtitle', () => {
  assert.equal(subtitle({ subtitle: '小字', description: '描述', excerpt: '摘要' }), '小字');
});

test('显式 subtitle 的非空前缀会截取 | 前内容', () => {
  assert.equal(subtitle({ subtitle: 'Stellar | Designed by xaoxuu' }), 'Stellar');
  assert.equal(subtitle({ subtitle: 'Stellar | Designed | Open source' }), 'Stellar');
});

test('subtitle 以 | 开头时保留完整内容', () => {
  assert.equal(subtitle({ subtitle: ' | Designed by xaoxuu' }), ' | Designed by xaoxuu');
});

test('subtitle 无 subtitle 时取 description', () => {
  assert.equal(subtitle({ description: '描述', excerpt: '摘要' }), '描述');
});

test('subtitle 空字符串视为缺失', () => {
  assert.equal(subtitle({ subtitle: '', description: '描述' }), '描述');
  assert.equal(subtitle({ subtitle: '', description: '', excerpt: '摘要' }), '摘要');
});

test('subtitle 兜底取 excerpt：去 HTML 并压缩空白', () => {
  assert.equal(subtitle({ excerpt: '<p>第一段</p><p>  第二段</p>' }), '第一段 第二段');
});

test('subtitle excerpt 超过 50 字时截断', () => {
  const long = '字'.repeat(80);
  const out = subtitle({ excerpt: long });
  assert.equal(out.length, 50);
  assert.equal(out, '字'.repeat(50));
});

test('subtitle 无 excerpt 时回退 content 并截断', () => {
  const out = subtitle({ content: '<p>' + 'a'.repeat(60) + '</p>' });
  assert.equal(out, 'a'.repeat(50));
});

test('subtitle 空值返回空串', () => {
  assert.equal(subtitle(null), '');
  assert.equal(subtitle({}), '');
  assert.equal(subtitle({ subtitle: '', description: '', excerpt: '   ' }), '');
});

test('subtitle 支持自定义截断长度', () => {
  assert.equal(subtitle({ excerpt: '字'.repeat(10) }, 3), '字'.repeat(3));
});
