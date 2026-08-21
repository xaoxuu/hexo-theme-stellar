'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RELATED_WIDGET_SOURCE = fs.readFileSync(
  path.join(__dirname, '../layout/_partial/widgets/related.ejs'),
  'utf8'
);

test('Wiki related 条目使用 v2 name 字段渲染标题', () => {
  assert.match(RELATED_WIDGET_SOURCE, /title:\s*relatedProject\.name/);
  assert.doesNotMatch(RELATED_WIDGET_SOURCE, /title:\s*relatedProject\.title/);
});
