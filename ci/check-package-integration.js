#!/usr/bin/env node
/* global hexo */
"use strict";

const fs = require("node:fs");
const crypto = require("node:crypto");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { once } = require("node:events");
const { load } = require("cheerio");
const { RUNTIME_CONFIG_ID, RUNTIME_VERSION } = require("../scripts/lib/browser-runtime");
const INTERNAL = require("../scripts/lib/internal-constants");
const { spawn, spawnSync } = require("node:child_process");

const THEME_ROOT = path.resolve(__dirname, "..");
const PREVIEW_COMMAND = "npx hexo server --ip 127.0.0.1";
const SCENARIO_MATRIX = Object.freeze([
  Object.freeze({ id: "post-topic", language: "en" }),
  Object.freeze({ id: "notebook", language: "zh-CN" }),
  Object.freeze({ id: "wiki", language: "zh-TW" })
]);
const MINIFY_PACKAGES = [
  "gulp", "gulp-clean-css", "gulp-html-minifier-terser", "gulp-terser",
  "gulp-sourcemaps", "gulp-babel", "@babel/core", "@babel/preset-env"
];
const INSTALL_PACKAGES = [
  "hexo@8.1.2",
  "hexo-generator-index@4.0.0",
  "hexo-renderer-marked@7.0.1",
  "hexo-server@3.0.0"
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

function reservePreviewPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(error => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

function requestPreview(port, requestPath = "/") {
  return new Promise((resolve, reject) => {
    const request = http.get({ hostname: "127.0.0.1", port, path: requestPath, timeout: 1000 }, response => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", chunk => {
        if (body.length < 1024 * 1024) body += chunk;
      });
      response.on("end", () => resolve({ status: response.statusCode, body }));
    });
    request.once("timeout", () => request.destroy(new Error("preview request timed out")));
    request.once("error", reject);
  });
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function stopPreview(child) {
  if (child.pid == null) return;
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, "exit");
  child.kill("SIGTERM");
  await Promise.race([exited, delay(2000)]);
  if (child.exitCode === null && child.signalCode === null) {
    const killed = once(child, "exit");
    child.kill("SIGKILL");
    await killed;
  }
}

async function assertPreviewServer(root, hexo, label, requestPath = "/") {
  const port = await reservePreviewPort();
  const runtimePath = `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH || ""}`;
  const child = spawn(hexo, ["server", "--ip", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    env: { ...process.env, PATH: runtimePath, HEXO_READY: "" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  let spawnError = null;
  const capture = chunk => {
    logs = `${logs}${chunk}`.slice(-4000);
  };
  child.stdout.on("data", capture);
  child.stderr.on("data", capture);
  child.once("error", error => {
    spawnError = error;
  });
  try {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null || child.signalCode !== null) {
        throw new Error(`${label}: hexo server exited before serving HTTP\n${logs}`);
      }
      try {
        const response = await requestPreview(port, requestPath);
        if (response.status !== 200) throw new Error(`${label}: preview returned HTTP ${response.status}`);
        assertRuntime(response.body, label);
        process.stdout.write(`${label}: hexo server → HTTP 200 passed\n`);
        return;
      } catch (error) {
        if (/preview returned HTTP|Runtime/.test(error.message)) throw error;
      }
      await delay(100);
    }
    throw new Error(`${label}: hexo server did not become ready\n${logs}`);
  } finally {
    await stopPreview(child);
  }
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function addPostFixture(root) {
  write(root, "source/_posts/integration-post.md", [
    "---",
    "title: Integration Post",
    "date: 2026-08-23 08:00",
    "---",
    "",
    "Ordinary Post integration marker.",
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
    throw new Error("notebook: stellar new note dry-run missing planned target");
  }
  const file = path.join(root, "source/notebooks/integration/Integration Notebook Note.md");
  if (fs.existsSync(file)) throw new Error("notebook: stellar new note dry-run wrote a file");
  run(hexo, args, { cwd: root });
  const generated = fs.readFileSync(file, "utf8");
  if (/collection:|profile: notebook|\nid: integration/.test(generated)) {
    throw new Error("notebook: stellar new note wrote redundant Collection ownership");
  }
  fs.appendFileSync(file, "Notebook profile integration marker.\n", "utf8");
  const beforeConflict = sha256File(file);
  const conflict = runFailure(hexo, args, { cwd: root });
  if (!/拒绝覆盖|already exists|EEXIST/.test(`${conflict.stdout}\n${conflict.stderr}`)) {
    throw new Error("notebook: stellar new note conflict did not explain refusal");
  }
  if (sha256File(file) !== beforeConflict) {
    throw new Error("notebook: stellar new note conflict changed the existing Note");
  }
}

function addWikiFixture(root) {
  write(root, "source/_data/wiki.yml", "- integration\n");
  write(root, "source/_data/wiki/integration.yml", [
    "name: Integration Docs",
    "description: Wiki ViewModel integration fixture.",
    "route:",
    "  path: /wiki/integration/",
    "navigation:",
    "  tree:",
    "    Start:",
    "      - index",
    "      - getting-started",
    ""
  ].join("\n"));
  write(root, "source/wiki/integration/index.md", "---\ntitle: Integration Documentation\n---\n\nWiki profile integration marker.\n");
  write(root, "source/wiki/integration/getting-started.md", "---\ntitle: Getting Started\n---\n\nWiki getting-started marker.\n");
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
  if (load(html)("html").attr("lang") !== language) throw new Error(`${label}: expected html language ${language}`);
}

function expectedPages(scenario) {
  if (scenario === "post-topic") {
    return [
      { path: "public/blog/2026/08/23/integration-topic/index.html", marker: "Topic profile integration marker." },
      { path: "public/blog/2026/08/23/integration-post/index.html", marker: "Ordinary Post integration marker." }
    ];
  }
  if (scenario === "notebook") {
    return [
      { path: "public/notebooks/integration/Integration Notebook Note/index.html", marker: "Notebook profile integration marker." }
    ];
  }
  return [
    { path: "public/wiki/integration/index.html", marker: "Wiki profile integration marker." },
    { path: "public/wiki/integration/getting-started/index.html", marker: "Wiki getting-started marker." }
  ];
}

function expectedRoutes(scenario) {
  if (scenario === "post-topic") {
    return ["/", "/topic/", "/blog/2026/08/23/integration-topic/"];
  }
  if (scenario === "notebook") {
    return ["/notebooks/", "/notes/integration/", "/notebooks/integration/Integration Notebook Note/"];
  }
  return ["/wiki/", "/wiki/integration/", "/wiki/integration/getting-started/"];
}

function assertRuntime(html, relative) {
  const $ = load(html);
  const manifests = $(`script[type="application/json"][id="${RUNTIME_CONFIG_ID}"]`);
  if (manifests.length !== 1) throw new Error(`${relative}: expected one Runtime Manifest, got ${manifests.length}`);
  const manifest = JSON.parse(manifests.text());
  if (manifest.version !== RUNTIME_VERSION || !Array.isArray(manifest.extensions)) {
    throw new Error(`${relative}: invalid Runtime Manifest`);
  }
  const entries = $('script[type="module"][src]').filter((_, element) => {
    const url = new URL($(element).attr("src"), "https://example.com");
    return url.pathname.endsWith(INTERNAL.assets.runtime.bootstrap);
  });
  if (entries.length !== 1) throw new Error(`${relative}: expected one Runtime ESM entry, got ${entries.length}`);
}

function installMinifier(root) {
  const tooling = path.join(root, "build-tools");
  write(tooling, "package.json", '{"private":true}\n');
  run("npm", ["install", "--no-audit", "--no-fund", "--prefer-offline", "--package-lock=false", ...MINIFY_PACKAGES], {
    cwd: tooling, env: { npm_config_cache: path.join(root, "npm-cache") }
  });
  fs.copyFileSync(path.join(THEME_ROOT, "ci/gulpfile.js"), path.join(tooling, "gulpfile.js"));
  return tooling;
}

function minifySite(root, tooling) {
  // Runtime modules must survive both Hexo generation and host postprocessing unchanged.
  const source = path.join(root, "node_modules/hexo-theme-stellar/source/js/runtime");
  const modules = fs.readdirSync(source, { recursive: true })
    .filter(file => file.endsWith(".js"));
  if (modules.length === 0) throw new Error("Runtime source modules missing from installed package");
  run(path.join(tooling, "node_modules/.bin/gulp"), [
    "--cwd", root, "--gulpfile", path.join(tooling, "gulpfile.js"), "minify"
  ], { cwd: root });
  for (const file of modules) {
    const output = path.join(root, "public/js/runtime", file);
    if (!fs.existsSync(output) || sha256File(output) !== sha256File(path.join(source, file))) {
      throw new Error(`Runtime module changed or missing after generate/minify: ${file}`);
    }
  }
  process.stdout.write(`${path.basename(root)}: HTML/CSS/JS minify and Runtime ESM preservation passed\n`);
}

function assertPackageFiles(pack) {
  const files = new Set(pack.files.map(item => item.path));
  const required = [
    "legal/THIRD-PARTY-NOTICES.md",
    "layout/_partial/primitives/shell.ejs",
    "scripts/commands/stellar.js",
    "scripts/lib/safe-path.js",
    "scripts/schema/config-schema.js",
    "source/js/runtime/index.js"
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
    ".github/",
    "package-lock.json",
    "release.js"
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

async function checkSite(root, matrix, tarball, tooling) {
  const { id: scenario, language } = matrix;
  createSite(root, { language });
  process.stdout.write(`${scenario}/${language}: installing Hexo 8 and ${path.basename(tarball)}\n`);
  const hexo = installSite(root, tarball);
  if (scenario === "post-topic") {
    addPostFixture(root);
    addTopicFixture(root);
  } else if (scenario === "notebook") addNotebookFixture(root, hexo);
  else addWikiFixture(root);
  assertDoctorParity(root, hexo, `${scenario}/${language}`);
  run(hexo, ["generate"], { cwd: root });
  minifySite(root, tooling);
  assertRoutes(root, expectedRoutes(scenario), `${scenario}/${language}`);
  for (const expected of expectedPages(scenario)) {
    const output = path.join(root, expected.path);
    const relative = expected.path;
    if (!output || !fs.existsSync(output)) throw new Error(`${scenario}: missing ${relative}`);
    const html = fs.readFileSync(output, "utf8");
    if (!html.includes(expected.marker)) throw new Error(`${relative}: missing content marker ${expected.marker}`);
    assertRuntime(html, relative);
    assertLanguage(html, language, `${scenario}/${relative}`);
  }
  assertSearchIndex(root, expectedPages(scenario).map(item => item.marker), `${scenario}/${language}`);
  await assertPreviewServer(root, hexo, `${scenario}/${language}`, expectedRoutes(scenario)[0]);
  process.stdout.write(`${scenario}/${language}: doctor → generate → routes/search passed\n`);
  return { id: scenario, language, routes: expectedRoutes(scenario) };
}

async function checkDefaultSite(root, tarball, tooling) {
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
  const post = path.join(root, "public/blog/2026/08/25/default-markdown/index.html");
  assertRuntime(fs.readFileSync(post, "utf8"), path.relative(root, post));
  const page = path.join(root, "public/about/index.html");
  if (!fs.existsSync(page)) throw new Error("default-content: missing ordinary Page output");
  const pageHtml = fs.readFileSync(page, "utf8");
  if (!pageHtml.includes("Ordinary Page integration marker.")) throw new Error("default-content: ordinary Page marker missing");
  assertRuntime(pageHtml, path.relative(root, page));
  assertSearchIndex(root, ["Default configuration integration marker.", "Ordinary Page integration marker."], "default-content/missing-config");

  write(root, "_config.stellar.yml", "");
  const emptyDoctor = assertDoctorParity(root, hexo, "default-content/empty-config");
  if (!emptyDoctor.checked.themeConfig) throw new Error("default-content: empty override was not checked");
  run(hexo, ["clean"], { cwd: root });
  run(hexo, ["generate"], { cwd: root });
  minifySite(root, tooling);
  assertRuntime(fs.readFileSync(post, "utf8"), path.relative(root, post));
  assertRuntime(fs.readFileSync(page, "utf8"), path.relative(root, page));
  assertRoutes(root, ["/", "/about/"], "default-content/empty-config");
  await assertPreviewServer(root, hexo, "default-content/empty-config");
  process.stdout.write("default-content: missing/empty config → doctor → generate passed\n");
  return { id: "default-content", language: "zh-CN", style: "schema-defaults", routes: ["/", "/about/"] };
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
      preview: {
        command: PREVIEW_COMMAND,
        automatedEvidence: "HTTP 200 response containing the Runtime Manifest and ESM entry"
      },
      expected: `Run ${PREVIEW_COMMAND} in this directory, then inspect the listed routes on desktop and mobile.`
    }))
  };
  write(root, "acceptance-report.json", `${JSON.stringify(report, null, 2)}\n`);
}

async function main() {
  if (process.versions.node.split(".")[0] !== "22") {
    throw new Error(`Package integration requires Node.js 22, got ${process.versions.node}`);
  }
  const args = process.argv.slice(2);
  const prepared = acceptanceRoot(args);
  const { root } = prepared;
  try {
    const tarball = packTheme(root);
    const selectedId = args.find(argument => argument.startsWith("--scenario="))?.slice(11)
      || process.env.STELLAR_INTEGRATION_SCENARIO;
    const selected = selectedId
      ? SCENARIO_MATRIX.filter(matrix => matrix.id === selectedId)
      : SCENARIO_MATRIX;
    if (selected.length === 0) throw new Error(`Unknown integration scenario: ${selectedId}`);
    const tooling = installMinifier(root);
    const sites = [];
    for (const matrix of selected) {
      sites.push(await checkSite(path.join(root, matrix.id), matrix, tarball, tooling));
    }
    sites.push(await checkDefaultSite(path.join(root, "default-content"), tarball, tooling));
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

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  INSTALL_PACKAGES,
  assertRuntime
};
