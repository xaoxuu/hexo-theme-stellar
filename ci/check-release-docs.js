#!/usr/bin/env node
'use strict';

/**
 * 发版前提交登记完整性检查（零依赖，随 npm run check 执行）
 *
 * 规则：自上一 tag 以来**涉及主题代码/配置/行为变化**的每个非合并提交
 * （改动 `layout/`、`scripts/`、`source/`、`languages/`、`_data/`、`_config.yml`）
 * 的 7 位短 SHA 都必须出现在 docs/knowledge/VERIFICATION.md 的
 * 「八、提交登记（发版前核对）」表格中；纯文档 / CI / 工具改动无需登记。
 * 缺失时以非 0 退出并列出缺失提交，阻断发版（release.js 的 runPreflightCheck
 * 会执行 npm run check）。
 *
 * 用法：
 *   node ci/check-release-docs.js
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const VERIFICATION = path.join(ROOT, 'docs', 'knowledge', 'VERIFICATION.md');
const SECTION = '## 八、提交登记（发版前核对）';
// 主题运行时代码/配置路径：改动这些路径的提交必须登记
const BEHAVIOR_ROOTS = ['layout/', 'scripts/', 'source/', 'languages/', '_data/'];
const BEHAVIOR_EXACT = '_config.yml';

function runGit(args) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
  } catch (err) {
    const detail = (err.stderr && err.stderr.trim()) || err.message;
    console.error(`git ${args.join(' ')} 执行失败: ${detail}`);
    process.exit(1);
  }
}

function lastTag() {
  try {
    return execFileSync('git', ['describe', '--tags', '--abbrev=0'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
  } catch (_) {
    return null;
  }
}

function commitShasSince(tag) {
  const out = runGit(['log', '--format=%h', '--no-merges', `${tag}..HEAD`]);
  return out ? out.split('\n').filter(Boolean) : [];
}

function touchesBehaviorFiles(sha) {
  const out = runGit(['diff-tree', '--no-commit-id', '--name-only', '-r', sha]);
  if (!out) {
    return false;
  }
  return out.split('\n').some((file) => {
    const f = file.trim();
    return f === BEHAVIOR_EXACT || BEHAVIOR_ROOTS.some((root) => f.startsWith(root));
  });
}

function behaviorShasSince(tag) {
  return commitShasSince(tag).filter(touchesBehaviorFiles);
}

function registeredShas() {
  if (!fs.existsSync(VERIFICATION)) {
    console.error(`文件缺失: ${VERIFICATION}`);
    process.exit(1);
  }
  const text = fs.readFileSync(VERIFICATION, 'utf8');
  const start = text.indexOf(SECTION);
  if (start === -1) {
    console.error(`VERIFICATION.md 缺少「${SECTION}」章节`);
    process.exit(1);
  }
  const after = text.slice(start);
  const end = after.indexOf('\n## ', SECTION.length);
  const body = end === -1 ? after : after.slice(0, end);
  const shas = new Set();
  for (const line of body.split('\n')) {
    const m = line.match(/^\|\s*`?([0-9a-f]{7,40})`?\s*\|/i);
    if (m) {
      shas.add(m[1].toLowerCase());
    }
  }
  return shas;
}

function main() {
  const tag = lastTag();
  if (tag === null) {
    console.log('提交登记完整性检查：仓库无 tag，跳过（无法确定核对范围）。');
    return;
  }
  const shas = behaviorShasSince(tag);
  if (shas.length === 0) {
    console.log(`提交登记完整性检查通过（自 ${tag} 以来无涉及主题行为的新提交）。`);
    return;
  }
  const registered = registeredShas();
  const missing = shas.filter((sha) => !registered.has(sha.toLowerCase()));
  if (missing.length > 0) {
    console.error(`提交登记完整性检查失败（自 ${tag} 以来涉及主题行为的 ${shas.length} 个提交中 ${missing.length} 个未登记）:`);
    for (const sha of missing) {
      console.error(`  - ${sha}`);
    }
    console.error(`请在 docs/knowledge/VERIFICATION.md「${SECTION}」补登后重跑。`);
    process.exit(1);
  }
  console.log(`提交登记完整性检查通过（自 ${tag} 以来 ${shas.length} 个涉及主题行为的提交均已登记）。`);
}

main();
