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
  return {
    root,
    configSchema: {
      properties: {
        services: {
          runtimeKey: "services",
          properties: {
            example: {
              runtimeKey: "example",
              properties: {
                endpoint: { runtimeKey: "endpoint", type: ["string"] }
              }
            }
          }
        }
      }
    }
  };
}

test("代码围栏从链接与配置事实扫描中排除", () => {
  const markdown = [
    "保留 `services.example.endpoint`。",
    "```md",
    "[失效](missing.md) `services.example.typo`",
    "```",
    "~~~yaml",
    "services.example.typo: true",
    "~~~"
  ].join("\n");
  const stripped = stripFencedCode(markdown);
  assert.match(stripped, /services\.example\.endpoint/);
  assert.doesNotMatch(stripped, /missing\.md/);
  assert.doesNotMatch(stripped, /example\.typo/);
});

test("有效链接、当前配置与宿主对象形成零发现", (t) => {
  const { root, configSchema } = fixture(t);
  write(root, "docs/knowledge/guide.md", "# 有效标题\n");
  write(root, "docs/knowledge/index.md", [
    "# 索引",
    "",
    "[有效链接](guide.md#有效标题)",
    "",
    "`services.example`",
    "`services.example.endpoint`",
    "`site.posts` 是 Hexo 集合。",
    "",
    "```md",
    "[示例失效链接](missing.md)",
    "`services.example.typo`",
    "```",
    "",
    "version: 1.2.3"
  ].join("\n"));

  const result = checkKnowledge({ root, configSchema });
  assert.deepEqual(result.errors, []);
  assert.equal(result.linksChecked, 1);
  assert.equal(result.configReferencesChecked, 2);
  assert.equal(result.versionReferencesChecked, 1);
});

test("失效链接、锚点、配置字段与版本全部阻断", (t) => {
  const { root, configSchema } = fixture(t);
  write(root, "docs/knowledge/guide.md", "# 有效标题\n");
  write(root, "docs/knowledge/index.md", [
    "# 索引",
    "",
    "[缺失文件](missing.md)",
    "[缺失锚点](guide.md#不存在)",
    "`services.example.typo`",
    "version: 9.9.9"
  ].join("\n"));

  const result = checkKnowledge({ root, configSchema });
  assert.equal(result.errors.length, 4);
  assert.ok(result.errors.some(error => error.kind === "missing-link"));
  assert.ok(result.errors.some(error => error.kind === "missing-anchor"));
  assert.ok(result.errors.some(error => error.kind === "unknown-config"));
  assert.ok(result.errors.some(error => error.kind === "version-mismatch"));
});

test("退出的主题配置根不会逃过知识库检查", (t) => {
  const { root, configSchema } = fixture(t);
  write(root, "docs/knowledge/index.md", [
    "# 索引",
    "",
    "`extensions.services.github.raw_url`",
    "`content.article.footer.show_tags`",
    "`layout.profiles.post`"
  ].join("\n"));

  const result = checkKnowledge({ root, configSchema });
  assert.equal(result.errors.length, 3);
  assert.equal(result.errors.every(error => error.kind === "retired-config"), true);
});
