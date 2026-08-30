"use strict";

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const { deepFreeze } = require("./schema-utils");
const { CONFIG_RULES, literal } = require("./config-rules");

const DEFAULT_CONFIG_PATH = path.resolve(__dirname, "../../_config.yml");

function isPlainObject(value) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
}

function valueType(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function normalizerFor(type) {
  if (type === "object") return "object";
  if (type === "array") return "array";
  return "identity";
}

function runtimeKey(key) {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function segments(pattern) {
  return pattern.split(".");
}

function patternMatches(pattern, configPath) {
  const expected = segments(pattern);
  const actual = segments(configPath);
  return expected.length === actual.length && expected.every((part, index) => part === "*" || part === actual[index]);
}

function matchingRules(configPath) {
  return CONFIG_RULES.filter(([pattern]) => patternMatches(pattern, configPath)).map(([, rule]) => rule);
}

function inferNode(value, configPath, key = "") {
  const type = valueType(value);
  const node = {
    type: [type],
    default: literal(clone(value)),
    normalizer: normalizerFor(type),
    ...(key ? { runtimeKey: runtimeKey(key) } : {})
  };
  if (type === "object") {
    node.sealed = true;
    node.properties = Object.fromEntries(
      Object.entries(value).map(([childKey, child]) => [
        childKey,
        inferNode(child, configPath ? `${configPath}.${childKey}` : childKey, childKey)
      ])
    );
  }
  for (const rule of matchingRules(configPath)) Object.assign(node, clone(rule));
  return node;
}

function ensureRulePath(root, pattern, rule) {
  if (!pattern.includes("*")) return;
  const parts = segments(pattern);

  function visit(node, index, configPath) {
    if (index === parts.length) {
      Object.assign(node, clone(rule));
      if (Object.prototype.hasOwnProperty.call(rule, "defaultValue")) {
        node.default = literal(clone(rule.defaultValue));
      }
      delete node.defaultValue;
      return;
    }
    const part = parts[index];
    if (part === "*") {
      for (const [childKey, child] of Object.entries(node.properties || {})) {
        visit(child, index + 1, configPath ? `${configPath}.${childKey}` : childKey);
      }
      return;
    }
    node.properties ||= {};
    if (!node.properties[part]) {
      if (!Object.prototype.hasOwnProperty.call(rule, "defaultValue")) return;
      const childPath = configPath ? `${configPath}.${part}` : part;
      const defaultValue = index === parts.length - 1 && Object.prototype.hasOwnProperty.call(rule, "defaultValue")
        ? clone(rule.defaultValue)
        : {};
      node.properties[part] = inferNode(defaultValue, childPath, part);
    }
    visit(node.properties[part], index + 1, configPath ? `${configPath}.${part}` : part);
  }

  visit(root, 0, "");
}

function normalizeRuleDefaults(node) {
  if (Object.prototype.hasOwnProperty.call(node, "defaultValue")) {
    node.default = literal(clone(node.defaultValue));
    delete node.defaultValue;
  }
  for (const child of Object.values(node.properties || {})) normalizeRuleDefaults(child);
  if (node.items) normalizeRuleDefaults(node.items);
  if (node.additionalProperties) normalizeRuleDefaults(node.additionalProperties);
  return node;
}

function loadDefaultConfig(source = fs.readFileSync(DEFAULT_CONFIG_PATH, "utf8")) {
  const parsed = yaml.load(source);
  if (!isPlainObject(parsed)) throw new TypeError("themes/stellar/_config.yml 必须是 YAML 对象");
  return parsed;
}

function buildConfigSchema(defaultConfig = loadDefaultConfig()) {
  const schema = inferNode(defaultConfig, "");
  schema.sealed = true;
  for (const [pattern, rule] of CONFIG_RULES) ensureRulePath(schema, pattern, rule);
  normalizeRuleDefaults(schema);
  return deepFreeze(schema);
}

const CONFIG_DEFAULTS = deepFreeze(loadDefaultConfig());
const CONFIG_SCHEMA = buildConfigSchema(CONFIG_DEFAULTS);

module.exports = {
  CONFIG_DEFAULTS,
  CONFIG_SCHEMA,
  DEFAULT_CONFIG_PATH,
  buildConfigSchema,
  literal,
  loadDefaultConfig,
  patternMatches
};
