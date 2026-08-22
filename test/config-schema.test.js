"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const attachConfig = require("../scripts/events/lib/config-schema");
const {
  ConfigSchemaError,
  parseStellarConfig
} = require("../scripts/lib/config-schema");

function assertDeepFrozen(value) {
  if (value == null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  Object.values(value).forEach(assertDeepFrozen);
}

test("canonical Schema 提供稳定默认值并忽略尚未迁移的顶层配置", () => {
  const config = parseStellarConfig({
    source: "themes/stellar/_config.yml",
    themeConfig: { article: { type: "tech" } }
  });

  assert.deepEqual(config, {
    canonical: {
      originalHost: "",
      officialHosts: ["localhost"]
    }
  });
  assertDeepFrozen(config);
});

test("canonical 站点覆盖完成 trim、空值删除与稳定去重", () => {
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      canonical: {
        original_host: "  xaoxuu.com  ",
        official_hosts: [" mirror.example.com ", "", "localhost", "mirror.example.com"]
      }
    }
  });

  assert.deepEqual(config.canonical, {
    originalHost: "xaoxuu.com",
    officialHosts: ["mirror.example.com", "localhost"]
  });
});

test("canonical null 主机规范化为空字符串且不做类型转换", () => {
  assert.equal(parseStellarConfig({
    themeConfig: { canonical: { original_host: null } }
  }).canonical.originalHost, "");

  assert.throws(
    () => parseStellarConfig({
      source: "_config.stellar.yml",
      themeConfig: { canonical: { original_host: 42 } }
    }),
    error => {
      assert.ok(error instanceof ConfigSchemaError);
      assert.deepEqual(error.issues[0], {
        code: "invalid_type",
        source: "_config.stellar.yml",
        path: "canonical.original_host",
        actualType: "number",
        expected: "string | null",
        migration: "configuration/canonical#original-host"
      });
      return true;
    }
  );
});

test("canonical 聚合旧字段、未知字段和数组元素类型诊断", () => {
  assert.throws(
    () => parseStellarConfig({
      source: "_config.stellar.yml",
      themeConfig: {
        canonical: {
          originalHost: "legacy.example.com",
          officialHosts: ["legacy.example.com"],
          extra: true,
          official_hosts: ["mirror.example.com", 7]
        }
      }
    }),
    error => {
      assert.ok(error instanceof ConfigSchemaError);
      assert.deepEqual(error.issues.map(item => item.code), [
        "removed_field",
        "removed_field",
        "unknown_field",
        "invalid_type"
      ]);
      assert.match(error.message, /canonical\.originalHost 已移除/);
      assert.match(error.message, /期望 canonical\.original_host/);
      assert.match(error.message, /未知字段 canonical\.extra/);
      assert.match(error.message, /canonical\.official_hosts\[1\] 应为 string，实际为 number/);
      return true;
    }
  );
});

test("构建事件把冻结配置挂载到 hexo.stellar.config", () => {
  const ctx = {
    config: {
      theme_config: {
        canonical: {
          original_host: "example.com",
          official_hosts: ["mirror.example.com"]
        }
      }
    }
  };

  attachConfig(ctx);

  assert.deepEqual(ctx.stellar.config.canonical, {
    originalHost: "example.com",
    officialHosts: ["mirror.example.com"]
  });
  assertDeepFrozen(ctx.stellar.config);
});
