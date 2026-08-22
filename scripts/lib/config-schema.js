/* global hexo */
"use strict";

const { CONFIG_SCHEMA } = require("../schema/config-schema");

class ConfigSchemaError extends Error {
  constructor(issues) {
    super(`Stellar v2 配置 Schema 校验失败：\n${issues.map(issue => `- ${formatIssue(issue)}`).join("\n")}`);
    this.name = "ConfigSchemaError";
    this.issues = issues;
  }
}

function isPlainObject(value) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function valueType(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  if (typeof value === "object" && !isPlainObject(value)) {
    return value.constructor?.name || "non-plain object";
  }
  return typeof value;
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
}

function deepFreeze(value) {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function matchesType(value, types) {
  return types.some(type => {
    if (type === "array") return Array.isArray(value);
    if (type === "object") return isPlainObject(value);
    if (type === "null") return value === null;
    return typeof value === type;
  });
}

function expectedType(node) {
  return node.type.join(" | ");
}

function formatIssue(issue) {
  if (issue.code === "removed_field") {
    return `${issue.source}: ${issue.path} 已移除，期望 ${issue.expected}（迁移：${issue.migration}）`;
  }
  if (issue.code === "unknown_field") {
    return `${issue.source}: 未知字段 ${issue.path}，期望 ${issue.expected}（迁移：${issue.migration}）`;
  }
  return `${issue.source}: ${issue.path} 应为 ${issue.expected}，实际为 ${issue.actualType}（迁移：${issue.migration}）`;
}

function issue(code, source, path, actualType, expected, migration) {
  return Object.freeze({ code, source, path, actualType, expected, migration });
}

function normalizeValue(node, value) {
  if (node.normalizer === "nullable_host") {
    return value == null ? "" : value.trim();
  }
  if (node.normalizer === "host_list") {
    const seen = new Set();
    const result = [];
    for (const item of value) {
      const normalized = item.trim();
      if (normalized.length === 0 || seen.has(normalized)) continue;
      seen.add(normalized);
      result.push(normalized);
    }
    return result;
  }
  if (node.normalizer !== "object") {
    throw new TypeError(`未知配置归一化器：${node.normalizer || "<missing>"}`);
  }
  return clone(value);
}

function parseNode(node, input, source, path, issues) {
  if (!matchesType(input, node.type)) {
    issues.push(issue("invalid_type", source, path, valueType(input), expectedType(node), node.migration));
    return undefined;
  }

  if (node.type.includes("array") && node.items) {
    let valid = true;
    for (let index = 0; index < input.length; index += 1) {
      if (!matchesType(input[index], node.items.type)) {
        valid = false;
        issues.push(issue(
          "invalid_type",
          source,
          `${path}[${index}]`,
          valueType(input[index]),
          expectedType(node.items),
          node.migration
        ));
      }
    }
    if (!valid) return undefined;
    return normalizeValue(node, input);
  }

  if (!node.type.includes("object")) return normalizeValue(node, input);

  const properties = node.properties || {};
  if (node.sealed) {
    for (const key of Object.keys(input)) {
      const childPath = path ? `${path}.${key}` : key;
      if (Object.prototype.hasOwnProperty.call(node.removedProperties || {}, key)) {
        const replacement = node.removedProperties[key];
        issues.push(issue(
          "removed_field",
          source,
          childPath,
          valueType(input[key]),
          path ? `${path}.${replacement}` : replacement,
          properties[replacement]?.migration || node.migration
        ));
      } else if (!Object.prototype.hasOwnProperty.call(properties, key)) {
        issues.push(issue("unknown_field", source, childPath, valueType(input[key]), "known field", node.migration));
      }
    }
  }

  const result = {};
  for (const [key, child] of Object.entries(properties)) {
    const childPath = path ? `${path}.${key}` : key;
    const hasValue = Object.prototype.hasOwnProperty.call(input, key);
    const value = hasValue ? input[key] : clone(child.default.value);
    const parsed = parseNode(child, value, source, childPath, issues);
    if (parsed !== undefined) result[child.runtimeKey || key] = parsed;
  }
  return result;
}

function parseStellarConfig(input = {}) {
  const source = input.source || "_config.stellar.yml";
  const themeConfig = isPlainObject(input.themeConfig) ? input.themeConfig : {};
  const issues = [];
  const parsed = parseNode(CONFIG_SCHEMA, themeConfig, source, "", issues);
  if (issues.length > 0) throw new ConfigSchemaError(issues);
  return deepFreeze(parsed);
}

module.exports = {
  ConfigSchemaError,
  deepFreeze,
  formatIssue,
  isPlainObject,
  parseStellarConfig,
  valueType
};
