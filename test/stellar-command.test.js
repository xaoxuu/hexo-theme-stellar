"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const commandPath = path.join(__dirname, "../scripts/commands/stellar.js");

test("stellar 命令只编排 init/doctor/new note 并公开参数", () => {
  const source = fs.readFileSync(commandPath, "utf8");
  assert.match(source, /console\.register\("stellar"/);
  assert.match(source, /subcommand === "init"/);
  assert.match(source, /subcommand === "doctor"/);
  assert.match(source, /subcommand === "new"/);
  assert.match(source, /args\._\[1\] === "note"/);
  for (const option of ["--blueprint", "--style", "--dry-run", "--non-interactive", "--format", "--notebook", "--title", "--tags"]) {
    assert.equal(source.includes(option), true);
  }
  assert.doesNotMatch(source, /writeFileSync|parseStellarConfig|parseCollectionConfig|parsePageConfig|mkdirSync/);
});
