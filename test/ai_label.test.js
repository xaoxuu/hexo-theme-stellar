'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildAiLabel, resolveAiKey } = require('../scripts/lib/ai_label');

const LABEL_CONFIG = {
  manual: { color: '#4caf50' },
  polished: { color: '#ff9800' },
  generated: { color: '#f44336' },
  reviewed: { color: '#00bcd4' }
};

test('四档值渲染正确文案与颜色', () => {
  assert.equal(buildAiLabel('manual', LABEL_CONFIG, '纯手工'), '<span class="ai-label" style="color:#4caf50">纯手工</span>');
  assert.equal(buildAiLabel('polished', LABEL_CONFIG, 'AI 润色'), '<span class="ai-label" style="color:#ff9800">AI 润色</span>');
  assert.equal(buildAiLabel('generated', LABEL_CONFIG, 'AI 生成'), '<span class="ai-label" style="color:#f44336">AI 生成</span>');
  assert.equal(buildAiLabel('reviewed', LABEL_CONFIG, 'AI 已审核'), '<span class="ai-label" style="color:#00bcd4">AI 已审核</span>');
});

test('缺 # 的颜色自动补全', () => {
  const config = { manual: { color: '4caf50' } };
  assert.equal(buildAiLabel('manual', config, '纯手工'), '<span class="ai-label" style="color:#4caf50">纯手工</span>');
});

test('未知值返回空', () => {
  assert.equal(buildAiLabel('unknown', LABEL_CONFIG, 'x'), '');
});

test('缺失字段与空值返回空', () => {
  assert.equal(buildAiLabel(undefined, LABEL_CONFIG, 'x'), '');
  assert.equal(buildAiLabel(null, LABEL_CONFIG, 'x'), '');
  assert.equal(buildAiLabel('', LABEL_CONFIG, 'x'), '');
  assert.equal(buildAiLabel('manual', null, 'x'), '');
  assert.equal(buildAiLabel('manual', {}, 'x'), '');
});

test('空文案返回空', () => {
  assert.equal(buildAiLabel('manual', { manual: { color: '#4caf50' } }, ''), '');
  assert.equal(buildAiLabel('manual', { manual: { color: '#4caf50' } }, undefined), '');
});

test('文案（多语言文本）做 HTML 转义', () => {
  const config = { x: { color: '#4caf50' } };
  assert.equal(
    buildAiLabel('x', config, '<b>&"\'`'),
    '<span class="ai-label" style="color:#4caf50">&lt;b&gt;&amp;&quot;&#39;&#96;</span>'
  );
});

test('extra class 正确拼入', () => {
  assert.equal(buildAiLabel('manual', LABEL_CONFIG, '纯手工', 'cap right'), '<span class="cap right ai-label" style="color:#4caf50">纯手工</span>');
  assert.equal(buildAiLabel('manual', LABEL_CONFIG, '纯手工', 'cap'), '<span class="cap ai-label" style="color:#4caf50">纯手工</span>');
});

test('无颜色配置时仅输出文案', () => {
  assert.equal(buildAiLabel('manual', { manual: {} }, '纯手工'), '<span class="ai-label">纯手工</span>');
});

test('icon 渲染在文案前', () => {
  assert.equal(
    buildAiLabel('manual', LABEL_CONFIG, '纯手工', '', '<svg class="ic"></svg>'),
    '<span class="ai-label" style="color:#4caf50"><svg class="ic"></svg>纯手工</span>'
  );
});

test('extra class 与 icon 组合', () => {
  assert.equal(
    buildAiLabel('manual', LABEL_CONFIG, '纯手工', 'cap right', '<svg></svg>'),
    '<span class="cap right ai-label" style="color:#4caf50"><svg></svg>纯手工</span>'
  );
});

test('noColor 时不输出内联样式（继承默认文字色）', () => {
  assert.equal(
    buildAiLabel('manual', LABEL_CONFIG, '纯手工', 'cap right', '', true),
    '<span class="cap right ai-label">纯手工</span>'
  );
  assert.equal(
    buildAiLabel('manual', LABEL_CONFIG, '纯手工', 'cap right', '<svg></svg>', true),
    '<span class="cap right ai-label"><svg></svg>纯手工</span>'
  );
});

test('resolveAiKey 文章字段优先于 default', () => {
  const cfg = { default: 'manual', manual: {}, generated: {} };
  assert.equal(resolveAiKey('generated', cfg), 'generated');
  assert.equal(resolveAiKey('', cfg), 'manual');
  assert.equal(resolveAiKey(undefined, cfg), 'manual');
  assert.equal(resolveAiKey(null, cfg), 'manual');
  assert.equal(resolveAiKey(true, cfg), 'manual');
});

test('resolveAiKey default 为空时不渲染', () => {
  assert.equal(resolveAiKey('', { default: null, manual: {} }), '');
  assert.equal(resolveAiKey('', { default: '', manual: {} }), '');
  assert.equal(resolveAiKey('', null), '');
  assert.equal(resolveAiKey('', {}), '');
});
