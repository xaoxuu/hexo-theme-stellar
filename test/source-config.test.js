'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readFrontMatter, pruneSourceCache } = require('../scripts/lib/source-config');

test('Front Matter cache reuses unchanged files and invalidates updates, removals and owners', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'stellar-source-cache-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const owner = { source_dir: directory };
  const page = { source: 'page.md' };
  const file = path.join(directory, page.source);
  fs.writeFileSync(file, '---\ntitle: First\n---\nBody');
  const first = readFrontMatter(owner, page);
  assert.equal(first.title, 'First');
  assert.equal(readFrontMatter(owner, page), first);
  assert.notEqual(readFrontMatter({ source_dir: directory }, page), first);
  pruneSourceCache(owner, []);
  assert.notEqual(readFrontMatter(owner, page), first);
  fs.writeFileSync(file, '---\ntitle: Updated\n---\nBody');
  assert.equal(readFrontMatter(owner, page).title, 'Updated');
  fs.unlinkSync(file);
  assert.equal(readFrontMatter(owner, page), null);
});

test('Front Matter 读取与 Hexo 宿主一致地规范化 BOM 与 CRLF', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'stellar-source-eol-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const owner = { source_dir: directory };
  const lf = { source: 'lf.md' };
  const crlf = { source: 'crlf.md' };
  fs.writeFileSync(path.join(directory, lf.source), '---\ntitle: Hello\nlayout: wiki\n---\nBody\n');
  fs.writeFileSync(path.join(directory, crlf.source), '\uFEFF---\r\ntitle: Hello\r\nlayout: wiki\r\n---\r\nBody\r\n');
  const expected = readFrontMatter(owner, lf);
  assert.equal(expected.title, 'Hello');
  assert.deepEqual(readFrontMatter(owner, crlf), expected);
});
