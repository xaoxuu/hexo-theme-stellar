#!/usr/bin/env node
/* global hexo */
"use strict";

const fs = require("node:fs");
const crypto = require("node:crypto");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const THEME_ROOT = path.resolve(__dirname, "..");
const BLUEPRINT_MATRIX = Object.freeze([
  Object.freeze({ id: "classic-blog", language: "en", style: "stellar" }),
  Object.freeze({ id: "minimal-reading", language: "zh-CN", style: "minimal" }),
  Object.freeze({ id: "docs-reference", language: "zh-TW", style: "stellar" })
]);
const MIGRATION_FIXTURE_ROOT = path.join(THEME_ROOT, "test/fixtures/v2-system-acceptance/migration");
const INSTALL_PACKAGES = [
  "hexo@8.1.2",
  "hexo-generator-index@4.0.0",
  "hexo-renderer-marked@7.0.1"
];

function execute(command, args, options = {}) {
  const runtimePath = `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH || ""}`;
  return spawnSync(command, args, {
    cwd: options.cwd || THEME_ROOT,
    encoding: "utf8",
    env: { ...process.env, PATH: runtimePath, HEXO_READY: "", ...options.env }
  });
}

function run(command, args, options = {}) {
  const result = execute(command, args, options);
  if (result.status !== 0) {
    process.stderr.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
  return result.stdout;
}

function runFailure(command, args, options = {}) {
  const result = execute(command, args, options);
  if (result.status === 0) {
    throw new Error(`${command} ${args.join(" ")} unexpectedly succeeded`);
  }
  return result;
}

function write(root, relative, content) {
  const output = path.join(root, relative);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, content, "utf8");
}

function createSite(root, options = {}) {
  write(root, "package.json", `${JSON.stringify({
    private: true,
    hexo: { version: "8.1.2" }
  }, null, 2)}\n`);
  write(root, "_config.yml", [
    "title: Stellar Package Integration",
    "subtitle: Installed from an npm tarball",
    "author: Stellar",
    `language: ${options.language || "zh-CN"}`,
    "url: https://example.com",
    "root: /",
    "permalink: blog/:year/:month/:day/:title/",
    "theme: stellar",
    ""
  ].join("\n"));
}

function installSite(root, tarball) {
  run("npm", [
    "install",
    "--no-audit",
    "--no-fund",
    "--prefer-offline",
    "--package-lock=false",
    ...INSTALL_PACKAGES,
    tarball
  ], { cwd: root, env: { npm_config_cache: path.join(path.dirname(root), "npm-cache") } });
  return path.join(root, "node_modules", ".bin", "hexo");
}

function copyTree(source, target) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      copyTree(from, to);
    } else {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
  }
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function contentHashes(root) {
  const source = path.join(root, "source");
  const result = {};
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.name.endsWith(".md")) result[path.relative(root, file).replace(/\\/g, "/")] = sha256File(file);
    }
  }
  visit(source);
  return result;
}

function planTargets(output) {
  return output.split(/\r?\n/)
    .filter(line => line.startsWith("  create "))
    .map(line => line.slice("  create ".length));
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
  const beforeConflict = sha256File(file);
  const conflict = runFailure(hexo, args, { cwd: root });
  if (!/拒绝覆盖|already exists|EEXIST/.test(`${conflict.stdout}\n${conflict.stderr}`)) {
    throw new Error("minimal-reading: stellar new note conflict did not explain refusal");
  }
  if (sha256File(file) !== beforeConflict) {
    throw new Error("minimal-reading: stellar new note conflict changed the existing Note");
  }
}

function assertInitTransactions(root, hexo, blueprint, style) {
  const args = [
    "stellar", "init",
    "--blueprint", blueprint,
    "--style", style,
    "--non-interactive"
  ];
  write(root, "source/_posts/user-owned.md", "---\ntitle: User owned\n---\n\nUser-owned body marker.\n");
  const userFile = path.join(root, "source/_posts/user-owned.md");
  const userHash = sha256File(userFile);
  const dryRunTargets = planTargets(run(hexo, [...args, "--dry-run"], { cwd: root }));
  if (dryRunTargets.length === 0) throw new Error(`${blueprint}: init dry-run returned an empty plan`);
  for (const target of dryRunTargets) {
    if (fs.existsSync(path.join(root, target))) throw new Error(`${blueprint}: init dry-run wrote ${target}`);
  }
  const actualTargets = planTargets(run(hexo, args, { cwd: root }));
  if (JSON.stringify(actualTargets) !== JSON.stringify(dryRunTargets)) {
    throw new Error(`${blueprint}: init dry-run and write plans differ`);
  }
  if (sha256File(userFile) !== userHash) throw new Error(`${blueprint}: init changed user-owned content`);

  const targetHashes = Object.fromEntries(actualTargets.map(target => [target, sha256File(path.join(root, target))]));
  const conflict = runFailure(hexo, args, { cwd: root });
  if (!/拒绝覆盖/.test(`${conflict.stdout}\n${conflict.stderr}`)) {
    throw new Error(`${blueprint}: repeated init did not reject the complete plan`);
  }
  for (const [target, hash] of Object.entries(targetHashes)) {
    if (sha256File(path.join(root, target)) !== hash) throw new Error(`${blueprint}: conflict changed ${target}`);
  }

  const transactionRoot = path.join(root, ".m10-init-rollback");
  fs.mkdirSync(transactionRoot, { recursive: true });
  const installedTheme = path.join(root, "node_modules/hexo-theme-stellar");
  const { buildBlueprintPlan, writeBlueprintPlan } = require(path.join(installedTheme, "scripts/lib/blueprints"));
  const plan = buildBlueprintPlan({ themeRoot: installedTheme, baseDir: transactionRoot, blueprint, style });
  if (plan.files.length < 2) throw new Error(`${blueprint}: rollback fixture requires at least two planned files`);
  const blocker = path.dirname(plan.files[1].target);
  write(transactionRoot, blocker, "user-owned parent blocker\n");
  let rolledBack = false;
  try {
    writeBlueprintPlan(plan);
  } catch (error) {
    rolledBack = /已回滚/.test(error.message);
  }
  if (!rolledBack) throw new Error(`${blueprint}: interrupted init did not report rollback`);
  for (const target of plan.files.map(file => file.target)) {
    if (fs.existsSync(path.join(transactionRoot, target))) {
      throw new Error(`${blueprint}: interrupted init left ${target}`);
    }
  }
  if (fs.readFileSync(path.join(transactionRoot, blocker), "utf8") !== "user-owned parent blocker\n") {
    throw new Error(`${blueprint}: interrupted init changed the user-owned blocker`);
  }
  fs.rmSync(transactionRoot, { recursive: true, force: true });
}

function assertDoctorParity(root, hexo, label) {
  const text = run(hexo, ["stellar", "doctor", "--format", "text"], { cwd: root });
  const json = JSON.parse(run(hexo, ["stellar", "doctor", "--format", "json", "--silent"], { cwd: root }));
  if (!json.ok || !/Stellar doctor: PASS/.test(text)) throw new Error(`${label}: doctor text/json did not both pass`);
  return json;
}

function assertSearchIndex(root, markers, label) {
  const file = path.join(root, "public/search.json");
  if (!fs.existsSync(file)) throw new Error(`${label}: missing public/search.json`);
  const index = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(index) || index.length === 0) throw new Error(`${label}: search index is empty`);
  const serialized = JSON.stringify(index);
  for (const marker of markers) {
    if (!serialized.includes(marker)) throw new Error(`${label}: search index missing ${marker}`);
  }
}

function assertRoutes(root, routes, label) {
  for (const route of routes) {
    const relative = route === "/" ? "public/index.html" : `public/${route.replace(/^\//, "").replace(/\/$/, "")}/index.html`;
    if (!fs.existsSync(path.join(root, relative))) throw new Error(`${label}: missing route ${route}`);
  }
}

function assertLanguage(html, language, label) {
  if (!html.includes(`<html lang="${language}"`)) throw new Error(`${label}: expected html language ${language}`);
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

function expectedRoutes(blueprint) {
  if (blueprint === "classic-blog") {
    return ["/", "/topic/", "/blog/2026/08/23/integration-topic/"];
  }
  if (blueprint === "minimal-reading") {
    return ["/", "/notebooks/", "/notes/integration/", "/notebooks/integration/Integration Notebook Note/"];
  }
  return ["/wiki/", "/wiki/docs-reference/", "/wiki/docs-reference/getting-started/"];
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
      && /<a class="cap breadcrumb" id="proj"[^>]*>[^<]+<\/a>/.test(html);
  }
  if (profile === "wiki") {
    return /<div class="l_body content" id="start" layout="page"/.test(html)
      && /<a class="cap breadcrumb" id="proj"[^>]*>[^<]+<\/a>/.test(html);
  }
  if (profile === "notebook") {
    return /<div class="l_body content" id="start" layout="page"/.test(html)
      && /<a class="cap breadcrumb"[^>]*>[^<]+<\/a>/.test(html);
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

function assertInstalledBlueprintReference(root) {
  const file = path.join(root, "node_modules/hexo-theme-stellar/reference/v2-blueprints.json");
  const reference = JSON.parse(fs.readFileSync(file, "utf8"));
  const expectedIds = BLUEPRINT_MATRIX.map(item => item.id);
  if (reference.manifestContract?.sealed !== true) {
    throw new Error("installed Blueprint Reference must declare a sealed manifest contract");
  }
  if (JSON.stringify(reference.manifestContract.blueprintIds) !== JSON.stringify(expectedIds)) {
    throw new Error("installed Blueprint Reference exposes unexpected manifest Blueprint ids");
  }
  if (JSON.stringify(reference.blueprints?.map(item => item.id)) !== JSON.stringify(expectedIds)) {
    throw new Error("installed Blueprint Reference exposes unexpected Blueprint definitions");
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

function checkSite(root, matrix, tarball) {
  const { id: blueprint, language, style } = matrix;
  createSite(root, { language });
  process.stdout.write(`${blueprint}/${language}: installing Hexo 8 and ${path.basename(tarball)}\n`);
  const hexo = installSite(root, tarball);
  assertInstalledBlueprintReference(root);
  assertInitTransactions(root, hexo, blueprint, style);
  if (blueprint === "classic-blog") addTopicFixture(root);
  if (blueprint === "minimal-reading") addNotebookFixture(root, hexo);
  assertDoctorParity(root, hexo, `${blueprint}/${language}`);
  run(hexo, ["generate"], { cwd: root });
  assertRoutes(root, expectedRoutes(blueprint), `${blueprint}/${language}`);
  for (const expected of expectedPages(blueprint)) {
    const output = expected.path
      ? path.join(root, expected.path)
      : findHtmlWithMarker(path.join(root, "public"), expected.marker, expected.profile);
    const relative = output ? path.relative(root, output) : `<page containing ${expected.marker}>`;
    if (!output || !fs.existsSync(output)) throw new Error(`${blueprint}: missing ${relative}`);
    const html = fs.readFileSync(output, "utf8");
    if (!html.includes(expected.marker)) throw new Error(`${relative}: missing content marker ${expected.marker}`);
    assertRuntime(html, relative, expected.profile);
    assertLanguage(html, language, `${blueprint}/${relative}`);
  }
  assertSearchIndex(root, expectedPages(blueprint).map(item => item.marker), `${blueprint}/${language}`);
  process.stdout.write(`${blueprint}/${language}: init transaction → doctor → generate → routes/search passed\n`);
  return { id: blueprint, language, style, routes: expectedRoutes(blueprint) };
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
  const hexo = installSite(root, tarball);
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
  assertSearchIndex(root, ["Default configuration integration marker.", "Ordinary Page integration marker."], "default-content/missing-config");

  write(root, "_config.stellar.yml", "");
  const emptyDoctor = assertDoctorParity(root, hexo, "default-content/empty-config");
  if (!emptyDoctor.checked.themeConfig) throw new Error("default-content: empty override was not checked");
  run(hexo, ["clean"], { cwd: root });
  run(hexo, ["generate"], { cwd: root });
  assertRoutes(root, ["/", "/about/"], "default-content/empty-config");
  process.stdout.write("default-content: missing/empty config → doctor → generate passed\n");
  return { id: "default-content", language: "zh-CN", style: "schema-defaults", routes: ["/", "/about/"] };
}

function installMigrationContent(root) {
  copyTree(path.join(MIGRATION_FIXTURE_ROOT, "content"), root);
}

function installMigrationConfig(root, version) {
  copyTree(path.join(MIGRATION_FIXTURE_ROOT, version), root);
}

function assertMigrationPages(root, label) {
  const expected = [
    { marker: "M10 migrated Post body marker.", profile: "post" },
    { marker: "M10 migrated Topic body marker.", profile: "topic" },
    { marker: "M10 migrated Wiki body marker.", profile: "wiki" },
    { marker: "M10 migrated Notebook body marker.", profile: "notebook" }
  ];
  for (const item of expected) {
    const output = findHtmlWithMarker(path.join(root, "public"), item.marker, item.profile);
    if (!output) throw new Error(`${label}: missing ${item.profile} migrated page`);
    assertRuntime(fs.readFileSync(output, "utf8"), path.relative(root, output), item.profile);
  }
  assertRoutes(root, migrationRoutes(), label);
  assertSearchIndex(root, expected.map(item => item.marker), label);
}

function migrationRoutes() {
  return [
    "/",
    "/blog/2026/08/25/migrated-post/",
    "/blog/2026/08/25/migrated-topic/",
    "/topic/",
    "/wiki/",
    "/wiki/migrated-docs/",
    "/notebooks/",
    "/notebooks/migrated-notebook/first-note/",
    "/notes/migrated-notebook/"
  ];
}

function checkSideBySideMigration(root, tarball) {
  createSite(root, { language: "zh-CN" });
  process.stdout.write(`side-by-side-migration: installing Hexo 8 and ${path.basename(tarball)}\n`);
  const hexo = installSite(root, tarball);
  const args = ["stellar", "init", "--blueprint", "classic-blog", "--style", "stellar", "--non-interactive"];
  const starterTargets = planTargets(run(hexo, [...args, "--dry-run"], { cwd: root }));
  run(hexo, args, { cwd: root });
  for (const target of starterTargets) fs.rmSync(path.join(root, target), { force: true });
  installMigrationContent(root);
  installMigrationConfig(root, "v2");
  const expectedHashes = contentHashes(path.join(MIGRATION_FIXTURE_ROOT, "content"));
  if (JSON.stringify(contentHashes(root)) !== JSON.stringify(expectedHashes)) {
    throw new Error("side-by-side-migration: copied content differs from the fixed fixture");
  }
  assertDoctorParity(root, hexo, "side-by-side-migration");
  run(hexo, ["generate"], { cwd: root });
  assertMigrationPages(root, "side-by-side-migration");
  process.stdout.write("side-by-side-migration: clean v2 skeleton → explicit config rebuild → generate passed\n");
  return {
    id: "side-by-side-migration",
    language: "zh-CN",
    style: "stellar",
    routes: migrationRoutes()
  };
}

function checkInPlaceMigration(root, tarball) {
  createSite(root, { language: "zh-CN" });
  installMigrationContent(root);
  installMigrationConfig(root, "legacy");
  const beforeHashes = contentHashes(root);
  process.stdout.write(`in-place-migration: installing Hexo 8 and ${path.basename(tarball)}\n`);
  const hexo = installSite(root, tarball);
  const failed = runFailure(hexo, ["stellar", "doctor", "--format", "json", "--silent"], { cwd: root });
  const result = JSON.parse(failed.stdout);
  if (result.ok || !Array.isArray(result.issues)) throw new Error("in-place-migration: legacy doctor unexpectedly passed");
  const paths = result.issues.map(issue => issue.path);
  for (const expected of ["brand", "article", "search"]) {
    if (!paths.some(item => item === expected || item.startsWith(`${expected}.`))) {
      throw new Error(`in-place-migration: doctor did not locate legacy ${expected}`);
    }
  }
  if (result.issues.some(issue => typeof issue.migration !== "string" || issue.migration.length === 0)) {
    throw new Error("in-place-migration: doctor issue is missing a migration section");
  }
  installMigrationConfig(root, "v2");
  if (JSON.stringify(contentHashes(root)) !== JSON.stringify(beforeHashes)) {
    throw new Error("in-place-migration: explicit config rebuild changed Markdown content");
  }
  assertDoctorParity(root, hexo, "in-place-migration/v2");
  run(hexo, ["generate"], { cwd: root });
  assertMigrationPages(root, "in-place-migration");
  process.stdout.write("in-place-migration: legacy diagnosis → explicit config rebuild → generate passed\n");
  return {
    id: "in-place-migration",
    language: "zh-CN",
    style: "stellar",
    routes: migrationRoutes()
  };
}

function parseOutputArgument(args) {
  const inline = args.find(argument => argument.startsWith("--output="));
  if (inline) {
    const value = inline.slice("--output=".length);
    if (!value) throw new Error("--output 需要一个绝对路径");
    return value;
  }
  const index = args.indexOf("--output");
  if (index < 0) return null;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error("--output 需要一个绝对路径");
  return value;
}

function acceptanceRoot(args) {
  const prepare = args.includes("--prepare");
  const requested = parseOutputArgument(args);
  if (!prepare && requested) throw new Error("--output 只能与 --prepare 一起使用");
  if (!requested) return { root: fs.mkdtempSync(path.join(os.tmpdir(), "stellar-package-integration-")), keep: prepare };
  if (!path.isAbsolute(requested)) throw new Error("--output 必须是绝对路径");
  const root = path.resolve(requested);
  if (fs.existsSync(root) && fs.readdirSync(root).length > 0) throw new Error(`--output 必须指向空目录：${root}`);
  fs.mkdirSync(root, { recursive: true });
  return { root, keep: true };
}

function writeAcceptanceArtifacts(root, tarball, sites) {
  const report = {
    status: "waiting-for-owner-acceptance",
    candidate: {
      file: path.basename(tarball),
      sha256: sha256File(tarball),
      version: require(path.join(THEME_ROOT, "package.json")).version
    },
    environment: {
      node: process.version,
      npm: run("npm", ["--version"]).trim(),
      hexo: "8.1.2"
    },
    sites: sites.map(site => ({
      ...site,
      directory: path.join(root, site.id),
      expected: "Run npx hexo server in this directory, then inspect the listed routes on desktop and mobile."
    })),
    manualScenarios: [
      "desktop and mobile layout",
      "primary navigation and Collection navigation",
      "local search and empty/error state",
      "comments remote-failure fallback without console errors",
      "canonical, Open Graph and JSON-LD output",
      "language-specific built-in UI",
      "default Markdown rendering"
    ]
  };
  write(root, "acceptance-report.json", `${JSON.stringify(report, null, 2)}\n`);
  write(root, "issues.md", [
    "# Stellar v2 M10 人工验收问题记录",
    "",
    "状态：等待站长人工验收",
    "",
    "## 问题模板",
    "",
    "- 站点 / URL：",
    "- 环境（浏览器、视口、系统）：",
    "- 预期结果：",
    "- 实际结果：",
    "- 复现步骤：",
    "- 截图或日志：",
    "- 处理结论：",
    ""
  ].join("\n"));
}

function main() {
  if (process.versions.node.split(".")[0] !== "22") {
    throw new Error(`Package integration requires Node.js 22, got ${process.versions.node}`);
  }
  const args = process.argv.slice(2);
  const prepared = acceptanceRoot(args);
  const { root } = prepared;
  try {
    const tarball = packTheme(root);
    const selectedId = args.find(argument => argument.startsWith("--blueprint="))?.slice(12)
      || process.env.STELLAR_INTEGRATION_BLUEPRINT;
    const selected = selectedId
      ? BLUEPRINT_MATRIX.filter(matrix => matrix.id === selectedId)
      : BLUEPRINT_MATRIX;
    if (selected.length === 0) throw new Error(`Unknown integration Blueprint: ${selectedId}`);
    const sites = [];
    for (const matrix of selected) {
      sites.push(checkSite(path.join(root, matrix.id), matrix, tarball));
    }
    sites.push(checkDefaultSite(path.join(root, "default-content"), tarball));
    if (!selectedId) {
      sites.push(checkSideBySideMigration(path.join(root, "side-by-side-migration"), tarball));
      sites.push(checkInPlaceMigration(path.join(root, "in-place-migration"), tarball));
    }
    fs.rmSync(path.join(root, "npm-cache"), { recursive: true, force: true });
    if (prepared.keep || args.includes("--keep")) writeAcceptanceArtifacts(root, tarball, sites);
    process.stdout.write(`Package integration passed: ${path.basename(tarball)}\n`);
  } finally {
    if (prepared.keep || process.env.STELLAR_KEEP_INTEGRATION_FIXTURE === "1" || args.includes("--keep")) {
      process.stdout.write(`Kept integration fixture: ${root}\n`);
    } else {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
}

if (require.main === module) main();

module.exports = {
  BLUEPRINT_MATRIX,
  assertPackageFiles,
  assertRuntime,
  contentHashes,
  expectedPages,
  expectedRoutes,
  findHtmlWithMarker,
  hasProfileOutput,
  planTargets
};
