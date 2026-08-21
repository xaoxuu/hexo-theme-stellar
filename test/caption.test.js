'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { caption } = require('../scripts/lib/caption');

test('caption 使用组件 tagline 并截取分隔符左侧', () => {
  assert.equal(caption({ banner: { tagline: 'Stellar | Designed by xaoxuu' } }), 'Stellar');
  assert.equal(caption({ card: { tagline: '卡片说明' }, description: '描述' }), '卡片说明');
});

test('caption 按 description 和 excerpt 回退', () => {
  assert.equal(caption({ description: '描述', excerpt: '摘要' }), '描述');
  assert.equal(caption({ excerpt: '<p>第一段</p><p>第二段</p>' }), '第一段第二段');
});

test('caption 截断正文并处理空值', () => {
  assert.equal(caption({ content: 'abcdef' }, 3), 'abc');
  assert.equal(caption(null), '');
  assert.equal(caption({}), '');
});
