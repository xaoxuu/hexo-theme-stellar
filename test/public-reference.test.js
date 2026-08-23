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

test("公开配置 Reference 覆盖每个 Schema 字段的完整注解", () => {
  const metadata = generateConfigReferenceMetadata();
  const markdown = configReferenceMarkdown(metadata);
  for (const field of metadata.fields) {
    assert.ok(Array.isArray(field.type) && field.type.length > 0, `${field.path}: type`);
    assert.ok(Object.prototype.hasOwnProperty.call(field, "default"), `${field.path}: default`);
    assert.equal(typeof field.scope, "string", `${field.path}: scope`);
    assert.ok(Array.isArray(field.consumers) && field.consumers.length > 0, `${field.path}: consumers`);
    assert.ok(Object.prototype.hasOwnProperty.call(field, "example"), `${field.path}: example`);
  }
  assert.equal(markdown.split("\n").filter(line => / \| <code>\[/.test(line)).length, metadata.fields.length);
  assert.equal(fs.readFileSync(path.join(ROOT, "reference/v2-config.md"), "utf8"), markdown);
});

test("公开模型与 Blueprint Reference 稳定来自机器契约", () => {
  const models = modelReferenceMarkdown(generateReferenceMetadata());
  const blueprints = blueprintReferenceMarkdown(generateBlueprintReferenceMetadata());
  assert.equal(fs.readFileSync(path.join(ROOT, "reference/v2-models.md"), "utf8"), models);
  assert.equal(fs.readFileSync(path.join(ROOT, "reference/v2-blueprints.md"), "utf8"), blueprints);
  assert.equal(fs.readFileSync(path.join(ROOT, "reference/README.md"), "utf8"), referenceIndexMarkdown());
  assert.match(models, /## PageViewModel:post/);
  assert.match(models, /render\.article\.comments\.options/);
  assert.match(blueprints, /classic-blog/);
  assert.match(blueprints, /--non-interactive/);
});

test("公开 Reference 与 Alpha 文档的仓库内链接和锚点有效", () => {
  const files = validatePublicReferenceLinks(ROOT);
  assert.ok(files.some(file => file.endsWith("ALPHA.md")));
  assert.ok(files.some(file => file.endsWith("reference/README.md")));
});
