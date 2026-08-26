"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { checkKnowledge, stripFencedCode } = require("../ci/check-knowledge");

function write(root, relative, contents) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents, "utf8");
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-knowledge-check-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  write(root, "package.json", JSON.stringify({ version: "1.2.3" }));
  write(root, "reference/v2-config.json", JSON.stringify({
    fields: [
      {
        scope: "theme",
        path: "extensions.services.example.endpoint",
        runtimePath: "extensions.services.example.endpoint"
      }
    ]
  }));
  write(root, "docs/audits/config-field-audit.json", JSON.stringify({
    fields: [
      { path: "extensions.cache", accepted: false }
    ]
  }));
  return root;
}

test("代码围栏从链接与配置事实扫描中排除", () => {
  const markdown = [
    "保留 `extensions.services.example.endpoint`。",
    "```md",
    "[失效](missing.md) `extensions.services.example.typo`",
    "```",
    "~~~yaml",
    "extensions.services.example.typo: true",
    "~~~"
  ].join("\n");
  const stripped = stripFencedCode(markdown);
  assert.match(stripped, /extensions\.services\.example\.endpoint/);
  assert.doesNotMatch(stripped, /missing\.md/);
  assert.doesNotMatch(stripped, /example\.typo/);
});

test("有效链接、当前配置、退出字段与宿主对象形成零发现", (t) => {
  const root = fixture(t);
  write(root, "docs/knowledge/guide.md", "# 有效标题\n");
  write(root, "docs/knowledge/index.md", [
    "# 索引",
    "",
    "[有效链接](guide.md#有效标题)",
    "",
    "`extensions.services.example.endpoint`",
    "`extensions.cache` 已退出配置。",
    "`site.posts` 是 Hexo 集合。",
    "",
    "```md",
    "[示例失效链接](missing.md)",
    "`extensions.services.example.typo`",
    "```",
    "",
    "version: 1.2.3"
  ].join("\n"));

  const result = checkKnowledge({
    root,
    configAuditPath: "docs/audits/config-field-audit.json"
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.linksChecked, 1);
  assert.equal(result.configReferencesChecked, 2);
  assert.equal(result.versionReferencesChecked, 1);
});

test("失效链接、锚点、配置字段与版本全部阻断", (t) => {
  const root = fixture(t);
  write(root, "docs/knowledge/guide.md", "# 有效标题\n");
  write(root, "docs/knowledge/index.md", [
    "# 索引",
    "",
    "[缺失文件](missing.md)",
    "[缺失锚点](guide.md#不存在)",
    "`extensions.services.example.typo`",
    "version: 9.9.9"
  ].join("\n"));

  const result = checkKnowledge({
    root,
    configAuditPath: "docs/audits/config-field-audit.json"
  });
  assert.equal(result.errors.length, 4);
  assert.ok(result.errors.some(error => error.kind === "missing-link"));
  assert.ok(result.errors.some(error => error.kind === "missing-anchor"));
  assert.ok(result.errors.some(error => error.kind === "unknown-config"));
  assert.ok(result.errors.some(error => error.kind === "version-mismatch"));
});
