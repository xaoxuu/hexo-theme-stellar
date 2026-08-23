"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const commandPath = path.join(__dirname, "../scripts/commands/stellar.js");

test("stellar 命令只编排 init/doctor 并公开 M3 参数", () => {
  const source = fs.readFileSync(commandPath, "utf8");
  assert.match(source, /console\.register\("stellar"/);
  assert.match(source, /subcommand === "init"/);
  assert.match(source, /subcommand === "doctor"/);
  for (const option of ["--blueprint", "--style", "--dry-run", "--non-interactive", "--format"]) {
    assert.equal(source.includes(option), true);
  }
  assert.doesNotMatch(source, /writeFileSync|parseStellarConfig|parseCollectionConfig|parsePageConfig/);
});
