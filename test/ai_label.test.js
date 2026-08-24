'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { AI_LABELS, buildAiLabel, normalizeColor, resolveAiKey } = require('../scripts/lib/ai_label');

test('四档值渲染正确文案与颜色', () => {
  assert.equal(buildAiLabel('manual', '纯手工'), '<span class="ai-label" style="color:#03a9f4">纯手工</span>');
  assert.equal(buildAiLabel('polished', 'AI 润色'), '<span class="ai-label" style="color:#4caf50">AI 润色</span>');
  assert.equal(buildAiLabel('generated', 'AI 生成'), '<span class="ai-label" style="color:#ff9800">AI 生成</span>');
  assert.equal(buildAiLabel('reviewed', 'AI 已审核'), '<span class="ai-label" style="color:#4caf50">AI 已审核</span>');
  assert.equal(Object.isFrozen(AI_LABELS), true);
});

test('颜色工具保留标准化语义', () => {
  assert.equal(normalizeColor('4caf50'), '#4caf50');
  assert.equal(normalizeColor(null), '');
});

test('未知值返回空', () => {
  assert.equal(buildAiLabel('unknown', 'x'), '');
});

test('缺失字段与空值返回空', () => {
  assert.equal(buildAiLabel(undefined, 'x'), '');
  assert.equal(buildAiLabel(null, 'x'), '');
  assert.equal(buildAiLabel('', 'x'), '');
});

test('空文案返回空', () => {
  assert.equal(buildAiLabel('manual', ''), '');
  assert.equal(buildAiLabel('manual', undefined), '');
});

test('文案（多语言文本）做 HTML 转义', () => {
  assert.equal(
    buildAiLabel('reviewed', '<b>&"\'`'),
    '<span class="ai-label" style="color:#4caf50">&lt;b&gt;&amp;&quot;&#39;&#96;</span>'
  );
});

test('extra class 正确拼入', () => {
  assert.equal(buildAiLabel('manual', '纯手工', 'cap right'), '<span class="cap right ai-label" style="color:#03a9f4">纯手工</span>');
  assert.equal(buildAiLabel('manual', '纯手工', 'cap'), '<span class="cap ai-label" style="color:#03a9f4">纯手工</span>');
});

test('icon 渲染在文案前', () => {
  assert.equal(
    buildAiLabel('manual', '纯手工', '', '<svg class="ic"></svg>'),
    '<span class="ai-label" style="color:#03a9f4"><svg class="ic"></svg>纯手工</span>'
  );
});

test('extra class 与 icon 组合', () => {
  assert.equal(
    buildAiLabel('manual', '纯手工', 'cap right', '<svg></svg>'),
    '<span class="cap right ai-label" style="color:#03a9f4"><svg></svg>纯手工</span>'
  );
});

test('noColor 时不输出内联样式（继承默认文字色）', () => {
  assert.equal(
    buildAiLabel('manual', '纯手工', 'cap right', '', true),
    '<span class="cap right ai-label">纯手工</span>'
  );
  assert.equal(
    buildAiLabel('manual', '纯手工', 'cap right', '<svg></svg>', true),
    '<span class="cap right ai-label"><svg></svg>纯手工</span>'
  );
});

test('resolveAiKey 只接受显式等级', () => {
  assert.equal(resolveAiKey('generated'), 'generated');
  assert.equal(resolveAiKey('unknown'), '');
  assert.equal(resolveAiKey(''), '');
  assert.equal(resolveAiKey(undefined), '');
  assert.equal(resolveAiKey(null), '');
  assert.equal(resolveAiKey(true), '');
});
