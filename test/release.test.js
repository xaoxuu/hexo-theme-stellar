'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  extractVersionSection,
  hasNonEmptyChangelogSection,
  prepareVersionFiles,
} = require('../release.js');

function createVersionFixture(t, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'stellar-release-'));
  const knowledgeDir = path.join(root, 'docs/knowledge/00-总览与安装配置');
  fs.mkdirSync(knowledgeDir, { recursive: true });
  const files = {
    config: path.join(root, '_config.yml'),
    package: path.join(root, 'package.json'),
    knowledge: path.join(knowledgeDir, 'installation.md'),
  };
  fs.writeFileSync(files.config, options.config || "stellar:\n  version: '1.42.1'\n  homepage: https://example.com/\n");
  fs.writeFileSync(files.package, options.package || '{\n  "name": "hexo-theme-stellar",\n  "version": "1.42.1"\n}\n');
  fs.writeFileSync(
    files.knowledge,
    options.knowledge || 'Version: 1.42.1\nHexo: 8.1.2\nnpm install hexo-theme-stellar@1.42.1\n'
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, files };
}

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

test('prepareVersionFiles 同步全部主题版本引用并保留无关版本', (t) => {
  const { root, files } = createVersionFixture(t);

  const result = prepareVersionFiles(root, '1.43.0');

  assert.equal(result.previousVersion, '1.42.1');
  assert.equal(result.knowledgeReplacements, 2);
  assert.match(fs.readFileSync(files.config, 'utf8'), /version: '1\.43\.0'/);
  assert.equal(JSON.parse(fs.readFileSync(files.package, 'utf8')).version, '1.43.0');
  const knowledge = fs.readFileSync(files.knowledge, 'utf8');
  assert.equal(knowledge.includes('1.42.1'), false);
  assert.equal(knowledge.match(/1\.43\.0/g).length, 2);
  assert.match(knowledge, /Hexo: 8\.1\.2/);
});

test('prepareVersionFiles 缺失预期旧版本时拒绝且不产生部分写入', (t) => {
  const { root, files } = createVersionFixture(t, {
    knowledge: 'Version: 1.42.0\nHexo: 8.1.2\n',
  });
  const before = Object.fromEntries(
    Object.entries(files).map(([name, file]) => [name, fs.readFileSync(file)])
  );

  assert.throws(
    () => prepareVersionFiles(root, '1.43.0'),
    /安装知识库中未找到当前主题版本 1\.42\.1/
  );
  for (const [name, file] of Object.entries(files)) {
    assert.deepEqual(fs.readFileSync(file), before[name]);
  }
});
