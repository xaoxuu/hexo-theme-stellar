#!/usr/bin/env node
'use strict';

/**
 * stellar-theme-dev skill 镜像同步与检查（零依赖，CI 使用）
 *
 * 用法:
 *   node ci/check-skill-sync.js          # sync：canonical 复制到 Claude Code 镜像
 *   node ci/check-skill-sync.js --check  # check：两副本不一致时退出非 0
 *
 * canonical: .agents/skills/stellar-theme-dev/SKILL.md（Codex）
 * mirror:    .claude/skills/stellar-theme-dev/SKILL.md（Claude Code）
 *
 * 两个环境的技能格式相同（SKILL.md + name/description frontmatter），
 * 正文必须逐字节一致；修改 canonical 后运行 sync，CI 用 --check 强制同步。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CANONICAL = path.join(ROOT, '.agents/skills/stellar-theme-dev/SKILL.md');
const MIRROR = path.join(ROOT, '.claude/skills/stellar-theme-dev/SKILL.md');

function sync() {
  fs.mkdirSync(path.dirname(MIRROR), { recursive: true });
  fs.copyFileSync(CANONICAL, MIRROR);
  console.log(`已同步: ${path.relative(ROOT, CANONICAL)} -> ${path.relative(ROOT, MIRROR)}`);
}

function check() {
  if (!fs.existsSync(CANONICAL) || !fs.existsSync(MIRROR)) {
    console.error(`文件缺失: canonical=${fs.existsSync(CANONICAL)} mirror=${fs.existsSync(MIRROR)}`);
    console.error('请先运行: node ci/check-skill-sync.js');
    process.exit(1);
  }
  const canonical = fs.readFileSync(CANONICAL);
  const mirror = fs.readFileSync(MIRROR);
  if (!canonical.equals(mirror)) {
    console.error('skill 镜像与 canonical 不一致，请先运行: node ci/check-skill-sync.js');
    process.exit(1);
  }
  console.log('skill 镜像检查通过（与 canonical 一致）。');
}

function main() {
  if (process.argv[2] === '--check') {
    check();
  } else {
    sync();
  }
}

main();
