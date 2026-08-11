'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { extractVersionSection, hasNonEmptyChangelogSection } = require('../release.js');

test('extractVersionSection 提取指定版本章节正文', () => {
  const text = [
    '# Changelog',
    '',
    '## 1.38.0',
    '> 发布日期：2026-08-01',
    '',
    '### 新功能',
    '- 新增示例',
    '',
    '## 1.37.0',
    '### 修复',
    '- 旧版',
  ].join('\n');
  const section = extractVersionSection(text, '1.38.0');
  assert.ok(section.includes('新增示例'));
  assert.ok(!section.includes('## 1.38.0'));
  assert.ok(!section.includes('旧版'));
});

test('extractVersionSection 版本不存在时返回 null', () => {
  const text = '## 1.38.0\n- x\n';
  assert.equal(extractVersionSection(text, '9.9.9'), null);
});

test('hasNonEmptyChangelogSection 判定非空与缺失', () => {
  const text = [
    '## 1.38.0',
    '> 发布日期：2026-08-01',
    '',
    '- 变更条目',
  ].join('\n');
  assert.equal(hasNonEmptyChangelogSection(text, '1.38.0'), true);
  assert.equal(hasNonEmptyChangelogSection(text, '1.37.0'), false);
});

test('hasNonEmptyChangelogSection 仅含发布日期视为空章节', () => {
  const text = '## 1.38.0\n> 发布日期：2026-08-01\n';
  assert.equal(hasNonEmptyChangelogSection(text, '1.38.0'), false);
});
