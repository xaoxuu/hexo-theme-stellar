#!/usr/bin/env node
/* global hexo */
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const THEME_ROOT = path.resolve(__dirname, "..");
const BLUEPRINTS = ["classic-blog", "minimal-reading", "docs-reference"];
const INSTALL_PACKAGES = [
  "hexo@8.1.2",
  "hexo-generator-index@4.0.0",
  "hexo-renderer-marked@7.0.1"
];

function run(command, args, options = {}) {
  const runtimePath = `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH || ""}`;
  const result = spawnSync(command, args, {
    cwd: options.cwd || THEME_ROOT,
    encoding: "utf8",
    env: { ...process.env, PATH: runtimePath, HEXO_READY: "", ...options.env }
  });
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

function createSite(root) {
  write(root, "package.json", `${JSON.stringify({
    private: true,
    hexo: { version: "8.1.2" }
  }, null, 2)}\n`);
  write(root, "_config.yml", [
    "title: Stellar Package Integration",
    "subtitle: Installed from an npm tarball",
    "author: Stellar",
    "language: zh-CN",
    "url: https://example.com",
    "root: /",
    "permalink: blog/:year/:month/:day/:title/",
    "theme: stellar",
    ""
  ].join("\n"));
}

function addTopicFixture(root) {
  write(root, "source/_data/topic/integration.yml", [
    "name: Integration Topic",
    "headline: Integration Topic",
    "description: Topic ViewModel integration fixture.",
    "route:",
    "  start: integration-topic",
    "article:",
    "  style: tech",
    ""
  ].join("\n"));
  write(root, "source/_posts/integration-topic.md", [
    "---",
    "title: Integration Topic Post",
    "date: 2026-08-23 08:00",
    "---",
    "",
    "Topic profile integration marker.",
    ""
  ].join("\n"));
}

function addNotebookFixture(root, hexo) {
  write(root, "source/_data/notebooks/integration.yml", [
    "name: Integration Notebook",
    "description: Notebook ViewModel integration fixture.",
    "route:",
    "  path: notes/integration",
    "navigation:",
    "  menu: post",
    ""
  ].join("\n"));
  const args = [
    "stellar", "new", "note",
    "--notebook", "integration",
    "--title", "Integration Notebook Note",
    "--tags", "integration/runtime"
  ];
  const dryRun = run(hexo, [...args, "--dry-run"], { cwd: root });
  if (!dryRun.includes("source/notebooks/integration/Integration Notebook Note.md")) {
    throw new Error("minimal-reading: stellar new note dry-run missing planned target");
  }
  const file = path.join(root, "source/notebooks/integration/Integration Notebook Note.md");
  if (fs.existsSync(file)) throw new Error("minimal-reading: stellar new note dry-run wrote a file");
  run(hexo, args, { cwd: root });
  const generated = fs.readFileSync(file, "utf8");
  if (/collection:|profile: notebook|\nid: integration/.test(generated)) {
    throw new Error("minimal-reading: stellar new note wrote redundant Collection ownership");
  }
  fs.appendFileSync(file, "Notebook profile integration marker.\n", "utf8");
}

function expectedPages(blueprint) {
  if (blueprint === "classic-blog") {
    return [
      { path: "public/blog/2026/08/23/integration-topic/index.html", marker: "Topic profile integration marker.", profile: "topic" },
      { marker: "Your first Stellar page", profile: "post" }
    ];
  }
  if (blueprint === "minimal-reading") {
    return [
      { marker: "Notebook profile integration marker.", profile: "notebook" },
      { marker: "Minimal Reading", profile: "post" }
    ];
  }
  return [
    { path: "public/wiki/docs-reference/index.html", marker: "Product Documentation", profile: "wiki" },
    { path: "public/wiki/docs-reference/getting-started/index.html", marker: "Getting Started", profile: "wiki" }
  ];
}

function hasProfileOutput(html, profile) {
  const shell = /<div class="l_body content" id="start" layout="(?:post|page)"/.test(html);
  if (!shell) return false;
  if (profile === "post") {
    return /<div class="l_body content" id="start" layout="post"/.test(html)
      && /<meta property="og:type" content="article">/.test(html);
  }
  if (profile === "topic") {
    return /<div class="l_body content" id="start" layout="post"/.test(html)
      && /<a class="cap breadcrumb" id="proj"[^>]*>Integration Topic<\/a>/.test(html);
  }
  if (profile === "wiki") {
    return /<div class="l_body content" id="start" layout="page"/.test(html)
      && /<a class="cap breadcrumb" id="proj"[^>]*>Product Docs<\/a>/.test(html);
  }
  if (profile === "notebook") {
    return /<div class="l_body content" id="start" layout="page"/.test(html)
      && /<a class="cap breadcrumb"[^>]*>Integration Notebook<\/a>/.test(html);
  }
  if (profile === "page") {
    return /<div class="l_body content" id="start" layout="page"/.test(html);
  }
  return false;
}

function findHtmlWithMarker(root, marker, profile) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) {
      const nested = findHtmlWithMarker(file, marker, profile);
      if (nested) return nested;
    } else if (entry.name.endsWith(".html")) {
      const html = fs.readFileSync(file, "utf8");
      if (html.includes(marker) && hasProfileOutput(html, profile)) return file;
    }
  }
  return null;
}

function assertRuntime(html, relative, profile) {
  const manifests = [...html.matchAll(/<script type="application\/json" id="stellar-runtime-config">([\s\S]*?)<\/script>/g)];
  if (manifests.length !== 1) throw new Error(`${relative}: expected one Runtime Manifest, got ${manifests.length}`);
  const manifest = JSON.parse(manifests[0][1]);
  if (manifest.version !== 1 || !Array.isArray(manifest.extensions)) {
    throw new Error(`${relative}: invalid Runtime Manifest`);
  }
  const entries = html.match(/<script type="module" src="[^"]*\/js\/runtime\/index\.mjs[^"]*"><\/script>/g) || [];
  if (entries.length !== 1) throw new Error(`${relative}: expected one ESM runtime entry, got ${entries.length}`);
  if (!hasProfileOutput(html, profile)) throw new Error(`${relative}: missing ${profile} PageViewModel output marker`);
}

function assertPackageFiles(pack) {
  const files = new Set(pack.files.map(item => item.path));
  const required = [
    "reference/README.md",
    "reference/v2-config.json",
    "reference/v2-config.md",
    "reference/v2-models.json",
    "reference/v2-models.md",
    "reference/v2-blueprints.json",
    "reference/v2-blueprints.md",
    "blueprints/classic-blog/manifest.json",
    "blueprints/minimal-reading/manifest.json",
    "blueprints/docs-reference/manifest.json",
    "layout/_partial/primitives/shell.ejs",
    "scripts/schema/config-schema.js",
    "source/js/runtime/index.mjs"
  ];
  for (const file of required) {
    if (!files.has(file)) throw new Error(`npm tarball missing ${file}`);
  }
  const forbidden = [
    "test/",
    "ci/",
    "docs/",
    ".agents/",
    ".claude/",
    "scripts/.cache/",
    "package-lock.json",
    "ALPHA.md",
    "reference/v2-config-audit",
    "reference/v2-alpha-performance"
  ];
  for (const file of files) {
    if (forbidden.some(prefix => file === prefix || file.startsWith(prefix))) {
      throw new Error(`npm tarball includes development file ${file}`);
    }
  }
}

function packTheme(root) {
  const output = run("npm", ["pack", "--json", "--pack-destination", root], {
    env: { npm_config_cache: path.join(root, "npm-cache") }
  });
  const result = JSON.parse(output);
  if (!Array.isArray(result) || result.length !== 1) throw new Error("npm pack did not return one package");
  assertPackageFiles(result[0]);
  return path.join(root, result[0].filename);
}

function checkSite(root, blueprint, tarball) {
  createSite(root);
  process.stdout.write(`${blueprint}: installing Hexo 8 and ${path.basename(tarball)}\n`);
  run("npm", [
    "install",
    "--no-audit",
    "--no-fund",
    "--prefer-offline",
    "--package-lock=false",
    ...INSTALL_PACKAGES,
    tarball
  ], { cwd: root, env: { npm_config_cache: path.join(root, "npm-cache") } });
  const hexo = path.join(root, "node_modules", ".bin", "hexo");
  run(hexo, ["stellar", "init", "--blueprint", blueprint, "--non-interactive"], { cwd: root });
  if (blueprint === "classic-blog") addTopicFixture(root);
  if (blueprint === "minimal-reading") addNotebookFixture(root, hexo);
  const doctor = JSON.parse(run(hexo, ["stellar", "doctor", "--format", "json", "--silent"], { cwd: root }));
  if (!doctor.ok) throw new Error(`${blueprint}: doctor failed`);
  run(hexo, ["generate"], { cwd: root });
  for (const expected of expectedPages(blueprint)) {
    const output = expected.path
      ? path.join(root, expected.path)
      : findHtmlWithMarker(path.join(root, "public"), expected.marker, expected.profile);
    const relative = output ? path.relative(root, output) : `<page containing ${expected.marker}>`;
    if (!output || !fs.existsSync(output)) throw new Error(`${blueprint}: missing ${relative}`);
    const html = fs.readFileSync(output, "utf8");
    if (!html.includes(expected.marker)) throw new Error(`${relative}: missing content marker ${expected.marker}`);
    assertRuntime(html, relative, expected.profile);
  }
  process.stdout.write(`${blueprint}: tarball install → init → doctor → generate passed\n`);
}

function checkDefaultSite(root, tarball) {
  createSite(root);
  write(root, "source/_posts/default-markdown.md", [
    "---",
    "title: Default Markdown",
    "date: 2026-08-25 08:00",
    "---",
    "",
    "# Default content",
    "",
    "Default configuration integration marker.",
    "",
    "- list item",
    "",
    "> quoted text",
    "",
    "```js",
    "const ready = true;",
    "```",
    ""
  ].join("\n"));
  write(root, "source/about/index.md", [
    "---",
    "title: About",
    "---",
    "",
    "Ordinary Page integration marker.",
    ""
  ].join("\n"));
  process.stdout.write(`default-content: installing Hexo 8 and ${path.basename(tarball)}\n`);
  run("npm", [
    "install",
    "--no-audit",
    "--no-fund",
    "--prefer-offline",
    "--package-lock=false",
    ...INSTALL_PACKAGES,
    tarball
  ], { cwd: root, env: { npm_config_cache: path.join(root, "npm-cache") } });
  const hexo = path.join(root, "node_modules", ".bin", "hexo");
  if (fs.existsSync(path.join(root, "_config.stellar.yml"))) {
    throw new Error("default-content: fixture must not contain _config.stellar.yml");
  }
  const doctor = JSON.parse(run(hexo, ["stellar", "doctor", "--format", "json", "--silent"], { cwd: root }));
  if (!doctor.ok || doctor.checked.themeConfig !== false) {
    throw new Error("default-content: Schema-default doctor check failed");
  }
  run(hexo, ["generate"], { cwd: root });
  const post = findHtmlWithMarker(path.join(root, "public"), "Default configuration integration marker.", "post");
  if (!post) throw new Error("default-content: missing ordinary Post output");
  assertRuntime(fs.readFileSync(post, "utf8"), path.relative(root, post), "post");
  const page = path.join(root, "public/about/index.html");
  if (!fs.existsSync(page)) throw new Error("default-content: missing ordinary Page output");
  const pageHtml = fs.readFileSync(page, "utf8");
  if (!pageHtml.includes("Ordinary Page integration marker.")) throw new Error("default-content: ordinary Page marker missing");
  assertRuntime(pageHtml, path.relative(root, page), "page");
  process.stdout.write("default-content: no init → doctor → generate passed\n");
}

function main() {
  if (process.versions.node.split(".")[0] !== "22") {
    throw new Error(`Package integration requires Node.js 22, got ${process.versions.node}`);
  }
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-package-integration-"));
  try {
    const tarball = packTheme(root);
    const selectedId = process.argv.find(argument => argument.startsWith("--blueprint="))?.slice(12)
      || process.env.STELLAR_INTEGRATION_BLUEPRINT;
    const selected = selectedId
      ? BLUEPRINTS.filter(blueprint => blueprint === selectedId)
      : BLUEPRINTS;
    if (selected.length === 0) throw new Error(`Unknown integration Blueprint: ${selectedId}`);
    for (const blueprint of selected) {
      checkSite(path.join(root, blueprint), blueprint, tarball);
    }
    checkDefaultSite(path.join(root, "default-content"), tarball);
    process.stdout.write(`Package integration passed: ${path.basename(tarball)}\n`);
  } finally {
    if (process.env.STELLAR_KEEP_INTEGRATION_FIXTURE === "1" || process.argv.includes("--keep")) {
      process.stdout.write(`Kept integration fixture: ${root}\n`);
    } else {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
}

if (require.main === module) main();

module.exports = {
  assertPackageFiles,
  assertRuntime,
  expectedPages,
  findHtmlWithMarker,
  hasProfileOutput
};
