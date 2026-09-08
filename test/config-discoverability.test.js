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

function schemaPaths(node, parents = [], result = []) {
  if (parents.length > 0) result.push(parents.join("."));
  for (const [key, child] of Object.entries(node.properties || {})) {
    schemaPaths(child, [...parents, key], result);
  }
  return result;
}

test("手写 _config.yml 是公开字段树、默认值与顺序的唯一来源", () => {
  assert.deepEqual(Object.keys(CONFIG_SCHEMA.properties), Object.keys(CONFIG));
  assert.deepEqual(CONFIG, CONFIG_DEFAULTS);
  assert.deepEqual(loadDefaultConfig(CONFIG_SOURCE), CONFIG);
  assert.equal(Object.isFrozen(CONFIG_SCHEMA), true);
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
