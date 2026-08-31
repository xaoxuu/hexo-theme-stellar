"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { formatDoctorJson, formatDoctorText, runDoctor } = require("../scripts/lib/doctor");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "stellar-doctor-test-"));
}

function initializedSite() {
  const baseDir = tempDir();
  fs.writeFileSync(path.join(baseDir, "_config.yml"), "title: Test\ntheme: stellar\n");
  fs.mkdirSync(path.join(baseDir, "source/_posts"), { recursive: true });
  fs.writeFileSync(path.join(baseDir, "source/_posts/hello.md"), "---\ntitle: Hello\ndate: 2026-08-23 12:34\n---\n\nHello.\n");
  return baseDir;
}

test("doctor 通过最小 Hexo 站点的环境、配置与 Front Matter 检查", () => {
  const result = runDoctor({ baseDir: initializedSite(), nodeVersion: "22.18.0", hexoVersion: "8.0.0" });
  assert.equal(result.ok, true, formatDoctorText(result));
  assert.equal(Object.isFrozen(result), true);
  assert.equal(result.issues.length, 0);
});

test("doctor 聚合环境、主题配置、Collection 与 Front Matter 的来源化问题", () => {
  const baseDir = tempDir();
  fs.mkdirSync(path.join(baseDir, "source/_data/wiki"), { recursive: true });
  fs.mkdirSync(path.join(baseDir, "source/wiki/example"), { recursive: true });
  fs.writeFileSync(path.join(baseDir, "_config.yml"), "theme: landscape\n");
  fs.writeFileSync(path.join(baseDir, "_config.stellar.yml"), "legacy: true\n");
  fs.writeFileSync(path.join(baseDir, "source/_data/wiki/example.yml"), "name: Example\nunknown: true\n");
  fs.writeFileSync(path.join(baseDir, "source/wiki/example/index.md"), "---\ncollection:\n  profile: wiki\n---\n");

  const result = runDoctor({ baseDir, nodeVersion: "20.0.0", hexoVersion: "7.3.0" });
  assert.equal(result.ok, false);
  for (const item of result.issues) {
    assert.deepEqual(Object.keys(item), ["code", "source", "path", "actualType", "expected", "migration"]);
  }
  assert.equal(result.issues.some(item => item.source === "environment" && item.path === "node"), true);
  assert.equal(result.issues.some(item => item.source === "_config.yml" && item.path === "theme"), true);
  assert.equal(result.issues.some(item => item.source === "_config.stellar.yml" && item.path === "legacy"), true);
  assert.equal(result.issues.some(item => item.source.endsWith("example.yml") && item.path === "unknown"), true);
  assert.equal(result.issues.some(item => item.source.endsWith("index.md") && item.path === "collection.id"), true);
});

test("doctor text/json 输出稳定表达同一结果", () => {
  const result = runDoctor({ baseDir: initializedSite(), nodeVersion: "22.0.0", hexoVersion: "8.1.0" });
  assert.match(formatDoctorText(result), /^Stellar doctor: PASS/);
  assert.deepEqual(JSON.parse(formatDoctorJson(result)), result);
});

test("doctor 接受 BOM 与 CRLF Front Matter", () => {
  const baseDir = initializedSite();
  const page = path.join(baseDir, "source/_posts/crlf.md");
  fs.writeFileSync(page, "\uFEFF---\r\ntitle: CRLF\r\n---\r\nBody\r\n");
  const result = runDoctor({ baseDir, nodeVersion: "22.0.0", hexoVersion: "8.1.0" });
  assert.equal(result.ok, true, formatDoctorText(result));
});

test("doctor 允许缺失或空主题覆盖，并接受普通 Post/Page 与三类唯一归属推断", () => {
  for (const emptyOverride of [false, true]) {
    const baseDir = tempDir();
    fs.writeFileSync(path.join(baseDir, "_config.yml"), "title: Defaults\ntheme: stellar\n");
    if (emptyOverride) fs.writeFileSync(path.join(baseDir, "_config.stellar.yml"), "");
    fs.mkdirSync(path.join(baseDir, "source/_data/wiki"), { recursive: true });
    fs.mkdirSync(path.join(baseDir, "source/_data/topic"), { recursive: true });
    fs.mkdirSync(path.join(baseDir, "source/_data/notebooks"), { recursive: true });
    fs.mkdirSync(path.join(baseDir, "source/_posts"), { recursive: true });
    fs.mkdirSync(path.join(baseDir, "source/about"), { recursive: true });
    fs.mkdirSync(path.join(baseDir, "source/wiki/docs"), { recursive: true });
    fs.mkdirSync(path.join(baseDir, "source/notebooks/dev"), { recursive: true });
    fs.writeFileSync(path.join(baseDir, "source/_data/wiki/docs.yml"), "name: Docs\nroute:\n  path: wiki/docs\nnavigation:\n  tree: [index]\n");
    fs.writeFileSync(path.join(baseDir, "source/_data/topic/alpha.yml"), "name: Alpha\nroute:\n  start: alpha-topic\n");
    fs.writeFileSync(path.join(baseDir, "source/_data/notebooks/dev.yml"), "name: Dev\n");
    fs.writeFileSync(path.join(baseDir, "source/_posts/plain.md"), "---\ntitle: Plain\n---\nBody\n");
    fs.writeFileSync(path.join(baseDir, "source/_posts/alpha-topic.md"), "---\ntitle: Alpha\n---\nBody\n");
    fs.writeFileSync(path.join(baseDir, "source/about/index.md"), "---\ntitle: About\n---\nBody\n");
    fs.writeFileSync(path.join(baseDir, "source/wiki/docs/index.md"), "---\ntitle: Docs\n---\nBody\n");
    fs.writeFileSync(path.join(baseDir, "source/notebooks/dev/note.md"), "---\ntitle: Note\n---\nBody\n");

    const result = runDoctor({ baseDir, nodeVersion: "22.0.0", hexoVersion: "8.1.0" });
    assert.equal(result.ok, true, formatDoctorText(result));
    assert.equal(result.checked.themeConfig, emptyOverride);
    assert.match(formatDoctorText(result), emptyOverride ? /theme config/ : /Schema defaults/);
  }
});

test("doctor 的归属诊断包含来源、候选 Collection 与最小修复", () => {
  const baseDir = tempDir();
  fs.writeFileSync(path.join(baseDir, "_config.yml"), "theme: stellar\n");
  fs.mkdirSync(path.join(baseDir, "source/_data/wiki"), { recursive: true });
  fs.mkdirSync(path.join(baseDir, "source/guide"), { recursive: true });
  fs.mkdirSync(path.join(baseDir, "source/wiki/a"), { recursive: true });
  fs.mkdirSync(path.join(baseDir, "source/notebooks/missing"), { recursive: true });
  fs.writeFileSync(path.join(baseDir, "source/_data/wiki/a.yml"), "name: a\nroute:\n  path: guide\nnavigation:\n  tree: [intro, only-a]\n");
  fs.writeFileSync(path.join(baseDir, "source/_data/wiki/b.yml"), "name: b\nroute:\n  path: guide\nnavigation:\n  tree: [intro]\n");
  fs.writeFileSync(path.join(baseDir, "source/guide/intro.md"), "---\ntitle: Intro\n---\n");
  fs.writeFileSync(path.join(baseDir, "source/guide/only-a.md"), "---\ntitle: Conflict\ncollection:\n  profile: wiki\n  id: b\n---\n");
  fs.writeFileSync(path.join(baseDir, "source/notebooks/missing/note.md"), "---\ntitle: Missing\n---\n");

  const result = runDoctor({ baseDir, nodeVersion: "22.0.0", hexoVersion: "8.1.0" });
  assert.equal(result.ok, false);
  assert.equal(result.issues.some(item => item.code === "collection_ambiguous" && /wiki:a, wiki:b/.test(item.expected)), true);
  assert.equal(result.issues.some(item => item.code === "collection_conflict" && item.source.endsWith("source/guide/only-a.md") && /candidates=wiki:a/.test(item.expected)), true);
  assert.equal(result.issues.some(item => item.code === "collection_not_found" && /create source\/_data\/notebooks\/missing\.yml/.test(item.expected)), true);
});
