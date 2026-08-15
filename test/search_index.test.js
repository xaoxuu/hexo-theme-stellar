'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildSearchIndex } = require('../scripts/lib/search_index');
const { stripHTML } = require('hexo-util');

// scripts/generators/search.js 旧版全文归一化（回归基准）
function legacyNormalize(html) {
  let content = stripHTML(html.replace(/<span class="line">\d+<\/span>/g, '')).trim();
  content = content.replace(/<iframe[\s|\S]+iframe>/g, '');
  content = content.replace(/<hr>/g, '');
  content = content.replace(/<br>/g, '');
  content = content.replace(/&[^\s;]+;/g, '');
  content = content.replace(/\\n/g, ' ');
  content = content.replace(/\n/g, ' ');
  content = content.replace(/[\s]{2,}/g, ' ');
  return content.trim();
}

test('buildSearchIndex 重建正文与旧版全文归一化逐字节一致', () => {
  const fixtures = [
    '<p>安装 配置 使用方法 都先看这里。</p>\n<h2 id="使用方法"><a href="#使用方法" class="headerlink" title="使用方法"></a>使用方法</h2><p>一些内容，里面提到 使用方法。</p>',
    '<p>无标题页面内容。</p>\n<p>第二段。</p>',
    '<h2 id="a">英文 Heading</h2><p>body</p>',
    '<p>foo</p>\n<br>\n<hr>\n<p>bar</p>',
    '<p>A &amp; B &lt; C</p><h2 id="x">X</h2>',
    '   \n<h2 id="lead">开头标题</h2><p>内容</p>'
  ];
  for (const html of fixtures) {
    const { content } = buildSearchIndex(html);
    assert.equal(content, legacyNormalize(html));
  }
});

test('buildSearchIndex 提取普通标题锚点', () => {
  const html = '<h2 id="使用方法"><a href="#使用方法" class="headerlink" title="使用方法"></a>使用方法</h2><p>正文。</p><h3 id="配置"><a href="#配置" class="headerlink" title="配置"></a>配置</h3>';
  const { content, anchors } = buildSearchIndex(html);
  assert.deepEqual(anchors, [
    { id: '使用方法', text: '使用方法', offset: 0 },
    { id: '配置', text: '配置', offset: content.indexOf('配置', 1) }
  ]);
});

test('buildSearchIndex 支持带空格的标题 id（quot 风格）', () => {
  const html = '<h2 class="content" id="快速 上手"><span class="empty"></span><span class="text">快速 上手</span></h2>';
  const { content, anchors } = buildSearchIndex(html);
  assert.equal(anchors.length, 1);
  assert.equal(anchors[0].id, '快速 上手');
  assert.equal(anchors[0].offset, content.indexOf('快速 上手'));
});

test('buildSearchIndex 正文先出现同名文本时 offset 仍指向标题', () => {
  const html = '<p>先提到 使用方法。</p>\n<h2 id="使用方法">使用方法</h2><p>后文。</p>';
  const { content, anchors } = buildSearchIndex(html);
  const bodyIndex = content.indexOf('使用方法');
  const headingIndex = content.indexOf('使用方法', bodyIndex + 1);
  assert.ok(bodyIndex >= 0 && headingIndex > bodyIndex);
  assert.equal(anchors[0].offset, headingIndex);
  assert.equal(anchors[0].text, '使用方法');
});

test('buildSearchIndex 无标题页返回空锚点', () => {
  const { content, anchors } = buildSearchIndex('<p>只有正文，没有标题。</p>');
  assert.equal(anchors.length, 0);
  assert.equal(content, '只有正文，没有标题。');
});

test('buildSearchIndex 无 id 的标题不产生锚点但保留文本', () => {
  const html = '<h2>无 id 标题</h2><p>正文。</p>';
  const { content, anchors } = buildSearchIndex(html);
  assert.equal(anchors.length, 0);
  assert.ok(content.includes('无 id 标题'));
});

test('buildSearchIndex 前导空白时锚点偏移回移正确', () => {
  const html = '  \n<h2 id="x">标题</h2><p>内容。</p>';
  const { content, anchors } = buildSearchIndex(html);
  assert.equal(content[0], '标');
  assert.equal(anchors[0].offset, 0);
});

test('buildSearchIndex 锚点偏移与 content.indexOf 严格对齐', () => {
  const html = '<p>安装 配置 使用方法 都先看这里。</p>\n<h2 id="使用方法">使用方法</h2><p>一些内容。</p>\n<h3 id="配置项说明">配置项说明</h3><p>配置项 详情。</p>\n<h2 id="快速 上手">快速 上手</h2><p>末尾。</p>';
  const { content, anchors } = buildSearchIndex(html);
  for (const anchor of anchors) {
    assert.equal(content.slice(anchor.offset, anchor.offset + anchor.text.length), anchor.text);
  }
  const kw = '配置项';
  const hit = content.indexOf(kw);
  const target = anchors.filter(a => a.offset <= hit).pop();
  assert.equal(target.id, '配置项说明');
});
