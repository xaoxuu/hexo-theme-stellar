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

test("head/SEO Schema 提供最终路径默认值并忽略尚未迁移的根域", () => {
  const config = parseStellarConfig({
    source: "themes/stellar/_config.yml",
    themeConfig: { article: { type: "tech" } }
  });

  assert.deepEqual(config, {
    seo: {
      canonical: { host: "", allowedHosts: ["localhost"] },
      openGraph: { enabled: true, twitterId: null },
      structuredData: { sameAs: [] }
    },
    resources: { preconnect: [] },
    inject: { head: "", script: "" }
  });
  assertDeepFrozen(config);
});

test("站点覆盖完成规范化、数组替换、稳定去重并保留注入原文", () => {
  const head = "<meta name=\"first\">\n  <meta name=\"second\">";
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      seo: {
        canonical: {
          host: "  https://xaoxuu.com/  ",
          allowed_hosts: [" mirror.example.com ", "", "localhost", "mirror.example.com"]
        },
        open_graph: { enabled: false, twitter_id: "  xaoxuu  " },
        structured_data: { same_as: [" https://github.com/xaoxuu ", "", "https://github.com/xaoxuu"] }
      },
      resources: {
        preconnect: [" https://cdn.example.com/ ", "", "https://cdn.example.com"]
      },
      inject: { head, script: "<script>window.example = true</script>" }
    }
  });

  assert.deepEqual(config, {
    seo: {
      canonical: { host: "xaoxuu.com", allowedHosts: ["mirror.example.com", "localhost"] },
      openGraph: { enabled: false, twitterId: "  xaoxuu  " },
      structuredData: { sameAs: ["https://github.com/xaoxuu"] }
    },
    resources: { preconnect: ["https://cdn.example.com"] },
    inject: { head, script: "<script>window.example = true</script>" }
  });
});

test("canonical null 禁用输出且 Schema 不做类型转换", () => {
  assert.equal(parseStellarConfig({
    themeConfig: { seo: { canonical: { host: null } } }
  }).seo.canonical.host, "");

  assert.throws(
    () => parseStellarConfig({
      source: "_config.stellar.yml",
      themeConfig: {
        seo: { canonical: { host: 42 }, open_graph: { enabled: "true" } },
        inject: { head: ["<meta>"] }
      }
    }),
    error => {
      assert.ok(error instanceof ConfigSchemaError);
      assert.deepEqual(error.issues.map(item => [item.path, item.actualType, item.expected]), [
        ["seo.canonical.host", "number", "string | null"],
        ["seo.open_graph.enabled", "string", "boolean"],
        ["inject.head", "array", "string"]
      ]);
      return true;
    }
  );
});

test("已迁移旧根、旧子字段和新子树未知字段产生结构化诊断", () => {
  assert.throws(
    () => parseStellarConfig({
      source: "_config.stellar.yml",
      themeConfig: {
        canonical: { original_host: "legacy.example.com" },
        open_graph: { enable: true },
        seo: {
          canonical: { original_host: "legacy.example.com", extra: true },
          open_graph: { enable: true },
          structured_data: { links: [] }
        },
        resources: { unknown: true }
      }
    }),
    error => {
      assert.ok(error instanceof ConfigSchemaError);
      assert.deepEqual(error.issues.map(item => item.code), [
        "removed_field",
        "removed_field",
        "removed_field",
        "unknown_field",
        "removed_field",
        "removed_field",
        "unknown_field"
      ]);
      assert.match(error.message, /canonical 已移除，期望 seo\.canonical/);
      assert.match(error.message, /seo\.canonical\.original_host 已移除，期望 seo\.canonical\.host/);
      assert.match(error.message, /未知字段 resources\.unknown/);
      return true;
    }
  );
});

test("构建事件把最终路径冻结挂载到 hexo.stellar.config", () => {
  const ctx = {
    config: {
      theme_config: {
        seo: {
          canonical: { host: "example.com", allowed_hosts: ["mirror.example.com"] },
          structured_data: { same_as: ["https://github.com/example"] }
        },
        inject: { head: "<meta name=\"site\">" }
      }
    }
  };

  attachConfig(ctx);

  assert.equal(ctx.stellar.config.seo.canonical.host, "example.com");
  assert.deepEqual(ctx.stellar.config.seo.canonical.allowedHosts, ["mirror.example.com"]);
  assert.deepEqual(ctx.stellar.config.seo.structuredData.sameAs, ["https://github.com/example"]);
  assert.equal(ctx.stellar.config.inject.head, "<meta name=\"site\">");
  assertDeepFrozen(ctx.stellar.config);
});
