#!/usr/bin/env node
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
    "title: Stellar Alpha Integration",
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
  write(root, "source/_data/topic/alpha.yml", [
    "name: Alpha Topic",
    "headline: Alpha Topic",
    "description: Topic ViewModel integration fixture.",
    "article:",
    "  type: tech",
    ""
  ].join("\n"));
  write(root, "source/_posts/alpha-topic.md", [
    "---",
    "title: Alpha Topic Post",
    "date: 2026-08-23 08:00",
    "description: Topic ViewModel integration fixture.",
    "collection:",
    "  profile: topic",
    "  id: alpha",
    "---",
    "",
    "Topic profile integration marker.",
    ""
  ].join("\n"));
}

function addNotebookFixture(root) {
  write(root, "source/_data/notebooks/alpha.yml", [
    "name: Alpha Notebook",
    "description: Notebook ViewModel integration fixture.",
    "route:",
    "  path: notes/alpha",
    "navigation:",
    "  menu: post",
    ""
  ].join("\n"));
  write(root, "source/notes/alpha/integration.md", [
    "---",
    "title: Alpha Notebook Note",
    "date: 2026-08-23 08:10",
    "collection:",
    "  profile: notebook",
    "  id: alpha",
    "tags:",
    "  - integration/runtime",
    "---",
    "",
    "Notebook profile integration marker.",
    ""
  ].join("\n"));
}

function expectedPages(blueprint) {
  if (blueprint === "classic-blog") {
    return [
      { path: "public/blog/2026/08/23/alpha-topic/index.html", marker: "Topic profile integration marker." },
      { marker: "Classic Blog" }
    ];
  }
  if (blueprint === "minimal-reading") {
    return [
      { path: "public/notes/alpha/integration/index.html", marker: "Notebook profile integration marker." },
      { marker: "Minimal Reading" }
    ];
  }
  return [
    { path: "public/wiki/docs-reference/index.html", marker: "Product Documentation" },
    { path: "public/wiki/docs-reference/getting-started/index.html", marker: "Getting Started" }
  ];
}

function findHtmlWithMarker(root, marker) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) {
      const nested = findHtmlWithMarker(file, marker);
      if (nested) return nested;
    } else if (entry.name.endsWith(".html") && fs.readFileSync(file, "utf8").includes(marker)) {
      return file;
    }
  }
  return null;
}

function assertRuntime(html, relative) {
  const manifests = [...html.matchAll(/<script type="application\/json" id="stellar-runtime-config">([\s\S]*?)<\/script>/g)];
  if (manifests.length !== 1) throw new Error(`${relative}: expected one Runtime Manifest, got ${manifests.length}`);
  const manifest = JSON.parse(manifests[0][1]);
  if (manifest.version !== 1 || !Array.isArray(manifest.extensions)) {
    throw new Error(`${relative}: invalid Runtime Manifest`);
  }
  const entries = html.match(/<script type="module" src="[^"]*\/js\/runtime\/index\.mjs[^"]*"><\/script>/g) || [];
  if (entries.length !== 1) throw new Error(`${relative}: expected one ESM runtime entry, got ${entries.length}`);
  if (!html.includes("<div class=\"l_body")) throw new Error(`${relative}: missing ViewModel Shell output`);
}

function assertPackageFiles(pack) {
  const files = new Set(pack.files.map(item => item.path));
  const required = [
    "ALPHA.md",
    "reference/README.md",
    "reference/v2-config.json",
    "reference/v2-config.md",
    "reference/v2-models.json",
    "reference/v2-models.md",
    "reference/v2-blueprints.json",
    "reference/v2-blueprints.md",
    "reference/v2-alpha-performance.json",
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
  const forbidden = ["test/", "ci/", "docs/", ".agents/", "package-lock.json"];
  for (const file of files) {
    if (forbidden.some(prefix => file === prefix || file.startsWith(prefix))) {
      throw new Error(`npm tarball includes development file ${file}`);
    }
  }
}

function packTheme(root) {
  const output = run("npm", ["pack", "--json", "--pack-destination", root]);
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
  ], { cwd: root });
  const hexo = path.join(root, "node_modules", ".bin", "hexo");
  run(hexo, ["stellar", "init", "--blueprint", blueprint, "--non-interactive"], { cwd: root });
  if (blueprint === "classic-blog") addTopicFixture(root);
  if (blueprint === "minimal-reading") addNotebookFixture(root);
  const doctor = JSON.parse(run(hexo, ["stellar", "doctor", "--format", "json", "--silent"], { cwd: root }));
  if (!doctor.ok) throw new Error(`${blueprint}: doctor failed`);
  run(hexo, ["generate"], { cwd: root });
  for (const expected of expectedPages(blueprint)) {
    const output = expected.path
      ? path.join(root, expected.path)
      : findHtmlWithMarker(path.join(root, "public"), expected.marker);
    const relative = output ? path.relative(root, output) : `<page containing ${expected.marker}>`;
    if (!output || !fs.existsSync(output)) throw new Error(`${blueprint}: missing ${relative}`);
    const html = fs.readFileSync(output, "utf8");
    if (!html.includes(expected.marker)) throw new Error(`${relative}: missing content marker ${expected.marker}`);
    assertRuntime(html, relative);
  }
  process.stdout.write(`${blueprint}: tarball install → init → doctor → generate passed\n`);
}

function main() {
  if (process.versions.node.split(".")[0] !== "22") {
    throw new Error(`Alpha integration requires Node.js 22, got ${process.versions.node}`);
  }
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-alpha-integration-"));
  try {
    const tarball = packTheme(root);
    const selectedId = process.argv.find(argument => argument.startsWith("--blueprint="))?.slice(12)
      || process.env.STELLAR_ALPHA_BLUEPRINT;
    const selected = selectedId
      ? BLUEPRINTS.filter(blueprint => blueprint === selectedId)
      : BLUEPRINTS;
    if (selected.length === 0) throw new Error(`Unknown Alpha integration Blueprint: ${selectedId}`);
    for (const blueprint of selected) {
      checkSite(path.join(root, blueprint), blueprint, tarball);
    }
    process.stdout.write(`Alpha package integration passed: ${path.basename(tarball)}\n`);
  } finally {
    if (process.env.STELLAR_KEEP_ALPHA_FIXTURE === "1" || process.argv.includes("--keep")) {
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
  findHtmlWithMarker
};
