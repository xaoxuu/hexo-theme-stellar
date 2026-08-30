"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { generateReferenceMetadata } = require("../scripts/lib/reference-metadata");
const { generateConfigReferenceMetadata } = require("../scripts/lib/config-reference-metadata");
const { generateBlueprintReferenceMetadata } = require("../scripts/lib/blueprint-reference-metadata");
const {
  blueprintReferenceMarkdown,
  configReferenceMarkdown,
  modelReferenceMarkdown,
  referenceIndexMarkdown,
  validatePublicReferenceLinks
} = require("../scripts/lib/public-reference");

const ROOT = path.resolve(__dirname, "..");

test("公开配置 Reference 只包含路径、类型、默认值与例外约束", () => {
  const metadata = generateConfigReferenceMetadata();
  const markdown = configReferenceMarkdown(metadata);
  for (const field of metadata.fields) {
    assert.ok(Array.isArray(field.type) && field.type.length > 0, `${field.path}: type`);
    assert.ok(Object.prototype.hasOwnProperty.call(field, "default"), `${field.path}: default`);
    assert.equal(typeof field.surface, "string", `${field.path}: surface`);
    assert.equal(typeof field.runtimePath, "string", `${field.path}: runtimePath`);
    assert.equal(Object.prototype.hasOwnProperty.call(field, "consumers"), false, `${field.path}: consumers`);
    assert.equal(Object.prototype.hasOwnProperty.call(field, "cascade"), false, `${field.path}: cascade`);
    assert.equal(Object.prototype.hasOwnProperty.call(field, "normalization"), false, `${field.path}: normalization`);
  }
  assert.equal(markdown.split("\n").filter(line => line.startsWith("| ") && !line.startsWith("| Path") && !line.startsWith("| ---")).length, metadata.fields.length);
  assert.equal(fs.readFileSync(path.join(ROOT, "reference/v2-config.md"), "utf8"), markdown);
  assert.doesNotMatch(markdown, /Consumers|Cascade \/ normalize/);
});

test("公开模型与 Blueprint Reference 稳定来自机器契约", () => {
  const models = modelReferenceMarkdown(generateReferenceMetadata());
  const blueprints = blueprintReferenceMarkdown(generateBlueprintReferenceMetadata());
  assert.equal(fs.readFileSync(path.join(ROOT, "reference/v2-models.md"), "utf8"), models);
  assert.equal(fs.readFileSync(path.join(ROOT, "reference/v2-blueprints.md"), "utf8"), blueprints);
  assert.equal(fs.readFileSync(path.join(ROOT, "reference/README.md"), "utf8"), referenceIndexMarkdown());
  assert.match(models, /## PageViewModel:post/);
  assert.match(models, /render\.article\.comments\.options/);
  assert.match(blueprints, /light-and-shadow/);
  assert.doesNotMatch(blueprints, /classic-blog|--style stellar/);
  assert.match(blueprints, /--non-interactive/);
});

test("公开 Reference 的仓库内链接和锚点有效", () => {
  const files = validatePublicReferenceLinks(ROOT);
  assert.equal(files.some(file => file.endsWith("ALPHA.md")), false);
  assert.ok(files.some(file => file.endsWith("reference/README.md")));
});
