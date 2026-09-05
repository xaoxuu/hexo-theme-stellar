#!/usr/bin/env node
/* global hexo */
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");
const { spawnSync } = require("node:child_process");
const { INSTALL_PACKAGES } = require("./check-package-integration");

const THEME_ROOT = path.resolve(__dirname, "..");
const BASELINE_TAG = "1.44.0";
const MIN_REDUCTION = 0.3;

function run(command, args, cwd, env = {}) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", env: { ...process.env, HEXO_READY: "", ...env } });
  if (result.status !== 0) {
    process.stderr.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
  return result.stdout;
}

function write(root, relative, content) {
  const output = path.join(root, relative);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, content, "utf8");
}

function installRuntime(root, currentArchive) {
  const runtimeRoot = path.join(root, "runtime");
  write(runtimeRoot, "package.json", `${JSON.stringify({ private: true }, null, 2)}\n`);
  run("npm", [
    "install",
    "--no-audit",
    "--no-fund",
    "--prefer-offline",
    "--package-lock=false",
    ...INSTALL_PACKAGES,
    currentArchive
  ], runtimeRoot, { npm_config_cache: path.join(root, "npm-cache") });
  return runtimeRoot;
}

function createSite(root, themeRoot, runtimeRoot) {
  const hostHexoVersion = require(path.join(runtimeRoot, "node_modules", "hexo", "package.json")).version;
  const generatorVersion = require(path.join(runtimeRoot, "node_modules", "hexo-generator-index", "package.json")).version;
  const rendererVersion = require(path.join(runtimeRoot, "node_modules", "hexo-renderer-marked", "package.json")).version;
  write(root, "package.json", `${JSON.stringify({
    private: true,
    hexo: { version: hostHexoVersion },
    dependencies: {
      hexo: hostHexoVersion,
      "hexo-generator-index": generatorVersion,
      "hexo-renderer-marked": rendererVersion
    }
  }, null, 2)}\n`);
  write(root, "_config.yml", [
    "title: Stellar Core Performance",
    "author: Stellar",
    "language: zh-CN",
    "url: https://example.com",
    "root: /",
    "permalink: blog/:year/:month/:day/:title/",
    "theme: stellar",
    ""
  ].join("\n"));
  write(root, "source/_posts/core.md", [
    "---",
    "title: Core Performance",
    "date: 2026-08-23 08:00",
    "description: Fixed first-screen JavaScript fixture.",
    "---",
    "",
    "Core performance fixture.",
    ""
  ].join("\n"));
  fs.mkdirSync(path.join(root, "themes"), { recursive: true });
  fs.symlinkSync(path.join(runtimeRoot, "node_modules"), path.join(root, "node_modules"), "dir");
  fs.symlinkSync(themeRoot, path.join(root, "themes", "stellar"), "dir");
  const output = run(path.join(runtimeRoot, "node_modules", ".bin", "hexo"), ["--cwd", root, "generate"], runtimeRoot, {
    NODE_PATH: path.join(runtimeRoot, "node_modules")
  });
  if (!fs.existsSync(path.join(root, "public", "index.html"))) {
    throw new Error(`hexo generate 未生成首页:\n${output}`);
  }
}

function gzipBytes(content) {
  return zlib.gzipSync(content, { level: 9 }).length;
}

function localScriptSource(attributes) {
  const match = attributes.match(/\bsrc=(?:"([^"]+)"|'([^']+)')/i);
  if (!match) return null;
  const source = match[1] || match[2];
  if (/^(?:https?:)?\/\//.test(source) || source.startsWith("data:")) return null;
  return source.split(/[?#]/, 1)[0];
}

function moduleImports(content) {
  const imports = new Set();
  const staticPattern = /(?:from\s+|import\s*)["'](\.\.?\/[^"']+\.js)["']/g;
  for (const match of content.matchAll(staticPattern)) imports.add(match[1]);
  return [...imports];
}

function collectCoreScripts(publicRoot, htmlFile) {
  const html = fs.readFileSync(htmlFile, "utf8");
  const resources = new Map();
  let inlineIndex = 0;

  function addFile(urlPath, file) {
    const key = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
    if (resources.has(key)) return;
    const content = fs.readFileSync(file);
    resources.set(key, { path: key, bytes: content.length, gzipBytes: gzipBytes(content) });
    if (key.startsWith("/js/runtime/") && file.endsWith(".js")) {
      for (const child of moduleImports(content.toString("utf8"))) {
        const childFile = path.resolve(path.dirname(file), child);
        const childUrl = path.posix.resolve(path.posix.dirname(key), child);
        addFile(childUrl, childFile);
      }
    }
  }

  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1];
    const source = localScriptSource(attributes);
    if (source) {
      addFile(source, path.join(publicRoot, source.replace(/^\/+/, "")));
      continue;
    }
    if (/\btype=(?:"|')(?:application\/json|application\/ld\+json)(?:"|')/i.test(attributes)) continue;
    if (match[2].trim() === "") continue;
    inlineIndex += 1;
    const content = Buffer.from(match[2], "utf8");
    const key = `inline:${inlineIndex}`;
    resources.set(key, { path: key, bytes: content.length, gzipBytes: gzipBytes(content) });
  }
  const files = [...resources.values()].sort((a, b) => a.path.localeCompare(b.path));
  return {
    files,
    bytes: files.reduce((sum, file) => sum + file.bytes, 0),
    gzipBytes: files.reduce((sum, file) => sum + file.gzipBytes, 0)
  };
}

function extractBaseline(root) {
  const archive = path.join(root, "baseline.tar");
  const theme = path.join(root, "theme-baseline");
  fs.mkdirSync(theme, { recursive: true });
  run("git", ["archive", "--format=tar", `--output=${archive}`, BASELINE_TAG], THEME_ROOT);
  run("tar", ["-xf", archive, "-C", theme], THEME_ROOT);
  return theme;
}

function extractCurrentTarball(root) {
  const packOutput = run("npm", ["pack", "--json", "--pack-destination", root], THEME_ROOT, {
    npm_config_cache: path.join(root, "npm-cache")
  });
  const packs = JSON.parse(packOutput);
  if (!Array.isArray(packs) || packs.length !== 1) throw new Error("npm pack did not return one package");
  const archive = path.join(root, packs[0].filename);
  const theme = path.join(root, "theme-current");
  fs.mkdirSync(theme, { recursive: true });
  run("tar", ["-xf", archive, "-C", theme, "--strip-components=1"], THEME_ROOT);
  return { archive, theme };
}

function buildReport() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-performance-"));
  try {
    const baselineTheme = extractBaseline(root);
    const current = extractCurrentTarball(root);
    const runtimeRoot = installRuntime(root, current.archive);
    const baselineSite = path.join(root, "site-baseline");
    const currentSite = path.join(root, "site-current");
    createSite(baselineSite, baselineTheme, runtimeRoot);
    createSite(currentSite, current.theme, runtimeRoot);
    const baseline = collectCoreScripts(path.join(baselineSite, "public"), path.join(baselineSite, "public", "index.html"));
    const currentScripts = collectCoreScripts(path.join(currentSite, "public"), path.join(currentSite, "public", "index.html"));
    const reduction = (baseline.gzipBytes - currentScripts.gzipBytes) / baseline.gzipBytes;
    return {
      schemaVersion: 1,
      baseline: { tag: BASELINE_TAG, ...baseline },
      current: { version: require(path.join(THEME_ROOT, "package.json")).version, ...currentScripts },
      metric: "sum of gzip-9 bytes for unconditional local first-screen scripts, inline executable scripts, and unconditional module imports",
      minimumReduction: MIN_REDUCTION,
      reduction: Number(reduction.toFixed(6)),
      passed: reduction >= MIN_REDUCTION
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function main() {
  const report = buildReport();
  const output = `${JSON.stringify(report, null, 2)}\n`;
  process.stdout.write(output);
  if (!report.passed) {
    throw new Error(`首屏核心 JS gzip 降幅 ${(report.reduction * 100).toFixed(2)}% 未达到 ${MIN_REDUCTION * 100}%`);
  }
}

if (require.main === module) main();

module.exports = {
  collectCoreScripts,
  moduleImports
};
