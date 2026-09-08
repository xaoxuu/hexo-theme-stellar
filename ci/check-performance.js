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
const { load } = require("cheerio");

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
  ], runtimeRoot, { npm_config_cache: process.env.npm_config_cache || path.join(root, "npm-cache") });
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

function moduleImports(content, kind = "static") {
  const imports = new Set();
  const pattern = kind === "static"
    ? /(?:from\s+|import\s*)["'](\.\.?\/[^"']+\.js(?:\?[^"']*)?)["']/g
    : /import\s*\(\s*["'`](\.\.?\/[^"'`$]+\.js)(?:[^"'`]*)["'`]/g;
  for (const match of content.matchAll(pattern)) imports.add(match[1].split("?")[0]);
  return [...imports];
}

// Reachability is an inventory, not a claim about when conditional imports run.
function collectCoreScripts(publicRoot, htmlFile) {
  const html = fs.readFileSync(htmlFile, "utf8");
  const $ = load(html);
  const resources = new Map();
  const priority = { direct: 0, static: 1, dynamic: 2 };
  function local(value, base = "/") {
    if (typeof value !== "string" || /^(?:[a-z]+:|\/\/)/i.test(value)) return null;
    return path.posix.resolve(base, value.split(/[?#]/)[0]);
  }
  function add(url, group, type = "js") {
    if (!url) return;
    const previous = resources.get(url);
    if (previous && priority[previous.group] <= priority[group]) return;
    const file = path.join(publicRoot, url.replace(/^\/+/, ""));
    const content = fs.readFileSync(file);
    resources.set(url, { path: url, group, type, bytes: content.length, gzipBytes: gzipBytes(content) });
    if (type !== "js") return;
    const text = content.toString("utf8");
    scriptAssets(text);
    for (const child of moduleImports(text)) add(local(child, path.posix.dirname(url)), group === "dynamic" ? "dynamic" : "static");
    for (const child of moduleImports(text, "dynamic")) add(local(child, path.posix.dirname(url)), "dynamic");
  }
  function scriptAssets(text) {
    // Classic scripts also load literal root-relative URLs or root + 'js/...'.
    for (const match of text.matchAll(/["']((?:\/)?(?:js|css)\/[^"'\s$]+\.(?:js|css)(?:\?[^"'\s]*)?)["']/g)) {
      add(local(match[1]), "dynamic", /\.css(?:\?|$)/.test(match[1]) ? "css" : "js");
    }
  }
  const pageBase = path.posix.dirname("/" + path.relative(publicRoot, htmlFile));
  const inline = [];
  $("script").each((index, element) => {
    const src = $(element).attr("src");
    if (src) { add(local(src, pageBase), "direct"); return; }
    if (/^application\/(?:json|ld\+json)$/.test($(element).attr("type") || "")) return;
    const text = $(element).html() || "";
    scriptAssets(text);
    if (text.trim()) inline.push({ path: `inline:${index}`, bytes: Buffer.byteLength(text), gzipBytes: gzipBytes(text) });
  });
  $("link[rel='stylesheet']").each((_, element) => add(local($(element).attr("href"), pageBase), "direct", "css"));
  function declaredAssets(value) {
    if (typeof value === "string" && /^\/[^?]+\.(?:js|css)(?:\?|$)/.test(value)) add(local(value), "dynamic", /\.css(?:\?|$)/.test(value) ? "css" : "js");
    else if (Array.isArray(value)) value.forEach(declaredAssets);
    else if (value && typeof value === "object") Object.values(value).forEach(declaredAssets);
  }
  $("script[type='application/json']").each((_, element) => declaredAssets(JSON.parse($(element).html())));
  $("[data-effect-resource]").each((_, element) => declaredAssets(JSON.parse($(element).attr("data-effect-resource"))));
  const files = [...resources.values()].sort((a, b) => a.path.localeCompare(b.path));
  const sum = files => ({ files, bytes: files.reduce((n, f) => n + f.bytes, 0), gzipBytes: files.reduce((n, f) => n + f.gzipBytes, 0) });
  const direct = sum(files.filter(f => f.type === "js" && f.group === "direct"));
  const staticDependencies = sum(files.filter(f => f.type === "js" && f.group === "static"));
  const dynamicReachable = sum(files.filter(f => f.type === "js" && f.group === "dynamic"));
  return {
    ...sum(files.filter(f => f.type === "js")),
    direct, staticDependencies, dynamicReachable,
    css: sum(files.filter(f => f.type === "css")),
    inline: sum(inline),
    html: { bytes: Buffer.byteLength(html), gzipBytes: gzipBytes(html) }
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
    npm_config_cache: process.env.npm_config_cache || path.join(root, "npm-cache")
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
      schemaVersion: 2,
      baseline: { tag: BASELINE_TAG, ...baseline },
      current: { version: require(path.join(THEME_ROOT, "package.json")).version, ...currentScripts },
      metric: "Local resource inventory: direct, static imports, reachable dynamic imports and declared assets. Dynamic reachability does not imply deferred loading. Inline scripts are part of HTML; gzip is an estimate per resource.",
      comparisonOnly: true,
      reduction: Number(reduction.toFixed(6)),
      passed: true
    };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function main() {
  const report = buildReport();
  const output = `${JSON.stringify(report, null, 2)}\n`;
  process.stdout.write(output);

}

if (require.main === module) main();

module.exports = {
  collectCoreScripts,
  moduleImports
};
