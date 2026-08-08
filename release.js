#!/usr/bin/env node
'use strict';

/**
 * Stellar 发版脚本（Node 实现）
 *
 * 职责：
 *   1. 解析版本号与参数（--dry-run / --yes / --help）
 *   2. 校验版本号格式、当前分支、工作区状态
 *   3. 更新 _config.yml（stellar.version）与 package.json（version）
 *   4. 输出变更摘要与 diff，正式模式执行前二次确认
 *   5. dry-run 或取消时从内存恢复文件，不依赖 git checkout --
 *
 * 说明：不放在 scripts/ 目录，因为主题的 scripts/ 是 Hexo 运行时插件目录，
 * 会被所有使用该主题的站点在构建时加载执行。
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const VERSION_RE = /^\d+\.\d+\.\d+(-rc\.\d+)?$/;
const ALLOWED_FILES = new Set(['_config.yml', 'package.json']);
const WORKFLOW_URL = 'https://github.com/xaoxuu/hexo-theme-stellar/actions/workflows/npm-publish.yml';

function usage() {
  return [
    'Stellar 发版脚本',
    '',
    '用法:',
    '  npm run release                   # 交互式：提示输入版本号，提交前二次确认',
    '  npm run release -- <version>      # 显式指定版本号',
    '  npm run release:dry -- <version>  # 预演：写入后自动恢复，不提交/推送',
    '',
    '选项:',
    '  -n, --dry-run  预演模式，不执行提交与推送',
    '  -y, --yes      跳过二次确认（非交互环境必须显式传入）',
    '  -h, --help     显示帮助',
  ].join('\n');
}

function fail(message) {
  console.error(`错误: ${message}`);
  process.exit(1);
}

function runGit(args, opts = {}) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: opts.stdio || 'pipe',
    });
  } catch (err) {
    if (opts.stdio === 'inherit') {
      process.exit(1);
    }
    const detail = (err.stderr && err.stderr.trim()) || err.message;
    fail(detail || `git ${args.join(' ')} 执行失败`);
  }
}

function gitTry(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (_) {
    return null;
  }
}

function currentBranch() {
  return runGit(['rev-parse', '--abbrev-ref', 'HEAD']).trim().split('\n')[0];
}

function checkWorkspace() {
  const changed = runGit(['diff', '--name-only', 'HEAD'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const extra = changed.filter((file) => !ALLOWED_FILES.has(file));
  if (extra.length > 0) {
    fail(
      '工作区存在无关改动（含已暂存与未暂存），请先提交或暂存后再发版：\n' +
        extra.map((file) => `  ${file}`).join('\n')
    );
  }
}

function changeSummary() {
  const lastTag = gitTry(['describe', '--tags', '--abbrev=0']);
  if (lastTag) {
    const log = gitTry(['log', '--oneline', `${lastTag}..HEAD`]);
    return log ? log : '(自上一个 tag 以来无新提交)';
  }
  const log = gitTry(['log', '--oneline', '-10']);
  return log ? `(未找到 tag，展示最近 10 条提交)\n${log}` : '(无法获取提交记录)';
}

function updateConfigYml(version) {
  const file = path.join(ROOT, '_config.yml');
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const stellarIdx = lines.findIndex((line) => /^stellar:\s*$/.test(line));
  if (stellarIdx === -1) {
    fail('未在 _config.yml 中找到 stellar: 配置块');
  }
  let versionIdx = -1;
  for (let i = stellarIdx + 1; i < lines.length; i++) {
    if (/^\S/.test(lines[i])) {
      break; // 已越过 stellar 配置块
    }
    if (/^\s+version:/.test(lines[i])) {
      versionIdx = i;
      break;
    }
  }
  if (versionIdx === -1) {
    fail('未在 stellar: 配置块中找到 version 字段');
  }
  lines[versionIdx] = lines[versionIdx].replace(/^(\s*version:).*$/, `$1 '${version}'`);
  fs.writeFileSync(file, lines.join('\n'));
}

function updatePackageJson(version) {
  const file = path.join(ROOT, 'package.json');
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
    JSON.parse(raw);
  } catch (_) {
    fail('package.json 解析失败，请检查文件格式');
  }
  const lines = raw.split('\n');
  const idx = lines.findIndex((line) => /^\s*"version"\s*:/.test(line));
  if (idx === -1) {
    fail('未在 package.json 中找到 version 字段');
  }
  lines[idx] = lines[idx].replace(/^(\s*"version"\s*:\s*).*$/, `$1"${version}",`);
  fs.writeFileSync(file, lines.join('\n'));
}

function backupFiles() {
  const backups = new Map();
  for (const file of ALLOWED_FILES) {
    backups.set(file, fs.readFileSync(path.join(ROOT, file)));
  }
  return backups;
}

function restoreFiles(backups) {
  for (const [file, content] of backups) {
    fs.writeFileSync(path.join(ROOT, file), content);
  }
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function askInput(question) {
  return ask(question).then((answer) => answer.trim());
}

function askConfirm(question) {
  return ask(question).then((answer) => /^\s*(y|yes)\s*$/i.test(answer));
}

async function main() {
  process.chdir(ROOT);

  let version = null;
  let dryRun = false;
  let yes = false;

  for (const arg of process.argv.slice(2)) {
    switch (arg) {
      case '--dry-run':
      case '-n':
        dryRun = true;
        break;
      case '--yes':
      case '-y':
        yes = true;
        break;
      case '--help':
      case '-h':
        console.log(usage());
        return;
      default:
        if (arg.startsWith('-')) {
          fail(`未知选项: ${arg}\n\n${usage()}`);
        }
        if (version !== null) {
          fail(`只能指定一个版本号: ${arg}`);
        }
        version = arg;
    }
  }

  if (version === null) {
    if (process.stdin.isTTY) {
      version = await askInput('请输入要发布的版本号: ');
      if (!version) {
        fail('未输入版本号');
      }
    } else {
      fail('缺少版本号。非交互环境请显式传入：npm run release -- <version>（如需跳过确认再加 --yes）');
    }
  }

  if (!VERSION_RE.test(version)) {
    fail(`版本号格式不正确: ${version}（应为 x.y.z 或 x.y.z-rc.n）`);
  }

  const branch = currentBranch();
  if (branch !== 'main') {
    fail(`当前分支为 ${branch}，发版必须在 main 分支执行`);
  }
  checkWorkspace();

  if (!dryRun && !yes && !process.stdin.isTTY) {
    fail('非交互环境必须显式传入 --yes 以确认发布');
  }

  console.log(`>>> 发布版本: ${version}`);
  console.log(`>>> 模式: ${dryRun ? 'dry-run' : '正式'}`);

  const summary = changeSummary();
  if (summary) {
    console.log(`\n>>> 变更摘要:\n${summary}\n`);
  }

  const backups = backupFiles();

  try {
    updateConfigYml(version);
    updatePackageJson(version);

    console.log('>>> 文件变更:');
    runGit(['diff', '--stat'], { stdio: 'inherit' });
    const diff = runGit(['diff', '--', '_config.yml', 'package.json']);
    if (diff) {
      console.log(diff);
    }
    console.log('');

    if (!dryRun && !yes) {
      const confirmed = await askConfirm(
        `确认发布版本 ${version} 并推送到 main/npm 分支？输入 y 继续，其他任意键取消: `
      );
      if (!confirmed) {
        restoreFiles(backups);
        console.log('已取消，未提交任何改动，文件已恢复。');
        return;
      }
    }

    if (dryRun) {
      console.log('>>> [DRY RUN] 跳过提交和推送，恢复文件...');
      restoreFiles(backups);
      console.log('>>> 已恢复，工作区与执行前一致。');
      return;
    }

    console.log('>>> git add _config.yml package.json');
    runGit(['add', '--', '_config.yml', 'package.json'], { stdio: 'inherit' });
    console.log(`>>> git commit -m "release: ${version}"`);
    runGit(['commit', '-m', `release: ${version}`], { stdio: 'inherit' });
    console.log('>>> git push origin main');
    runGit(['push', 'origin', 'main'], { stdio: 'inherit' });
    console.log('>>> git push origin main:npm');
    runGit(['push', 'origin', 'main:npm'], { stdio: 'inherit' });

    console.log('\n>>> 版本号已更新并推送到 main 和 npm 分支');
    console.log(`>>> 请手动触发 Actions: ${WORKFLOW_URL}`);
  } catch (err) {
    try {
      restoreFiles(backups);
    } catch (_) {
      // 忽略恢复失败，保留原始错误
    }
    console.error(`\n执行中断: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\n执行中断: ${err.message}`);
  process.exit(1);
});
