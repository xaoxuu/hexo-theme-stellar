'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { escapeHTML } = require('hexo-util');

test('escapeHTML 转义属性危险字符（引号、尖括号、&）', () => {
  assert.equal(escapeHTML('通勤最后 10 分钟的"减速"技巧'), '通勤最后 10 分钟的&quot;减速&quot;技巧');
  assert.equal(escapeHTML('a & b < c > d'), 'a &amp; b &lt; c &gt; d');
});

test('escapeHTML 转义单引号、反引号与斜杠', () => {
  assert.equal(escapeHTML("it's `x` / ="), 'it&#39;s &#96;x&#96; &#x2F; &#x3D;');
});

test('escapeHTML 先还原再转义，实体不双重转义', () => {
  assert.equal(escapeHTML('&amp; &lt;'), '&amp; &lt;');
});
