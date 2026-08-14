'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { wrapMdTables } = require('../scripts/filters/lib/md_table');

test('普通表格被包一层 .md-table-scroll', () => {
  const html = '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>';
  const out = wrapMdTables(html);
  assert.ok(out.startsWith('<div class="md-table-scroll"><table>'));
  assert.ok(out.endsWith('</table></div>'));
});

test('代码高亮表格不包裹', () => {
  const html = '<figure class="highlight"><table><tr><td>code</td></tr></table></figure>';
  const out = wrapMdTables(html);
  assert.ok(!out.includes('md-table-scroll'));
});

test('{% table %} 标签容器内表格不包裹', () => {
  const html = '<div class="tag-plugin table table-scroll"><table><tr><td>a</td></tr></table></div>';
  const out = wrapMdTables(html);
  assert.ok(!out.includes('md-table-scroll'));
});

test('已包裹的表格不重复包裹', () => {
  const html = '<div class="md-table-scroll"><table><tr><td>a</td></tr></table></div>';
  const out = wrapMdTables(html);
  assert.equal(out.match(/md-table-scroll/g).length, 1);
});

test('note 容器内的普通表格也包裹', () => {
  const html = '<div class="tag-plugin note"><table><tr><td>a</td></tr></table></div>';
  const out = wrapMdTables(html);
  assert.ok(out.includes('md-table-scroll'));
});

test('HTML 实体与结构保留', () => {
  const html = '<p>a &amp; b &lt;c&gt;</p><table><tr><td>1 &amp; 2</td></tr></table>';
  const out = wrapMdTables(html);
  assert.ok(out.includes('a &amp; b &lt;c&gt;'));
  assert.ok(out.includes('1 &amp; 2'));
});

test('processPost 修改 data.content', () => {
  const { processPost } = require('../scripts/filters/lib/md_table');
  const data = { content: '<table><tr><td>a</td></tr></table>' };
  const out = processPost(data);
  assert.ok(out.content.includes('md-table-scroll'));
});
