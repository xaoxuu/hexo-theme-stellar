/* global hexo */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { stringifyReferenceMetadata } = require("./lib/reference-metadata");
const { stringifyConfigReferenceMetadata } = require("./lib/config-reference-metadata");
const { stringifyBlueprintReferenceMetadata } = require("./lib/blueprint-reference-metadata");
const { stringifyConfigFieldAudit } = require("./lib/config-field-audit");
const {
  blueprintReferenceMarkdown,
  configAuditMarkdown,
  configReferenceMarkdown,
  modelReferenceMarkdown,
  referenceIndexMarkdown,
  validatePublicReferenceLinks
} = require("./lib/public-reference");

const ROOT = path.resolve(__dirname, "..");
const MODEL_OUTPUT = path.join(ROOT, "reference/v2-models.json");
const CONFIG_OUTPUT = path.join(ROOT, "reference/v2-config.json");
const BLUEPRINT_OUTPUT = path.join(ROOT, "reference/v2-blueprints.json");
const CONFIG_AUDIT_OUTPUT = path.join(ROOT, "docs/audits/2026-08-24-v2-config-field-audit.json");
const INDEX_OUTPUT = path.join(ROOT, "reference/README.md");
const MODEL_MARKDOWN_OUTPUT = path.join(ROOT, "reference/v2-models.md");
const CONFIG_MARKDOWN_OUTPUT = path.join(ROOT, "reference/v2-config.md");
const BLUEPRINT_MARKDOWN_OUTPUT = path.join(ROOT, "reference/v2-blueprints.md");
const CONFIG_AUDIT_MARKDOWN_OUTPUT = path.join(ROOT, "docs/audits/2026-08-24-v2-config-field-audit.md");

function writeOrCheck(output, expected, message, check) {
  if (check) {
    const actual = fs.existsSync(output) ? fs.readFileSync(output, "utf8") : "";
    if (actual !== expected) throw new Error(message);
    return;
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, expected, "utf8");
}

function generateReference(options = {}) {
  const modelOutput = options.output || MODEL_OUTPUT;
  const configOutput = options.configOutput || (options.output ? null : CONFIG_OUTPUT);
  const blueprintOutput = options.blueprintOutput || (options.output ? null : BLUEPRINT_OUTPUT);
  const configAuditOutput = options.configAuditOutput || (options.output ? null : CONFIG_AUDIT_OUTPUT);
  const publicOutputs = options.publicOutputs === false || options.output
    ? []
    : [
        [INDEX_OUTPUT, referenceIndexMarkdown(), "reference/README.md 与公开 Reference 索引不一致"],
        [MODEL_MARKDOWN_OUTPUT, modelReferenceMarkdown(), "reference/v2-models.md 与模型 Schema 不一致"],
        [CONFIG_MARKDOWN_OUTPUT, configReferenceMarkdown(), "reference/v2-config.md 与配置 Schema 不一致"],
        [BLUEPRINT_MARKDOWN_OUTPUT, blueprintReferenceMarkdown(), "reference/v2-blueprints.md 与 Blueprint Schema/manifest 不一致"]
      ];
  writeOrCheck(
    modelOutput,
    stringifyReferenceMetadata(),
    "reference/v2-models.json 与模型 Schema 不一致，请运行 npm run reference:generate",
    options.check
  );
  if (configOutput) {
    writeOrCheck(
      configOutput,
      stringifyConfigReferenceMetadata(),
      "reference/v2-config.json 与配置 Schema 不一致，请运行 npm run reference:generate",
      options.check
    );
  }
  if (blueprintOutput) {
    writeOrCheck(
      blueprintOutput,
      stringifyBlueprintReferenceMetadata(),
      "reference/v2-blueprints.json 与 Blueprint Schema/manifest 不一致，请运行 npm run reference:generate",
      options.check
    );
  }
  if (configAuditOutput) {
    writeOrCheck(
      configAuditOutput,
      stringifyConfigFieldAudit(),
      "docs/audits/2026-08-24-v2-config-field-audit.json 与配置审计不一致，请运行 npm run reference:generate",
      options.check
    );
    writeOrCheck(
      CONFIG_AUDIT_MARKDOWN_OUTPUT,
      configAuditMarkdown(),
      "docs/audits/2026-08-24-v2-config-field-audit.md 与配置审计不一致，请运行 npm run reference:generate",
      options.check
    );
  }
  for (const [output, expected, message] of publicOutputs) {
    writeOrCheck(output, expected, `${message}，请运行 npm run reference:generate`, options.check);
  }
  if (options.check && publicOutputs.length > 0) validatePublicReferenceLinks(ROOT);
  return modelOutput;
}

if (require.main === module) {
  const check = process.argv.includes("--check");
  generateReference({ check });
  const state = check ? "is current" : "generated";
  process.stdout.write(`${path.relative(ROOT, MODEL_OUTPUT)} ${state}\n`);
  process.stdout.write(`${path.relative(ROOT, CONFIG_OUTPUT)} ${state}\n`);
  process.stdout.write(`${path.relative(ROOT, BLUEPRINT_OUTPUT)} ${state}\n`);
  process.stdout.write(`${path.relative(ROOT, CONFIG_AUDIT_OUTPUT)} ${state}\n`);
  process.stdout.write(`${path.relative(ROOT, INDEX_OUTPUT)} ${state}\n`);
  process.stdout.write(`${path.relative(ROOT, MODEL_MARKDOWN_OUTPUT)} ${state}\n`);
  process.stdout.write(`${path.relative(ROOT, CONFIG_MARKDOWN_OUTPUT)} ${state}\n`);
  process.stdout.write(`${path.relative(ROOT, BLUEPRINT_MARKDOWN_OUTPUT)} ${state}\n`);
  process.stdout.write(`${path.relative(ROOT, CONFIG_AUDIT_MARKDOWN_OUTPUT)} ${state}\n`);
}

module.exports = generateReference;
