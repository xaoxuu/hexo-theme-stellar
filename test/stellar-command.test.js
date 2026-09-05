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

test("stellar command registers doctor and new note", async t => {
  assert.equal(registration.name, "stellar");
  assert.equal(typeof registration.handler, "function");
  assert.deepEqual(registration.contract.commands.map(item => item.name), ["doctor", "new note"]);

  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-command-test-"));
  t.after(() => fs.rmSync(baseDir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(baseDir, "_config.yml"), "theme: stellar\n");
  t.mock.method(console, "log", () => {});
  const result = await registration.handler.call({
    base_dir: baseDir,
    version: "8.1.2"
  }, {
    _: ["doctor"],
    format: "json"
  });
  assert.equal(result.ok, true);

  await assert.rejects(
    registration.handler.call({}, { _: ["unknown"] }),
    /Usage: hexo stellar/
  );
});
