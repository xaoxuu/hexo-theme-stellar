#!/usr/bin/env node
'use strict';

/**
 * test/ 依赖声明检查（零依赖，CI 使用）
 *
 * 用法:
 *   node ci/check-require-decls.js          # 检查 test/ 是否存在幽灵依赖
 *
 * 幽灵依赖：require 了未在 package.json 声明的包。本地开发时 Node 可能向上
 * 提升解析到主工程 node_modules，导致本地通过而 CI（npm ci 干净安装）失败。
 * test/ 只允许引用 package.json 已声明的依赖或 Node 内置模块。
 */

const fs = require('fs');
const path = require('path');
const { builtinModules } = require('module');

const ROOT = path.join(__dirname, '..');
const TEST_DIR = path.join(ROOT, 'test');

function declaredDeps() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  return new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ]);
}

function stripComments(src) {
  src = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
  return src
    .split('\n')
    .map(function(line) {
      var inStr = null;
      for (var i = 0; i < line.length - 1; i++) {
        var ch = line[i];
        if (inStr) {
          if (ch === '\\') {
            i++;
            continue;
          }
          if (ch === inStr) {
            inStr = null;
          }
          continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
          inStr = ch;
          continue;
        }
        if (ch === '/' && line[i + 1] === '/') {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join('\n');
}

function extractBareSpecifiers(src) {
  const specifiers = new Set();
  const re = /require(?:\.resolve)?\(\s*["']([^"']+)["']\s*\)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    specifiers.add(m[1]);
  }
  return specifiers;
}

function scanFile(file, declared, problems) {
  const src = fs.readFileSync(file, 'utf8');
  for (const spec of extractBareSpecifiers(stripComments(src))) {
    if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('node:')) {
      continue;
    }
    if (builtinModules.includes(spec)) {
      continue;
    }
    if (declared.has(spec)) {
      continue;
    }
    problems.push(`${path.relative(ROOT, file)}: require('${spec}') 未在 package.json 声明`);
  }
}

function scanDir(dir, declared, problems) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(full, declared, problems);
    } else if (entry.name.endsWith('.js')) {
      scanFile(full, declared, problems);
    }
  }
}

function main() {
  const declared = declaredDeps();
  const problems = [];
  if (fs.existsSync(TEST_DIR)) {
    scanDir(TEST_DIR, declared, problems);
  }
  if (problems.length > 0) {
    console.error('幽灵依赖检查未通过（test/ 只能引用 package.json 已声明依赖或 Node 内置模块）：');
    for (const p of problems) {
      console.error(`  ${p}`);
    }
    process.exit(1);
  }
  console.log('依赖声明检查通过：test/ 未发现幽灵依赖。');
}

main();
