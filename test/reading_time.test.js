'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { countWords, readingMinutes } = require('../scripts/lib/reading_time');

test('countWords 统计中文字符', () => {
  assert.equal(countWords('这是一个测试文章'), 8);
});

test('countWords 统计英文单词与数字', () => {
  assert.equal(countWords('hello world 2026'), 3);
});

test('countWords 中英混排分别计数', () => {
  assert.equal(countWords('你好 world 世界 hello'), 6);
});

test('countWords 忽略 HTML 标签', () => {
  assert.equal(countWords('<p>正文</p><img src="x">'), 2);
});

test('countWords 空内容返回 0', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords(null), 0);
});

test('readingMinutes 最少 1 分钟，按 300 字/分钟向上取整', () => {
  assert.equal(readingMinutes(''), 1);
  assert.equal(readingMinutes('a'.repeat(299)), 1);
  assert.equal(readingMinutes('a'.repeat(300)), 1);
  assert.equal(readingMinutes('word '.repeat(301)), 2);
});
