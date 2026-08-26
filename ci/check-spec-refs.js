#!/usr/bin/env node
'use strict';

/**
 * AI 规范引用一致性检查（零依赖，CI 使用）
 *
 * 校验对象（AGENTS.md 为唯一权威）：
 *   AGENTS.md、CLAUDE.md、.github/copilot-instructions.md、
 *   .agents/skills/stellar-theme-dev/SKILL.md（canonical）、CONTRIBUTING.md
 *
 * 1. 章节引用：`§N` 必须指向 AGENTS.md 中存在的章节号（防章节重排后引用失效）
 * 2. 门禁权威与指针：具体命令只在 AGENTS.md 维护，skill canonical 必须明确指向
 *    AGENTS.md §5 的 F0–F3 风险矩阵（防止重复规则漂移）
 * 3. 路径存在性：反引号路径命中仓库根前缀时必须真实存在。
 *    注意：存在性只能防拼写漂移，防不了「目录存在但语义错误」类问题
 *    （如小部件真实位置为 layout/_partial/widgets/），后者依赖知识库人工复核。
 *
 * 用法：
 *   node ci/check-spec-refs.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  '.github/copilot-instructions.md',
  '.agents/skills/stellar-theme-dev/SKILL.md',
  'CONTRIBUTING.md',
];

const AGENTS = 'AGENTS.md';
const SKILL = '.agents/skills/stellar-theme-dev/SKILL.md';

// AGENTS.md 独占具体门禁；Skill 只保留足以触发权威规则的上下文指针。
const AGENTS_GATE_PHRASES = [
  'npm run g',
  'npm run check',
  'npm run knowledge:check',
  '不自动提交',
  'docs/guides/tag-plugins-style-guide.md',
];
const SKILL_GATE_POINTERS = ['AGENTS.md', '§5', 'F0–F3'];

// 路径存在性检查的根前缀；其余反引号片段（目录碎片、主工程/demo 路径等）不检查
const PATH_ROOTS = [
  'layout/',
  'scripts/',
  'source/',
  'languages/',
  'test/',
  'ci/',
  '.github/',
  '.agents/',
  '.claude/',
  'docs/knowledge/',
  'docs/guides/',
  'docs/designs/',
];
const EXACT_FILES = ['package.json', 'CHANGELOG.md', '_config.yml'];

const errors = [];

function read(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`文件缺失: ${rel}`);
    return '';
  }
  return fs.readFileSync(abs, 'utf8');
}

function checkSections(contents) {
  const headings = new Set();
  for (const m of contents[AGENTS].matchAll(/^## (\d+)\./gm)) {
    headings.add(Number(m[1]));
  }
  if (headings.size === 0) {
    errors.push('AGENTS.md 未解析到章节标题（## N.）');
  }
  for (const rel of FILES) {
    const text = contents[rel];
    for (const m of text.matchAll(/§\s*(\d+)/g)) {
      const n = Number(m[1]);
      if (!headings.has(n)) {
        errors.push(`${rel}: 引用不存在的章节 §${n}`);
      }
    }
  }
}

function checkGateAuthority(contents) {
  for (const phrase of AGENTS_GATE_PHRASES) {
    if (!contents[AGENTS].includes(phrase)) {
      errors.push(`AGENTS.md 门禁短语缺失: ${phrase}`);
    }
  }
  for (const pointer of SKILL_GATE_POINTERS) {
    if (!contents[SKILL].includes(pointer)) {
      errors.push(`skill 权威指针缺失: ${pointer}`);
    }
  }
}

function checkPaths(contents) {
  for (const rel of FILES) {
    const text = contents[rel];
    for (const m of text.matchAll(/`([^`]+)`/g)) {
      const token = m[1];
      if (/[{}*?<>]/.test(token)) {
        continue; // 占位符 / 通配符不检查
      }
      const hit = PATH_ROOTS.find((r) => token.startsWith(r));
      const exact = EXACT_FILES.includes(token) ? token : null;
      if (hit === undefined && exact === null) {
        continue;
      }
      if (!fs.existsSync(path.join(ROOT, token))) {
        errors.push(`${rel}: 路径不存在: ${token}`);
      }
    }
  }
}

function main() {
  const contents = {};
  for (const rel of FILES) {
    contents[rel] = read(rel);
  }
  checkSections(contents);
  checkGateAuthority(contents);
  checkPaths(contents);
  if (errors.length > 0) {
    console.error('AI 规范引用检查失败:');
    for (const e of errors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }
  console.log('AI 规范引用检查通过（章节引用 / 门禁权威与指针 / 路径存在性）。');
}

main();
