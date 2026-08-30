"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

let registration;
global.hexo = {
  extend: {
    console: {
      register(name, description, contract, handler) {
        registration = { name, description, contract, handler };
      }
    }
  }
};
const commandPath = require.resolve("../scripts/commands/stellar");
delete require.cache[commandPath];
require(commandPath);
delete global.hexo;

test("stellar command registers a functional dry-run dispatcher", async t => {
  assert.equal(registration.name, "stellar");
  assert.equal(typeof registration.handler, "function");
  assert.deepEqual(registration.contract.commands.map(item => item.name), ["init", "doctor", "new note"]);

  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-command-test-"));
  t.after(() => fs.rmSync(baseDir, { recursive: true, force: true }));
  t.mock.method(console, "log", () => {});
  const plan = await registration.handler.call({
    base_dir: baseDir,
    theme_dir: path.resolve(__dirname, "..")
  }, {
    _: ["init"],
    blueprint: "classic",
    nonInteractive: true,
    dryRun: true
  });
  assert.equal(plan.blueprint.id, "classic");
  assert.equal(plan.files.length > 0, true);
  assert.equal(fs.existsSync(path.join(baseDir, "_config.stellar.yml")), false);

  await assert.rejects(
    registration.handler.call({}, { _: ["unknown"] }),
    /Usage: hexo stellar/
  );
});
