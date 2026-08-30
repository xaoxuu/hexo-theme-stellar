"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildBlueprintPlan, writeBlueprintPlan } = require("../scripts/lib/blueprints");
const { formatDoctorJson, formatDoctorText, runDoctor } = require("../scripts/lib/doctor");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "stellar-doctor-test-"));
}

function initializedSite(blueprint) {
  const baseDir = tempDir();
  fs.writeFileSync(path.join(baseDir, "_config.yml"), "title: Test\ntheme: stellar\n");
  writeBlueprintPlan(buildBlueprintPlan({
    baseDir,
    blueprint,
    generatedAt: new Date("2026-08-23T12:34:00+08:00")
  }));
  return baseDir;
}

test("doctor 通过四套 Blueprint 的环境、主题、Collection 与 Front Matter 检查", () => {
  for (const blueprint of ["classic", "minimal-reading", "docs-reference", "light-and-shadow"]) {
    const result = runDoctor({ baseDir: initializedSite(blueprint), nodeVersion: "22.18.0", hexoVersion: "8.0.0" });
    assert.equal(result.ok, true, `${blueprint}: ${formatDoctorText(result)}`);
    assert.equal(Object.isFrozen(result), true);
    assert.equal(result.issues.length, 0);
  }
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
  const result = runDoctor({ baseDir: initializedSite("classic"), nodeVersion: "22.0.0", hexoVersion: "8.1.0" });
  assert.match(formatDoctorText(result), /^Stellar doctor: PASS/);
  assert.deepEqual(JSON.parse(formatDoctorJson(result)), result);
});

test("doctor 对不支持的位置只警告并跳过，ok 保持 true", () => {
  const baseDir = initializedSite("classic");
  fs.writeFileSync(path.join(baseDir, "_config.stellar.yml"), [
    "regions:",
    "  topbar:",
    "    - layout: timeline",
    ""
  ].join("\n"));

  const result = runDoctor({ baseDir, nodeVersion: "22.0.0", hexoVersion: "8.1.0" });
  assert.equal(result.ok, true, formatDoctorText(result));
  assert.equal(result.issues.length, 0);
  assert.ok(result.warnings.length > 0);
  const warning = result.warnings.find(item => item.widget === "timeline" && item.region === "topbar");
  assert.ok(warning);
  assert.equal(warning.severity, "warning");
  assert.match(warning.path, /layout=.*region=topbar/);
  assert.deepEqual(warning.supported, ["leftbar", "rightbar", "drawer"]);
  assert.match(formatDoctorText(result), /Widget timeline .*does not support topbar.*skipped/);
});

test("doctor 将已删除的六个分组根直接报告为未知字段且不提供迁移目标", () => {
  const baseDir = initializedSite("classic");
  fs.writeFileSync(path.join(baseDir, "_config.stellar.yml"), [
    "site: {}",
    "layout: {}",
    "content: {}",
    "seo: {}",
    "resources: {}",
    "extensions: {}",
    ""
  ].join("\n"));

  const result = runDoctor({ baseDir, nodeVersion: "22.0.0", hexoVersion: "8.1.0" });
  assert.equal(result.ok, false);
  assert.deepEqual(result.issues.map(item => item.path), [
    "site", "layout", "content", "seo", "resources", "extensions"
  ]);
  assert.equal(result.issues.every(item => item.code === "unknown_field" && item.migration == null), true);
});

test("doctor 接受 BOM 与 CRLF Front Matter", () => {
  const baseDir = initializedSite("classic");
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
