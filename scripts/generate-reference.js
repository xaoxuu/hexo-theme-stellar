/* global hexo */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { stringifyReferenceMetadata } = require("./lib/reference-metadata");
const { stringifyConfigReferenceMetadata } = require("./lib/config-reference-metadata");

const ROOT = path.resolve(__dirname, "..");
const MODEL_OUTPUT = path.join(ROOT, "reference/v2-models.json");
const CONFIG_OUTPUT = path.join(ROOT, "reference/v2-config.json");

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
  return modelOutput;
}

if (require.main === module) {
  const check = process.argv.includes("--check");
  generateReference({ check });
  const state = check ? "is current" : "generated";
  process.stdout.write(`${path.relative(ROOT, MODEL_OUTPUT)} ${state}\n`);
  process.stdout.write(`${path.relative(ROOT, CONFIG_OUTPUT)} ${state}\n`);
}

module.exports = generateReference;
