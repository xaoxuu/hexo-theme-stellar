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
  if (issue.code === "invalid_value") {
    return `${issue.source}: ${issue.path} 的值不在 ${issue.expected} 中，实际类型为 ${issue.actualType}（迁移：${issue.migration}）`;
  }
  return `${issue.source}: ${issue.path} 应为 ${issue.expected}，实际为 ${issue.actualType}（迁移：${issue.migration}）`;
}

function issue(code, source, path, actualType, expected, migration) {
  return Object.freeze({ code, source, path, actualType, expected, migration });
}

function normalizeValue(node, value) {
  if (node.normalizer === "nullable_host") {
    return value == null ? "" : normalizeHost(value);
  }
  if (node.normalizer === "host_list") {
    return normalizeStringList(value, item => item.trim());
  }
  if (node.normalizer === "origin_list") {
    return normalizeStringList(value, item => item.trim().replace(/\/+$/, ""));
  }
  if (node.normalizer === "trimmed_string_list") {
    return normalizeStringList(value, item => item.trim());
  }
  if (node.normalizer === "identity" || node.normalizer === "trusted_text" || node.normalizer === "array") {
    return value;
  }
  if (node.normalizer !== "object") {
    throw new TypeError(`未知配置归一化器：${node.normalizer || "<missing>"}`);
  }
  return clone(value);
}

function valueAtPath(value, path) {
  let current = value;
  for (const key of path.split(".")) {
    if (current == null || !Object.prototype.hasOwnProperty.call(current, key)) return undefined;
    current = current[key];
  }
  return current;
}

function fallbackDefault(node) {
  if (node.type.includes("null")) return null;
  if (node.type.includes("string")) return "";
  if (node.type.includes("array")) return [];
  if (node.type.includes("object")) return {};
  if (node.type.includes("boolean")) return false;
  if (node.type.includes("number")) return 0;
  return undefined;
}

function resolveDefault(node, context) {
  const definition = node.default;
  if (definition?.kind === "literal") return clone(definition.value);
  if (definition?.kind === "derived") {
    for (const source of definition.sources || []) {
      if (!source.startsWith("hexo.config.")) continue;
      const value = valueAtPath(context.siteConfig, source.slice("hexo.config.".length));
      if (value !== undefined) return clone(value);
    }
  }
  return fallbackDefault(node);
}

function normalizeHost(value) {
  return value.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function normalizeStringList(value, normalize) {
  const seen = new Set();
  const result = [];
  for (const item of value) {
    const normalized = normalize(item);
    if (normalized.length === 0 || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

function parseNode(node, input, source, path, issues, context) {
  if (!matchesType(input, node.type)) {
    issues.push(issue("invalid_type", source, path, valueType(input), expectedType(node), node.migration));
    return undefined;
  }

  if (node.values && !node.values.includes(input)) {
    issues.push(issue("invalid_value", source, path, valueType(input), node.values.join(" | "), node.migration));
    return undefined;
  }

  if (node.type.includes("array") && node.items) {
    let valid = true;
    const result = [];
    const structuredItems = node.items.properties || node.items.additionalProperties || node.items.normalizer;
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
      } else if (structuredItems) {
        const parsed = parseNode(node.items, input[index], source, `${path}[${index}]`, issues, context);
        if (parsed === undefined) {
          valid = false;
        } else {
          result.push(parsed);
        }
      } else {
        result.push(clone(input[index]));
      }
    }
    if (!valid) return undefined;
    return normalizeValue(node, result);
  }

  if (!node.type.includes("object")) return normalizeValue(node, input);

  const properties = node.properties || {};
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
        node.migration
      ));
    } else if (node.sealed && !node.additionalProperties && !Object.prototype.hasOwnProperty.call(properties, key)) {
      issues.push(issue("unknown_field", source, childPath, valueType(input[key]), "known field", node.migration));
    }
  }

  const result = {};
  for (const [key, child] of Object.entries(properties)) {
    const childPath = path ? `${path}.${key}` : key;
    const hasValue = Object.prototype.hasOwnProperty.call(input, key);
    const value = hasValue ? input[key] : resolveDefault(child, context);
    const parsed = parseNode(child, value, source, childPath, issues, context);
    if (parsed !== undefined) result[child.runtimeKey || key] = parsed;
  }
  if (node.additionalProperties) {
    for (const [key, value] of Object.entries(input)) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) continue;
      const childPath = path ? `${path}.${key}` : key;
      const parsed = parseNode(node.additionalProperties, value, source, childPath, issues, context);
      if (parsed !== undefined) result[key] = parsed;
    }
  }
  return result;
}

function parseStellarConfig(input = {}) {
  const source = input.source || "_config.stellar.yml";
  const themeConfig = isPlainObject(input.themeConfig) ? input.themeConfig : {};
  const siteConfig = isPlainObject(input.siteConfig) ? input.siteConfig : {};
  const issues = [];
  const parsed = parseNode(CONFIG_SCHEMA, themeConfig, source, "", issues, { siteConfig });
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
