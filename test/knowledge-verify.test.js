"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");

test("知识库核查器识别稳定版与 alpha/beta/rc SemVer", () => {
  const source = [
    "import importlib.util, json",
    "spec = importlib.util.spec_from_file_location('verify', 'docs/knowledge/tools/verify.py')",
    "module = importlib.util.module_from_spec(spec)",
    "spec.loader.exec_module(module)",
    "text = 'version: 1.44.0\\nversion: 2.0.0-alpha.1\\nversion: 2.0.0-beta.2\\nversion: 2.0.0-rc.3'",
    "print(json.dumps(sorted(module.extract_facts(text)[3])))"
  ].join("; ");
  const result = spawnSync("python3", ["-c", source], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), ["1.44.0", "2.0.0-alpha.1", "2.0.0-beta.2", "2.0.0-rc.3"]);
});
