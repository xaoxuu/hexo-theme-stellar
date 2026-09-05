"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const yaml = require("js-yaml");

const { CONFIG_RULES } = require("../scripts/schema/config-rules");
const { flattenSchemaFields } = require("../scripts/schema/schema-utils");
const {
  CONFIG_DEFAULTS,
  CONFIG_SCHEMA,
  DEFAULT_CONFIG_PATH,
  loadDefaultConfig,
  patternMatches
} = require("../scripts/schema/config-schema");

const CONFIG_SOURCE = fs.readFileSync(DEFAULT_CONFIG_PATH, "utf8");
const CONFIG = yaml.load(CONFIG_SOURCE);
const ROOT_KEYS = [
  "topbar", "leftbar", "rightbar", "footer", "profiles",
  "article", "notebook", "settings",
  "appearance",
  "search", "comments", "tags", "features", "services",
  "preconnect", "fallbacks", "error_page",
  "canonical", "open_graph", "structured_data",
  "inject"
];

function schemaPaths(node, parents = [], result = []) {
  if (parents.length > 0) result.push(parents.join("."));
  for (const [key, child] of Object.entries(node.properties || {})) {
    schemaPaths(child, [...parents, key], result);
  }
  return result;
}

function configKeyLines(source) {
  return source.split(/\r?\n/).flatMap((line, index) => {
    if (line.trimStart().startsWith("#")) return [];
    if (!/^(\s*)(?:-\s+)?(?:[\w-]+|[^\s:#][^:]*):(?:\s|$)/.test(line)) return [];
    return [{ index, line }];
  });
}

function precedingNonEmptyLine(lines, index) {
  let previous = index - 1;
  while (previous >= 0 && lines[previous].trim() === "") previous -= 1;
  return previous >= 0 ? lines[previous] : "";
}

function nonEmptyFlowCollectionLines(source) {
  return source.split(/\r?\n/).flatMap((line, index) => {
    const code = line.replace(/\s+#.*$/, "");
    const flowValue = /:\s*(?:\[(?!\])|\{(?!\}))/.test(code);
    const flowItem = /^\s*-\s*(?:\[(?!\])|\{(?!\}))/.test(code);
    return flowValue || flowItem ? [`${index + 1}: ${line.trim()}`] : [];
  });
}

test("手写 _config.yml 是公开字段树、默认值与顺序的唯一来源", () => {
  assert.deepEqual(Object.keys(CONFIG), ROOT_KEYS);
  assert.deepEqual(CONFIG, CONFIG_DEFAULTS);
  assert.deepEqual(loadDefaultConfig(CONFIG_SOURCE), CONFIG);
  assert.equal(Object.isFrozen(CONFIG_SCHEMA), true);
  assert.deepEqual(
    ["site", "layout", "content", "seo", "resources", "extensions"]
      .filter(key => Object.hasOwn(CONFIG, key)),
    []
  );
  assert.match(CONFIG_SOURCE, /公开配置树、默认值、字段顺序和用户示例的唯一事实来源/);
  assert.match(
    CONFIG_SOURCE,
    /# 布局[\s\S]*# 内容[\s\S]*# 外观[\s\S]*# 功能[\s\S]*# 服务与资源[\s\S]*# SEO[\s\S]*# 高级注入/
  );
});

test("手写 _config.yml 的每个配置键都有独立前置注释", () => {
  const lines = CONFIG_SOURCE.split(/\r?\n/);
  const missing = configKeyLines(CONFIG_SOURCE).flatMap(({ index, line }) => {
    const previous = precedingNonEmptyLine(lines, index);
    return previous.trimStart().startsWith("#") ? [] : [`${index + 1}: ${line.trim()}`];
  });
  assert.deepEqual(missing, []);
});

test("手写 _config.yml 仅允许空集合使用单行 flow style", () => {
  assert.deepEqual(nonEmptyFlowCollectionLines(CONFIG_SOURCE), []);
});

test("轻量规则表中的每个路径都对应手写默认配置中的现存节点", () => {
  const paths = schemaPaths(CONFIG_SCHEMA);
  const missing = CONFIG_RULES
    .map(([pattern]) => pattern)
    .filter(pattern => !paths.some(configPath => patternMatches(pattern, configPath)));
  assert.deepEqual(missing, []);
});

test("配置 Schema 路径投影保留 YAML、运行时、数组与动态记录语义", () => {
  const fields = flattenSchemaFields(CONFIG_SCHEMA);
  const byPath = new Map(fields.map(field => [field.path, field]));

  assert.equal(fields.length, byPath.size, "配置 Schema 不应投影重复 YAML 路径");
  assert.equal(fields.every(field => typeof field.runtimePath === "string" && Array.isArray(field.type)), true);
  assert.equal(fields.some(field => field.path.includes("[]")), true, "应保留数组项投影");
  assert.equal(fields.some(field => field.path.includes("<key>")), true, "应保留动态记录投影");
  assert.equal(fields.some(field => field.path !== field.runtimePath), true, "应保留 YAML 到运行时命名转换");
});
