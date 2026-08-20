#!/usr/bin/env node
'use strict';

/**
 * Stellar 发版脚本（Node 实现）
 *
 * 职责：
 *   1. 解析版本号与参数（--dry-run / --yes / --help）
 *   2. 校验版本号格式、当前分支、工作区状态
 *   3. 校验 CHANGELOG.md 已包含该版本非空章节（内容由 AI/人工提前准备），否则终止
 *   4. 准备 _config.yml、package.json 与安装知识库的最终版本内容
 *   5. 在最终待提交状态执行质量检查
 *   6. 输出变更摘要与 diff，正式模式执行前二次确认
 *   7. dry-run、取消或质量检查失败时从内存恢复文件，不依赖 git checkout --
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
const CHANGELOG_FILE = "CHANGELOG.md";
const INSTALLATION_FILE = "docs/knowledge/00-总览与安装配置/installation.md";
const WORKSPACE_ALLOWED_FILES = new Set(["_config.yml", "package.json", CHANGELOG_FILE]);
const MANAGED_FILES = ["_config.yml", "package.json", CHANGELOG_FILE, INSTALLATION_FILE];
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
    '说明:',
    '  CHANGELOG.md 需提前包含 `## <version>` 非空章节（由 AI/人工准备），脚本只做非空校验',
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
  const extra = changed.filter((file) => !WORKSPACE_ALLOWED_FILES.has(file));
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

function updatedConfigYml(raw, previousVersion, version) {
  const lines = raw.split('\n');
  const stellarIdx = lines.findIndex((line) => /^stellar:\s*$/.test(line));
  if (stellarIdx === -1) {
    throw new Error("未在 _config.yml 中找到 stellar: 配置块");
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
    throw new Error("未在 stellar: 配置块中找到 version 字段");
  }
  const current = lines[versionIdx].match(/^\s+version:\s*['"]?([^'"\s#]+)/);
  if (current === null || current[1] !== previousVersion) {
    throw new Error(`_config.yml 的主题版本与 package.json 不一致（预期 ${previousVersion}）`);
  }
  lines[versionIdx] = lines[versionIdx].replace(/^(\s*version:).*$/, `$1 '${version}'`);
  return lines.join('\n');
}

function packageVersion(raw) {
  let pkg;
  try {
    pkg = JSON.parse(raw);
  } catch (_) {
    throw new Error("package.json 解析失败，请检查文件格式");
  }
  if (typeof pkg.version !== "string" || !VERSION_RE.test(pkg.version)) {
    throw new Error("package.json 缺少有效的 version 字段");
  }
  return pkg.version;
}

function updatedPackageJson(raw, previousVersion, version) {
  if (packageVersion(raw) !== previousVersion) {
    throw new Error(`package.json 的主题版本在准备过程中发生变化（预期 ${previousVersion}）`);
  }
  const lines = raw.split('\n');
  const idx = lines.findIndex((line) => /^\s*"version"\s*:/.test(line));
  if (idx === -1) {
    throw new Error("未在 package.json 中找到 version 字段");
  }
  const updatedLine = lines[idx].replace(
    /^(\s*"version"\s*:\s*)"[^"]*"(\s*,?\s*)$/,
    `$1"${version}"$2`
  );
  if (updatedLine === lines[idx] && previousVersion !== version) {
    throw new Error("package.json 的 version 字段格式无法安全更新");
  }
  lines[idx] = updatedLine;
  return lines.join('\n');
}

function updatedInstallation(raw, previousVersion, version) {
  const knowledgeReplacements = raw.split(previousVersion).length - 1;
  if (knowledgeReplacements === 0) {
    throw new Error(`安装知识库中未找到当前主题版本 ${previousVersion}`);
  }
  return {
    content: raw.split(previousVersion).join(version),
    knowledgeReplacements,
  };
}

function prepareVersionFiles(root, version) {
  if (!VERSION_RE.test(version)) {
    throw new Error(`版本号格式不正确: ${version}`);
  }
  const configPath = path.join(root, "_config.yml");
  const packagePath = path.join(root, "package.json");
  const installationPath = path.join(root, INSTALLATION_FILE);
  const configRaw = fs.readFileSync(configPath, "utf8");
  const packageRaw = fs.readFileSync(packagePath, "utf8");
  const installationRaw = fs.readFileSync(installationPath, "utf8");
  const previousVersion = packageVersion(packageRaw);
  const configContent = updatedConfigYml(configRaw, previousVersion, version);
  const packageContent = updatedPackageJson(packageRaw, previousVersion, version);
  const installation = updatedInstallation(installationRaw, previousVersion, version);

  const updates = new Map([
    [configPath, configContent],
    [packagePath, packageContent],
    [installationPath, installation.content],
  ]);
  for (const [file, content] of updates) {
    fs.writeFileSync(file, content);
  }
  return {
    previousVersion,
    knowledgeReplacements: installation.knowledgeReplacements,
  };
}

function extractVersionSection(text, version) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${version}`);
  if (start === -1) {
    return null;
  }
  const body = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i].trim())) {
      break;
    }
    body.push(lines[i]);
  }
  return body.join('\n').trim();
}

function hasNonEmptyChangelogSection(text, version) {
  const section = extractVersionSection(text, version);
  if (section === null || section === '') {
    return false;
  }
  return section
    .split('\n')
    .map((line) => line.trim())
    .some((line) => line !== '' && !line.startsWith('> 发布日期：'));
}

function backupFiles(root = ROOT) {
  const backups = new Map();
  for (const file of MANAGED_FILES) {
    const full = path.join(root, file);
    backups.set(file, fs.existsSync(full) ? fs.readFileSync(full) : null);
  }
  return backups;
}

function restoreFiles(backups, root = ROOT) {
  for (const [file, content] of backups) {
    const full = path.join(root, file);
    if (content === null) {
      if (fs.existsSync(full)) {
        fs.unlinkSync(full);
      }
    } else {
      fs.writeFileSync(full, content);
    }
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

function runPreflightCheck() {
  console.log('\n>>> 执行发版前质量检查: npm run check（lint + 单测 + 知识库核查）');
  try {
    execFileSync('npm', ['run', 'check'], { cwd: ROOT, stdio: 'inherit' });
  } catch (_) {
    throw new Error('质量检查未通过（lint / 单测 / 知识库核查），已终止发版，请修复后再试');
  }
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
    const changelogPath = path.join(ROOT, CHANGELOG_FILE);
    const changelogText = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';
    if (!hasNonEmptyChangelogSection(changelogText, version)) {
      throw new Error(`CHANGELOG.md 中缺少版本 ${version} 的非空章节，已终止发版（请先由 AI/人工补充该章节）`);
    }
    const prepared = prepareVersionFiles(ROOT, version);
    console.log(
      `>>> 已同步主题版本: ${prepared.previousVersion} → ${version}` +
        `（安装知识库 ${prepared.knowledgeReplacements} 处）`
    );

    runPreflightCheck();

    console.log('>>> 文件变更:');
    runGit(['diff', '--stat'], { stdio: 'inherit' });
    const diff = runGit(['diff', '--', ...MANAGED_FILES]);
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

    console.log(`>>> git add ${MANAGED_FILES.join(' ')}`);
    runGit(['add', '--', ...MANAGED_FILES], { stdio: 'inherit' });
    console.log(`>>> git commit -m "release: ${version}"`);
    runGit(['commit', '-m', `release: ${version}`], { stdio: 'inherit' });
    console.log('>>> git push origin main');
    runGit(['push', 'origin', 'main'], { stdio: 'inherit' });
    console.log('>>> git push origin main:npm');
    runGit(['push', 'origin', 'main:npm'], { stdio: 'inherit' });

    console.log('\n>>> 版本号与 CHANGELOG 已更新，已推送到 main 和 npm 分支');
    console.log('>>> npm-publish workflow 已自动触发，将完成 npm publish、tag 与 GitHub Release');
    console.log(`>>> 查看进度: ${WORKFLOW_URL}`);
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

if (require.main === module) {
  main().catch((err) => {
    console.error(`\n执行中断: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  extractVersionSection,
  hasNonEmptyChangelogSection,
  prepareVersionFiles,
};
