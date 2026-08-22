/* global hexo */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { stringifyReferenceMetadata } = require("./lib/reference-metadata");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "reference/v2-models.json");

function generateReference(options = {}) {
  const output = options.output || OUTPUT;
  const expected = stringifyReferenceMetadata();
  if (options.check) {
    const actual = fs.existsSync(output) ? fs.readFileSync(output, "utf8") : "";
    if (actual !== expected) {
      throw new Error("reference/v2-models.json 与模型 Schema 不一致，请运行 npm run reference:generate");
    }
    return output;
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, expected, "utf8");
  return output;
}

if (require.main === module) {
  const output = generateReference({ check: process.argv.includes("--check") });
  process.stdout.write(`${path.relative(ROOT, output)} ${process.argv.includes("--check") ? "is current" : "generated"}\n`);
}

module.exports = generateReference;
