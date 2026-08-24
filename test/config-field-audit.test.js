"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const { generateConfigReferenceMetadata } = require("../scripts/lib/config-reference-metadata");
const {
  DISPOSITIONS,
  RETIRED_FIELDS,
  generateConfigFieldAudit
} = require("../scripts/lib/config-field-audit");
const INTERNAL_CONSTANTS = require("../scripts/lib/internal-constants");
const createCopyTag = require("../scripts/tags/lib/copy");
const createOkrTag = require("../scripts/tags/lib/okr");

const ROOT = path.resolve(__dirname, "..");

function leafPaths(value, prefix = "") {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key));
}

function createTagContext(messages) {
  return {
    config: { language: "en" },
    theme: { i18n: { __: () => key => messages[key] || key } },
    stellar: {
      config: {
        extensions: {
          tags: {
            okr: {
              status: {
                in_track: { color: "blue", label: null },
                at_risk: { color: "orange", label: null },
                off_track: { color: "red", label: null },
                finished: { color: "green", label: null },
                unfinished: { color: "gray", label: null }
              }
            }
          }
        }
      }
    },
    args: {
      map(input, named, positional) {
        const result = {};
        const rest = [];
        for (const token of input) {
          const separator = token.indexOf(":");
          const key = separator > 0 ? token.slice(0, separator) : "";
          if (named.includes(key)) result[key] = token.slice(separator + 1);
          else rest.push(token);
        }
        const positionalKeys = Array.isArray(positional) ? positional : [positional];
        if (positionalKeys.length === 1) result[positionalKeys[0]] = rest.join(" ");
        else positionalKeys.forEach((key, index) => { result[key] = rest[index]; });
        return result;
      },
      joinTags() { return []; }
    },
    utils: { icon: () => "<svg></svg>" },
    render: { renderSync: ({ text }) => text }
  };
}

test("M6 配置审计覆盖当前与退出字段且每项只有一个结论", () => {
  const reference = generateConfigReferenceMetadata();
  const audit = generateConfigFieldAudit();
  const accepted = audit.fields.filter(field => field.accepted);
  const retired = audit.fields.filter(field => !field.accepted);

  assert.equal(accepted.length, new Set(reference.fields.map(field => `${field.scope}:${field.path}`)).size);
  assert.equal(retired.length, RETIRED_FIELDS.length);
  assert.equal(new Set(audit.fields.map(field => `${field.scope}:${field.path}:${field.accepted}`)).size, audit.fields.length);
  for (const field of audit.fields) {
    assert.ok(DISPOSITIONS.includes(field.disposition), `${field.path}: disposition`);
    assert.ok(typeof field.rationale === "string" && field.rationale.length > 0, `${field.path}: rationale`);
    assert.ok(typeof field.defaultSource === "string" && field.defaultSource.length > 0, `${field.path}: defaultSource`);
    assert.ok(Array.isArray(field.consumers) && field.consumers.length > 0, `${field.path}: consumers`);
  }
  assert.ok(retired.some(field => field.path === "extensions.cache" && field.disposition === "internalize"));
  assert.ok(retired.some(field => field.path === "extensions.tags.copy" && field.disposition === "remove"));
  assert.ok(retired.some(field => field.path === "extensions.tags.copy.toast" && field.disposition === "localize"));
  assert.ok(accepted.some(field => field.path === "extensions.comments.title" && field.disposition === "localize"));
});

test("三套内置语言键一致且 M6 系统文案不再写入公开主题默认", () => {
  const languages = ["en", "zh-CN", "zh-TW"].map(id => yaml.load(
    fs.readFileSync(path.join(ROOT, "languages", `${id}.yml`), "utf8")
  ));
  const keys = languages.map(language => leafPaths(language).sort());
  assert.deepEqual(keys[1], keys[0]);
  assert.deepEqual(keys[2], keys[0]);
  for (const key of [
    "message.copy_denied",
    "message.copy_unsupported",
    "tag_plugins.okr.status.finished"
  ]) assert.ok(keys[0].includes(key), key);

  const themeConfig = fs.readFileSync(path.join(ROOT, "_config.yml"), "utf8");
  for (const text of ["复制成功", "正常", "风险", "延期", "已完成", "未完成", "AI摘要", "介绍自己", "推荐文章", "生成摘要", "矩阵穿梭"]) {
    assert.equal(themeConfig.includes(text), false, text);
  }
});

test("内部常量入口深度冻结并拥有资源、provider、缓存与时序", () => {
  assert.equal(Object.isFrozen(INTERNAL_CONSTANTS), true);
  assert.equal(Object.isFrozen(INTERNAL_CONSTANTS.assets.runtime.modules), true);
  assert.equal(Object.isFrozen(INTERNAL_CONSTANTS.assets.features), true);
  assert.equal(Object.isFrozen(INTERNAL_CONSTANTS.runtime.cache.ttl), true);
  assert.equal(INTERNAL_CONSTANTS.providers.lightbox, "fancybox");
  assert.equal(INTERNAL_CONSTANTS.runtime.request.retries, 2);
  assert.equal(INTERNAL_CONSTANTS.runtime.features.codeCopyFeedbackMs, 3000);
});

test("copy 与 OKR 标签消费当前语言文案", () => {
  const ctx = createTagContext({
    "message.copied": "Localized copied",
    "tag_plugins.okr.status.in_track": "Localized on track",
    "tag_plugins.okr.status.finished": "Localized finished"
  });
  const copy = createCopyTag(ctx)(["hello"]);
  assert.match(copy, /Localized copied/);

  const okr = createOkrTag(ctx)(["o1", "status:in_track"], [
    "Objective",
    "<!-- okr kr1 percent:100 status:finished -->",
    "Key result",
    "<!-- okr kr2 percent:50 status:in_track -->",
    "Another result"
  ].join("\n"));
  assert.match(okr, /Localized on track/);
  assert.match(okr, /Localized finished/);
});
