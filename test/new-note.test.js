"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  NewNoteConflictError,
  buildNewNotePlan,
  normalizeTags,
  writeNewNotePlan
} = require("../scripts/lib/new-note");

function fixture() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-new-note-"));
  const sourceDir = path.join(baseDir, "source");
  fs.mkdirSync(path.join(sourceDir, "_data", "notebooks"), { recursive: true });
  fs.writeFileSync(path.join(sourceDir, "_data", "notebooks", "dev.yml"), "name: Dev Notes\n", "utf8");
  return { baseDir, sourceDir };
}

test("new note dry-run 生成冻结的最小 Front Matter 计划", t => {
  const root = fixture();
  t.after(() => fs.rmSync(root.baseDir, { recursive: true, force: true }));
  const plan = buildNewNotePlan({
    ...root,
    notebook: "dev",
    title: "Node 入门",
    tags: "Node, tools/cli,Node",
    generatedAt: new Date(2026, 7, 25, 12, 34)
  });
  assert.equal(plan.target, "source/notebooks/dev/Node 入门.md");
  assert.deepEqual(plan.tags, ["Node", "tools/cli"]);
  assert.match(plan.content, /date: 2026-08-25 12:34/);
  assert.match(plan.content, /title: "Node 入门"/);
  assert.doesNotMatch(plan.content, /collection:|profile:|\nid:/);
  assert.equal(fs.existsSync(plan.outputPath), false);
  assert.equal(Object.isFrozen(plan), true);
});
test("new note 真实写入严格复用计划并拒绝覆盖", t => {
  const root = fixture();
  t.after(() => fs.rmSync(root.baseDir, { recursive: true, force: true }));
  const plan = buildNewNotePlan({ ...root, notebook: "dev", title: "Hello", generatedAt: 0 });
  writeNewNotePlan(plan);
  assert.equal(fs.readFileSync(plan.outputPath, "utf8"), plan.content);
  assert.throws(() => buildNewNotePlan({ ...root, notebook: "dev", title: "Hello" }), NewNoteConflictError);
  assert.throws(() => writeNewNotePlan(plan), NewNoteConflictError);
});

test("new note 拒绝未知 Notebook、路径字符与非法 tags", t => {
  const root = fixture();
  t.after(() => fs.rmSync(root.baseDir, { recursive: true, force: true }));
  assert.throws(() => buildNewNotePlan({ ...root, notebook: "missing", title: "Hello" }), /未知 Notebook/);
  assert.throws(() => buildNewNotePlan({ ...root, notebook: "dev", title: "..\/escape" }), /保留字符/);
  assert.throws(() => buildNewNotePlan({ ...root, notebook: "..", title: "Hello" }), /保留字符/);
  assert.throws(() => normalizeTags("ok,bad\ntag"), /不能包含换行/);
});
