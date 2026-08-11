#!/usr/bin/env node
'use strict';

/**
 * PR 提交信息规范检查（零依赖，CI 使用）
 *
 * 用法:
 *   node ci/check-commit-msg.js [base-ref] [head-ref]
 *
 * 默认范围: origin/main..HEAD；CI 中显式传入
 * github.event.pull_request.base.sha / head.sha，避免把 PR 合并提交计入。
 *
 * 校验规则：Conventional Commits，type ∈ feat|fix|refactor|perf|style|docs|chore|content|release
 */

const { execFileSync } = require('child_process');

const BASE = process.argv[2] || 'origin/main';
const HEAD = process.argv[3] || 'HEAD';
const SUBJECT_RE = /^(feat|fix|refactor|perf|style|docs|chore|content|release)(\([a-z0-9-]+\))?(!)?: .+$/;

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function main() {
  let subjects;
  try {
    subjects = git(['log', '--format=%s', `${BASE}..${HEAD}`])
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((s) => !/^(Merge|Revert)\s/.test(s));
  } catch (err) {
    console.error(`无法获取 ${BASE}..${HEAD} 的提交记录: ${err.message}`);
    process.exit(1);
  }

  if (subjects.length === 0) {
    console.log('范围内无新增提交，提交信息检查通过。');
    return;
  }

  const bad = subjects.filter((s) => !SUBJECT_RE.test(s));
  if (bad.length > 0) {
    console.error(`以下提交不符合 Conventional Commits 规范（${bad.length}/${subjects.length}）:`);
    for (const s of bad) {
      console.error(`  - ${s}`);
    }
    console.error('格式: <type>(<scope>): <description>');
    console.error('type ∈ feat|fix|refactor|perf|style|docs|chore|content|release');
    process.exit(1);
  }

  console.log(`提交信息检查通过（${subjects.length} 条）。`);
}

main();
