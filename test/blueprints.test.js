"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const yaml = require("js-yaml");

const {
  BlueprintConflictError,
  BlueprintError,
  buildBlueprintPlan,
  formatBlueprintPlan,
  loadCatalog,
  redundantThemeConfigPaths,
  safeRelativePath,
  writeBlueprintPlan
} = require("../scripts/lib/blueprints");
const { parseConfigSchema, parseStellarConfig } = require("../scripts/lib/config-schema");
const {
  BLUEPRINT_IDS,
  BLUEPRINT_MANIFEST_SCHEMA,
  CLI_CONTRACT,
  VISUAL_STYLE_IDS,
  VISUAL_STYLE_MANIFEST_SCHEMA
} = require("../scripts/schema/blueprint-schema");

const GENERATED_AT = new Date("2026-08-23T12:34:00+08:00");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "stellar-blueprint-test-"));
}

function assertDeepFrozen(value) {
  if (value == null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  Object.values(value).forEach(assertDeepFrozen);
}

test("已注册 Blueprint 与 Visual Style 生成合法且深冻结的显式计划", () => {
  const catalog = loadCatalog();
  assert.ok(Object.keys(catalog.blueprints).length > 0);
  assert.ok(Object.keys(catalog.styles).length > 0);
  assertDeepFrozen(catalog);

  for (const blueprint of Object.keys(catalog.blueprints)) {
    for (const style of Object.keys(catalog.styles)) {
      const plan = buildBlueprintPlan({ catalog, baseDir: tempDir(), blueprint, style, generatedAt: GENERATED_AT });
      assert.equal(plan.blueprint.id, blueprint);
      assert.equal(plan.style.id, style);
      assert.equal(plan.files.some(file => file.target === "_config.stellar.yml"), true);
      const config = plan.files.find(file => file.target === "_config.stellar.yml");
      assert.equal(config.content.includes("{{"), false);
      const rawConfig = yaml.load(config.content);
      parseStellarConfig({ source: config.target, themeConfig: rawConfig });
      assert.deepEqual(redundantThemeConfigPaths(rawConfig), []);
      assertDeepFrozen(plan);
    }
  }
});

test("真实写入严格复用计划且生成结果不包含 Blueprint 锁或运行时引用", () => {
  const baseDir = tempDir();
  const plan = buildBlueprintPlan({ baseDir, blueprint: "docs-reference", style: "minimal", generatedAt: GENERATED_AT });
  assert.match(formatBlueprintPlan(plan, { dryRun: true }), /^Stellar init dry-run:/);
  assert.equal(fs.existsSync(path.join(baseDir, "_config.stellar.yml")), false);

  writeBlueprintPlan(plan);
  for (const file of plan.files) assert.equal(fs.readFileSync(file.outputPath, "utf8"), file.content);
  const generated = fs.readFileSync(path.join(baseDir, "_config.stellar.yml"), "utf8");
  assert.doesNotMatch(generated, /blueprint|visual_style|{{/i);
  assert.equal(fs.existsSync(path.join(baseDir, ".stellar-lock")), false);
});

test("任一目标冲突会在写入前拒绝整份计划", () => {
  const baseDir = tempDir();
  fs.writeFileSync(path.join(baseDir, "_config.stellar.yml"), "existing\n");
  assert.throws(() => buildBlueprintPlan({ baseDir, blueprint: "classic" }), error => {
    assert.equal(error instanceof BlueprintConflictError, true);
    assert.deepEqual(error.conflicts, ["_config.stellar.yml"]);
    return true;
  });
  assert.equal(fs.existsSync(path.join(baseDir, "source/_posts/welcome-to-stellar.md")), false);
});

test("写入中途失败会回滚本次已经创建的文件", () => {
  const baseDir = tempDir();
  fs.writeFileSync(path.join(baseDir, "blocked"), "existing\n");
  const plan = {
    baseDir,
    files: [
      { target: "created.txt", outputPath: path.join(baseDir, "created.txt"), content: "created\n" },
      { target: "blocked/child.txt", outputPath: path.join(baseDir, "blocked/child.txt"), content: "blocked\n" }
    ]
  };
  assert.throws(() => writeBlueprintPlan(plan), /已回滚/);
  assert.equal(fs.existsSync(path.join(baseDir, "created.txt")), false);
  assert.equal(fs.readFileSync(path.join(baseDir, "blocked"), "utf8"), "existing\n");
});

test("未知 ID、绝对路径与路径穿越均被来源化拒绝", () => {
  assert.throws(() => buildBlueprintPlan({ baseDir: tempDir(), blueprint: "unknown" }), BlueprintError);
  assert.throws(() => buildBlueprintPlan({ baseDir: tempDir(), blueprint: "classic", style: "unknown" }), BlueprintError);
  assert.throws(() => safeRelativePath("../secret", "manifest"), /不能逃逸根目录/);
  assert.throws(() => safeRelativePath("/tmp/secret", "manifest"), /不能逃逸根目录/);
  assert.throws(() => safeRelativePath("./", "manifest"), /不能逃逸根目录/);
  assert.throws(() => safeRelativePath("C:\\secret", "manifest"), /不能逃逸根目录/);
});

test("Manifest Schema 声明式拒绝不安全路径与重复目标", () => {
  const manifest = {
    schema_version: 1,
    id: "classic",
    name: "Classic Blog",
    description: "Test",
    default_style: "card",
    files: [
      { source: "../escape", target: "same/path.yml", template: false },
      { source: "valid.yml", target: "same//path.yml", template: false }
    ]
  };
  assert.throws(() => parseConfigSchema(BLUEPRINT_MANIFEST_SCHEMA, manifest, { source: "manifest.json", applyDefaults: false }), error => {
    assert.equal(error.issues.some(item => item.path === "files[0].source"), true);
    assert.equal(error.issues.some(item => item.path === "files[1].target"), true);
    return true;
  });
  assert.throws(() => parseConfigSchema(VISUAL_STYLE_MANIFEST_SCHEMA, {
    schema_version: 1,
    id: "card",
    name: "Stellar",
    description: "Test",
    fragment: "/tmp/escape.yml"
  }, { source: "style.json", applyDefaults: false }), /safe non-empty relative path/);
  assert.throws(() => parseConfigSchema(VISUAL_STYLE_MANIFEST_SCHEMA, {
    schema_version: 1,
    id: "card",
    name: "Stellar",
    description: "Test",
    fragment: ".//"
  }, { source: "style.json", applyDefaults: false }), /safe non-empty relative path/);
});

test("输出路径不能借助站点内符号链接写到根目录之外", () => {
  const baseDir = tempDir();
  const outside = tempDir();
  fs.symlinkSync(outside, path.join(baseDir, "source"), "dir");
  assert.throws(() => buildBlueprintPlan({ baseDir, blueprint: "classic" }), /符号链接/);
});

test("Schema 与目录稳定登记 Blueprint、Style 与 CLI 契约", () => {
  const catalog = loadCatalog();
  assert.deepEqual(BLUEPRINT_IDS, ["classic", "minimal-reading", "docs-reference", "light-and-shadow"]);
  assert.deepEqual(VISUAL_STYLE_IDS, ["card", "flat", "glass", "minimal"]);
  assert.deepEqual(Object.keys(catalog.blueprints), BLUEPRINT_IDS);
  assert.deepEqual(Object.keys(catalog.styles), VISUAL_STYLE_IDS);
  assert.equal(BLUEPRINT_MANIFEST_SCHEMA.sealed, true);
  assert.equal(BLUEPRINT_MANIFEST_SCHEMA.properties.files.validator, "unique_blueprint_targets");
  assert.equal(BLUEPRINT_MANIFEST_SCHEMA.properties.files.items.properties.source.validator, "safe_relative_path");
  assert.deepEqual(CLI_CONTRACT.subcommands.init.options, ["blueprint", "style", "dry-run", "non-interactive"]);
  assert.deepEqual(CLI_CONTRACT.subcommands.doctor.formats, ["text", "json"]);
  assert.deepEqual(CLI_CONTRACT.subcommands.doctor.jsonGlobalOptions, ["silent"]);
});
