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

function mergeObjects(base, override) {
  const result = clone(base);
  for (const [key, value] of Object.entries(override)) {
    result[key] = isPlainObject(value) && isPlainObject(result[key])
      ? mergeObjects(result[key], value)
      : clone(value);
  }
  return result;
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
  if (issue.code === "missing_field") {
    return `${issue.source}: 缺少必填字段 ${issue.path}，期望 ${issue.expected}（迁移：${issue.migration}）`;
  }
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
  if (node.normalizer === "root_relative_path") {
    return normalizeRootRelativePath(value);
  }
  if (node.normalizer === "collection_path") {
    return normalizeCollectionPath(value);
  }
  if (node.normalizer === "parameter_bag") {
    return clone(value);
  }
  if (node.normalizer === "effect") {
    if (value == null) return null;
    const result = { type: value.type };
    if (Object.prototype.hasOwnProperty.call(value, "options")) result.options = clone(value.options);
    if (isPlainObject(value.runtime)) {
      result.runtime = {};
      if (Object.prototype.hasOwnProperty.call(value.runtime, "pause_when_hidden")) {
        result.runtime.pauseWhenHidden = value.runtime.pause_when_hidden;
      }
      if (Object.prototype.hasOwnProperty.call(value.runtime, "respect_reduced_motion")) {
        result.runtime.respectReducedMotion = value.runtime.respect_reduced_motion;
      }
    }
    return result;
  }
  if (node.normalizer === "identity" || node.normalizer === "trusted_text" || node.normalizer === "array") {
    return value;
  }
  if (node.normalizer !== "object") {
    throw new TypeError(`未知配置归一化器：${node.normalizer || "<missing>"}`);
  }
  return clone(value);
}

function normalizeRootRelativePath(value) {
  if (value == null) return null;
  const normalized = value.trim().replace(/\\/g, "/");
  if (normalized.length === 0 || normalized === "/") return "/";
  const rooted = `/${normalized.replace(/^\/+|\/+$/g, "")}`;
  const lastSegment = rooted.split("/").at(-1);
  return lastSegment.includes(".") ? rooted : `${rooted}/`;
}

function normalizeCollectionPath(value) {
  const normalized = value.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.length === 0) return "";
  return normalized.replace(/\/{2,}/g, "/");
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

const GALAXY_OPTION_TYPES = Object.freeze({
  focal: "number_array",
  rotation: "number_array",
  starSpeed: "number",
  density: "number",
  hueShift: "number",
  disableAnimation: "boolean",
  speed: "number",
  mouseInteraction: "boolean",
  glowIntensity: "number",
  saturation: "number",
  mouseRepulsion: "boolean",
  repulsionStrength: "number",
  twinkleIntensity: "number",
  rotationSpeed: "number",
  autoCenterRepulsion: "number",
  transparent: "boolean"
});

function validateNonEmptyString(node, input, source, path, issues, nullable) {
  if (nullable && input == null) return;
  if (typeof input === "string" && input.length > 0) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "non-empty string", node.migration));
}

function validateStringTree(node, input, source, path, issues) {
  const entries = Array.isArray(input) ? [[path, input]] : Object.entries(input).map(([key, value]) => [`${path}.${key}`, value]);
  for (const [entryPath, items] of entries) {
    if (!Array.isArray(items)) {
      issues.push(issue("invalid_type", source, entryPath, valueType(items), "array", node.migration));
      continue;
    }
    items.forEach((item, index) => {
      if (typeof item !== "string") {
        issues.push(issue("invalid_type", source, `${entryPath}[${index}]`, valueType(item), "string", node.migration));
      }
    });
  }
}

function validateGalaxyOptions(node, options, source, path, issues) {
  if (!isPlainObject(options)) {
    issues.push(issue("invalid_type", source, path, valueType(options), "object", node.migration));
    return;
  }
  for (const [key, value] of Object.entries(options)) {
    const expected = GALAXY_OPTION_TYPES[key];
    const optionPath = `${path}.${key}`;
    if (!expected) {
      issues.push(issue("unknown_field", source, optionPath, valueType(value), "known Galaxy option", node.migration));
    } else if (expected === "number" && (typeof value !== "number" || !Number.isFinite(value))) {
      issues.push(issue("invalid_type", source, optionPath, valueType(value), "finite number", node.migration));
    } else if (expected === "boolean" && typeof value !== "boolean") {
      issues.push(issue("invalid_type", source, optionPath, valueType(value), "boolean", node.migration));
    } else if (expected === "number_array" && (!Array.isArray(value) || value.some(item => typeof item !== "number" || !Number.isFinite(item)))) {
      issues.push(issue("invalid_type", source, optionPath, valueType(value), "number[]", node.migration));
    }
  }
}

function validateEffect(node, input, source, path, issues) {
  if (input == null) return;
  const allowed = ["type", "options", "runtime"];
  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) {
      issues.push(issue("unknown_field", source, `${path}.${key}`, valueType(input[key]), allowed.join(" | "), node.migration));
    }
  }
  if (typeof input.type !== "string" || input.type.length === 0) {
    issues.push(issue("missing_field", source, `${path}.type`, valueType(input.type), "non-empty string", node.migration));
  }
  if (input.options != null && input.type === "galaxy") {
    validateGalaxyOptions(node, input.options, source, `${path}.options`, issues);
  } else if (input.options != null && !isPlainObject(input.options)) {
    issues.push(issue("invalid_type", source, `${path}.options`, valueType(input.options), "object", node.migration));
  }
  if (input.runtime != null) {
    if (!isPlainObject(input.runtime)) {
      issues.push(issue("invalid_type", source, `${path}.runtime`, valueType(input.runtime), "object", node.migration));
    } else {
      const runtimeKeys = ["pause_when_hidden", "respect_reduced_motion"];
      for (const [key, value] of Object.entries(input.runtime)) {
        if (!runtimeKeys.includes(key)) {
          issues.push(issue("unknown_field", source, `${path}.runtime.${key}`, valueType(value), runtimeKeys.join(" | "), node.migration));
        } else if (typeof value !== "boolean") {
          issues.push(issue("invalid_type", source, `${path}.runtime.${key}`, valueType(value), "boolean", node.migration));
        }
      }
    }
  }
}

function validateBrand(node, input, source, path, issues) {
  if (input == null) return;
  const image = input.image;
  if (typeof input.name === "string" && /^\[[\s\S]*\]\([\s\S]*\)$/.test(input.name.trim())) {
    issues.push(issue("invalid_value", source, `${path}.name`, "string", `${path}.url`, node.migration));
  }
  if (!isPlainObject(image)) return;
  if (typeof image.src === "string" && /^\[[\s\S]*\]\([\s\S]*\)$/.test(image.src.trim())) {
    issues.push(issue("invalid_value", source, `${path}.image.src`, "string", `${path}.image.url`, node.migration));
  }
  if (image.variant === "plain" && image.background != null) {
    issues.push(issue("invalid_value", source, `${path}.image.background`, valueType(image.background), "null when variant is plain", node.migration));
  }
}

function validateAbsoluteHttpUrl(node, input, source, path, issues) {
  try {
    const url = new URL(input);
    if ((url.protocol === "http:" || url.protocol === "https:") && url.host.length > 0) return;
  } catch (error) {
    // Report the same structured invalid-value diagnostic for every parse failure.
  }
  issues.push(issue("invalid_value", source, path, valueType(input), "absolute HTTP(S) URL", node.migration));
}

function validateCustom(node, input, source, path, issues) {
  if (!node.validator) return;
  if (node.validator === "non_empty_string") validateNonEmptyString(node, input, source, path, issues, false);
  else if (node.validator === "nullable_non_empty_string") validateNonEmptyString(node, input, source, path, issues, true);
  else if (node.validator === "string_tree") validateStringTree(node, input, source, path, issues);
  else if (node.validator === "effect") validateEffect(node, input, source, path, issues);
  else if (node.validator === "brand") validateBrand(node, input, source, path, issues);
  else if (node.validator === "absolute_http_url") validateAbsoluteHttpUrl(node, input, source, path, issues);
  else if (node.validator === "topic_route_start" && input != null && !/[\\/]topic[\\/]/.test(source)) {
    issues.push(issue("invalid_scope", source, path, valueType(input), "Topic Collection only", node.migration));
  } else if (!["non_empty_string", "nullable_non_empty_string", "string_tree", "effect", "brand", "absolute_http_url", "topic_route_start"].includes(node.validator)) {
    throw new TypeError(`未知配置校验器：${node.validator}`);
  }
}

function parseNode(node, input, source, path, issues, context) {
  if (!matchesType(input, node.type)) {
    issues.push(issue("invalid_type", source, path, valueType(input), expectedType(node), node.migration));
    return undefined;
  }

  if (node.values && !node.values.includes(input)) {
    issues.push(issue("invalid_value", source, path, valueType(input), node.values.map(value => value === null ? "null" : value).join(" | "), node.migration));
    return undefined;
  }

  if (typeof input === "number") {
    if (!Number.isFinite(input)) {
      issues.push(issue("invalid_value", source, path, valueType(input), "finite number", node.migration));
      return undefined;
    }
    if (node.minimum !== undefined && input < node.minimum) {
      issues.push(issue("invalid_value", source, path, valueType(input), `number >= ${node.minimum}`, node.migration));
      return undefined;
    }
    if (node.maximum !== undefined && input > node.maximum) {
      issues.push(issue("invalid_value", source, path, valueType(input), `number <= ${node.maximum}`, node.migration));
      return undefined;
    }
    if (node.exclusiveMinimum !== undefined && input <= node.exclusiveMinimum) {
      issues.push(issue("invalid_value", source, path, valueType(input), `number > ${node.exclusiveMinimum}`, node.migration));
      return undefined;
    }
  }

  validateCustom(node, input, source, path, issues);

  if (Array.isArray(input) && node.items) {
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

  if (!isPlainObject(input)) return normalizeValue(node, input);
  if (context.applyDefaults && node.default?.kind === "literal" && isPlainObject(node.default.value)) {
    input = mergeObjects(node.default.value, input);
  }
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
    } else if (node.externalProperties?.includes(key)) {
      continue;
    } else if (node.allowedPropertyKeys && !node.allowedPropertyKeys.includes(key)) {
      issues.push(issue("unknown_field", source, childPath, valueType(input[key]), node.allowedPropertyKeys.join(" | "), node.migration));
    } else if (node.sealed && !node.additionalProperties && !Object.prototype.hasOwnProperty.call(properties, key)) {
      issues.push(issue("unknown_field", source, childPath, valueType(input[key]), "known field", node.migration));
    }
  }
  if (node.normalizer === "parameter_bag" || node.normalizer === "effect") return normalizeValue(node, input);

  const result = {};
  for (const key of node.externalProperties || []) {
    if (Object.prototype.hasOwnProperty.call(input, key)) result[key] = clone(input[key]);
  }
  for (const key of node.requiredProperties || []) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) {
      const child = properties[key] || node;
      const childPath = path ? `${path}.${key}` : key;
      issues.push(issue("missing_field", source, childPath, "undefined", expectedType(child), child.migration || node.migration));
    }
  }
  for (const [key, child] of Object.entries(properties)) {
    const childPath = path ? `${path}.${key}` : key;
    const hasValue = Object.prototype.hasOwnProperty.call(input, key);
    if (!hasValue && !context.applyDefaults) continue;
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

function parseConfigSchema(schema, input = {}, options = {}) {
  const source = options.source || "<config>";
  const siteConfig = isPlainObject(options.siteConfig) ? options.siteConfig : {};
  const issues = [];
  const parsed = parseNode(schema, isPlainObject(input) ? input : input, source, "", issues, {
    siteConfig,
    applyDefaults: options.applyDefaults ?? schema.applyDefaults ?? false
  });
  if (issues.length > 0) throw new ConfigSchemaError(issues);
  return deepFreeze(parsed);
}

function parseStellarConfig(input = {}) {
  const source = input.source || "_config.stellar.yml";
  const themeConfig = isPlainObject(input.themeConfig) ? input.themeConfig : {};
  const siteConfig = isPlainObject(input.siteConfig) ? input.siteConfig : {};
  return parseConfigSchema(CONFIG_SCHEMA, themeConfig, { source, siteConfig, applyDefaults: true });
}

module.exports = {
  ConfigSchemaError,
  deepFreeze,
  formatIssue,
  isPlainObject,
  parseConfigSchema,
  parseStellarConfig,
  valueType
};
