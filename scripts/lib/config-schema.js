/* global hexo */
"use strict";

const nodePath = require("node:path");

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
  const migration = issue.migration ? `（迁移：${issue.migration}）` : "";
  if (issue.code === "missing_field") {
    return `${issue.source}: 缺少必填字段 ${issue.path}，期望 ${issue.expected}${migration}`;
  }
  if (issue.code === "removed_field") {
    return `${issue.source}: ${issue.path} 已移除，期望 ${issue.expected}${migration}`;
  }
  if (issue.code === "unknown_field") {
    return `${issue.source}: 未知字段 ${issue.path}，期望 ${issue.expected}${migration}`;
  }
  if (issue.code === "invalid_value") {
    return `${issue.source}: ${issue.path} 的值不在 ${issue.expected} 中，实际类型为 ${issue.actualType}${migration}`;
  }
  return `${issue.source}: ${issue.path} 应为 ${issue.expected}，实际为 ${issue.actualType}${migration}`;
}

function issue(code, source, path, actualType, expected, migration) {
  return Object.freeze({ code, source, path, actualType, expected, migration });
}

function normalizeValue(node, value) {
  if (node.normalizer === "nullable_host") {
    return value == null ? null : normalizeHost(value);
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
  if (node.normalizer === "nullable_trimmed_string_list") {
    return value == null ? null : normalizeStringList(value, item => item.trim());
  }
  if (node.normalizer === "share_override") {
    return Array.isArray(value) ? normalizeStringList(value, item => item.trim()) : value;
  }
  if (node.normalizer === "root_relative_path") {
    return normalizeRootRelativePath(value);
  }
  if (node.normalizer === "collection_path") {
    return normalizeCollectionPath(value);
  }
  if (node.normalizer === "nullable_trimmed_string") {
    return value == null ? null : value.trim();
  }
  if (node.normalizer === "menu_item") {
    if (value.type === "search") {
      const result = { type: "search" };
      for (const key of ["title", "icon", "accent"]) {
        if (value[key] != null) result[key] = value[key];
      }
      return result;
    }
    return { id: value.id, title: value.title, icon: value.icon, url: value.url, accent: value.accent };
  }
  if (node.normalizer === "footer_action") {
    if (value.type === "spacer") return { type: "spacer" };
    if (value.type === "link") {
      return { type: "link", icon: value.icon, title: value.title, url: value.url };
    }
    if (value.type === "button") {
      return { type: "button", icon: value.icon, title: value.title, onclick: value.onclick };
    }
    return { type: "dropdown", icon: value.icon, title: value.title, items: value.items };
  }
  if (node.normalizer === "footer_action_item") {
    if (value.type === "link") {
      return { type: "link", icon: value.icon, title: value.title, url: value.url };
    }
    return { type: "button", icon: value.icon, title: value.title, onclick: value.onclick };
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
  if (node.normalizer === "identity" || node.normalizer === "trusted_text" || node.normalizer === "array" || node.normalizer === "leftbar_background_type") {
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

function fallbackDefault(node) {
  if (node.type.includes("null")) return null;
  if (node.type.includes("string")) return "";
  if (node.type.includes("array")) return [];
  if (node.type.includes("object")) return {};
  if (node.type.includes("boolean")) return false;
  if (node.type.includes("number")) return 0;
  return undefined;
}

function resolveDefault(node) {
  const definition = node.default;
  if (definition?.kind === "literal") return clone(definition.value);
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
  if (typeof input === "string" && input.trim().length > 0) return;
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
    issues.push(issue("invalid_value", source, `${path}.name`, "string", "plain text without Markdown links", node.migration));
  }
  if (typeof input.name === "string" && /[<>]/.test(input.name)) {
    issues.push(issue("invalid_value", source, `${path}.name`, "string", "plain text without HTML", node.migration));
  }
  if (!isPlainObject(image)) return;
  if (typeof image.src === "string" && /^\[[\s\S]*\]\([\s\S]*\)$/.test(image.src.trim())) {
    issues.push(issue("invalid_value", source, `${path}.image.src`, "string", "plain image URL", node.migration));
  }
}

function isSafeNavigationUrl(input) {
  if (typeof input !== "string" || input.length === 0 || input.trim() !== input) return false;
  if (input.startsWith("/") && !input.startsWith("//")) return true;
  if (input.startsWith("#") && input.length > 1) return true;
  try {
    const url = new URL(input);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch (error) {
    return false;
  }
}

function validateSafeNavigationUrl(node, input, source, path, issues, nullable) {
  if (nullable && input == null) return;
  if (isSafeNavigationUrl(input)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "safe navigable URL or root-relative path", node.migration));
}

function validateTemplateNavigationUrl(node, input, source, path, issues, nullable) {
  if (nullable && input == null) return;
  if (typeof input === "string") {
    const candidate = input.replace(/\{[a-z][a-z0-9_-]*\.[a-z][a-z0-9_-]*\}/gi, "token");
    if (candidate === "token" || isSafeNavigationUrl(candidate)) return;
  }
  issues.push(issue("invalid_value", source, path, valueType(input), "safe navigable URL, root-relative path, or supported template URL", node.migration));
}

function isCssColor(input) {
  if (typeof input !== "string" || input.length === 0 || /[;{}<>]/.test(input)) return false;
  const value = input.trim();
  if (value !== input) return false;
  if (/^#[0-9a-f]{3,4}(?:[0-9a-f]{3,4})?$/i.test(value)) return true;
  if (/^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\([^\n]+\)$/i.test(value)) return true;
  if (/^var\(--[a-z0-9_-]+(?:\s*,[^\n]+)?\)$/i.test(value)) return true;
  return /^[a-z]+$/i.test(value);
}

function validateCssColor(node, input, source, path, issues, nullable) {
  if (nullable && input == null) return;
  if (isCssColor(input)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "valid CSS color", node.migration));
}

function isCssLength(input) {
  if (typeof input !== "string" || input.trim() !== input || /[;{}<>\n\r]/.test(input)) return false;
  return input === "0" || /^(?:\d+|\d*\.\d+)(?:px|rem|em|%|vw|vh|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/.test(input);
}

function validateCssLength(node, input, source, path, issues) {
  if (isCssLength(input)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "valid CSS length", node.migration));
}

function validateCssPercentage(node, input, source, path, issues) {
  if (typeof input === "string" && input.trim() === input && /^(?:\d+|\d*\.\d+)%$/.test(input)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "non-negative CSS percentage", node.migration));
}

function validateCssFontFamily(node, input, source, path, issues) {
  if (typeof input === "string" && input.trim() === input && input.length > 0 && !/[;{}<\n\r]/.test(input) && !/url\s*\(/i.test(input)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "safe CSS font-family list", node.migration));
}

function validateCssGradient(node, input, source, path, issues) {
  if (typeof input === "string" && input.trim() === input && !/[;{}<>\n\r]/.test(input) && /^(?:repeating-)?(?:linear|radial|conic)-gradient\([\s\S]+\)$/i.test(input)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "valid CSS gradient", node.migration));
}

function validateSidebarGradientColors(node, input, source, path, issues) {
  if (input.length === 4) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "exactly 4 CSS colors", node.migration));
}

function validateCssSelector(node, input, source, path, issues) {
  if (typeof input === "string" && input.trim() === input && input.length > 0 && !/[;{}<\n\r]/.test(input) && !/url\s*\(/i.test(input)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "safe CSS selector", node.migration));
}

function validateCornerShape(node, input, source, path, issues) {
  if (typeof input === "string" && /^(?:round|scoop|bevel|notch|square|superellipse\((?:\d+|\d*\.\d+)\))$/.test(input)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "supported CSS corner-shape", node.migration));
}

function isResource(input) {
  if (typeof input !== "string" || input.length === 0 || input.trim() !== input || /['"\\<>\n\r]/.test(input) || /^url\s*\(/i.test(input)) return false;
  if (/^data:image\/[a-z0-9.+-]+(?:;[a-z0-9=.+-]+)*(?:;base64)?,/i.test(input)) return true;
  if (input.startsWith("/") && !input.startsWith("//") && !input.split("/").includes("..")) return true;
  try {
    const url = new URL(input);
    if ((url.protocol === "http:" || url.protocol === "https:") && url.host.length > 0) return true;
  } catch (error) {
    // Relative resources are checked below.
  }
  return !/^[a-z][a-z0-9+.-]*:/i.test(input) && !input.split(/[\\/]/).includes("..");
}

function validateResource(node, input, source, path, issues, nullable) {
  if (nullable && input == null) return;
  if (isResource(input)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), nullable ? "null or safe Resource" : "safe Resource", node.migration));
}

function validateNonNegativeInteger(node, input, source, path, issues, nullable) {
  if (nullable && input == null) return;
  if (Number.isInteger(input) && input >= 0) return;
  issues.push(issue("invalid_value", source, path, valueType(input), nullable ? "null or non-negative integer" : "non-negative integer", node.migration));
}

function validateNonEmptyRecordKeys(node, input, source, path, issues) {
  for (const key of Object.keys(input)) {
    if (key.trim().length > 0) continue;
    issues.push(issue("invalid_value", source, path, "object", "record with non-empty keys", node.migration));
  }
}

function validateLicense(node, input, source, path, issues, nullable) {
  if (nullable && input == null) return;
  if (input === false || (typeof input === "string" && input.length > 0)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), nullable ? "null, false, or non-empty string" : "false or non-empty string", node.migration));
}

function validateShareOverride(node, input, source, path, issues) {
  if (input == null || typeof input === "boolean" || Array.isArray(input)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "null, boolean, or provider array", node.migration));
}

function validateKebabId(node, input, source, path, issues) {
  if (typeof input === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "non-empty kebab-case id", node.migration));
}

function validateNullableKebabId(node, input, source, path, issues) {
  if (input == null) return;
  validateKebabId(node, input, source, path, issues);
}

function validateMenuItems(node, input, source, path, issues) {
  const ids = new Set();
  let searchSeen = false;
  input.forEach((item, index) => {
    if (!isPlainObject(item)) return;
    const itemPath = `${path}[${index}]`;
    if (item.type === "search") {
      if (searchSeen) {
        issues.push(issue("invalid_value", source, itemPath, "object", "at most one search menu item", node.migration));
      }
      searchSeen = true;
      const extra = ["id", "url"].find(key => item[key] != null);
      if (extra) issues.push(issue("invalid_value", source, `${itemPath}.${extra}`, valueType(item[extra]), "no id or url for search item", node.migration));
      return;
    }
    if (item.type != null && item.type !== "link") {
      issues.push(issue("invalid_value", source, `${itemPath}.type`, valueType(item.type), "link | search", node.migration));
    }
    if (typeof item.id === "string") {
      if (ids.has(item.id)) {
        issues.push(issue("invalid_value", source, `${itemPath}.id`, "string", "unique menu id", node.migration));
      }
      ids.add(item.id);
    }
    const title = typeof item.title === "string" ? item.title : "";
    const icon = typeof item.icon === "string" ? item.icon : "";
    if (title.length === 0 && icon.length === 0) {
      issues.push(issue("invalid_value", source, itemPath, "object", "non-empty title or icon", node.migration));
    }
    if (typeof item.id !== "string" || item.id.length === 0) {
      issues.push(issue("invalid_value", source, `${itemPath}.id`, valueType(item.id), "non-empty kebab-case id", node.migration));
    }
    if (typeof item.url !== "string" || item.url.length === 0) {
      issues.push(issue("invalid_value", source, `${itemPath}.url`, valueType(item.url), "safe navigable URL", node.migration));
    }
  });
}

function validateRegionWidgets(node, input, source, path, issues) {
  if (!Array.isArray(input)) return;
  input.forEach((item, index) => {
    const id = typeof item === "string"
      ? item
      : isPlainObject(item)
        ? (typeof item.override === "string" ? item.override : item.layout)
        : null;
    if (id === "search") {
      issues.push(issue("invalid_value", source, `${path}[${index}]`, valueType(item), "Region widget excluding retired search; use menu.items[].type=search", node.migration));
    }
    if (id === "wiki_home") {
      issues.push(issue("invalid_value", source, `${path}[${index}]`, valueType(item), "Region widget excluding removed wiki_home; Wiki navigation belongs to the Brand", node.migration));
    }
    if (id === "brand") {
      issues.push(issue("invalid_value", source, `${path}[${index}]`, valueType(item), "site_brand | collection_brand", node.migration));
    }
  });
}

function validateLeftbarContentWidgets(node, input, source, path, issues) {
  if (!Array.isArray(input)) return;
  validateRegionWidgets(node, input, source, path, issues);
  const fixed = new Set(["site_brand", "collection_brand", "menu", "actions", "profile", "spacer"]);
  input.forEach((item, index) => {
    const id = typeof item === "string"
      ? item
      : isPlainObject(item)
        ? (typeof item.override === "string" ? item.override : item.layout)
        : null;
    if (!fixed.has(id)) return;
    issues.push(issue("invalid_value", source, `${path}[${index}]`, valueType(item), "Leftbar content widget excluding fixed shell controls", node.migration));
  });
}

function validateFooterActions(node, input, source, path, issues) {
  const actionTypes = new Set(["link", "button", "dropdown", "spacer"]);
  function validateAction(item, itemPath, nested) {
    if (!actionTypes.has(item.type)) {
      issues.push(issue("invalid_value", source, `${itemPath}.type`, valueType(item.type), "link | button | dropdown | spacer", node.migration));
      return;
    }
    if (nested && !["link", "button"].includes(item.type)) {
      issues.push(issue("invalid_value", source, `${itemPath}.type`, valueType(item.type), "link | button", node.migration));
      return;
    }
    const allowed = item.type === "link"
      ? ["type", "icon", "title", "url"]
      : item.type === "button"
        ? ["type", "icon", "title", "onclick"]
        : item.type === "dropdown"
          ? ["type", "icon", "title", "items"]
          : ["type"];
    for (const key of Object.keys(item)) {
      if (!allowed.includes(key)) {
        issues.push(issue("unknown_field", source, `${itemPath}.${key}`, valueType(item[key]), allowed.join(" | "), node.migration));
      }
    }
    if (item.type === "link" && !isSafeNavigationUrl(item.url)) {
      issues.push(issue("invalid_value", source, `${itemPath}.url`, valueType(item.url), "safe navigable URL or root-relative path", node.migration));
    }
    if (item.type === "button") {
      if (typeof item.title !== "string" || item.title.length === 0) {
        issues.push(issue("missing_field", source, `${itemPath}.title`, valueType(item.title), "non-empty string", node.migration));
      }
      if (!nested && (typeof item.icon !== "string" || item.icon.length === 0)) {
        issues.push(issue("missing_field", source, `${itemPath}.icon`, valueType(item.icon), "non-empty string", node.migration));
      }
      if (typeof item.onclick !== "string" || item.onclick.length === 0) {
        issues.push(issue("missing_field", source, `${itemPath}.onclick`, valueType(item.onclick), "non-empty string", node.migration));
      }
    }
    if (item.type === "dropdown") {
      const title = typeof item.title === "string" ? item.title : "";
      const icon = typeof item.icon === "string" ? item.icon : "";
      if (title.length === 0 && icon.length === 0) {
        issues.push(issue("invalid_value", source, itemPath, "object", "non-empty title or icon", node.migration));
      }
      if (!Array.isArray(item.items) || item.items.length === 0) {
        issues.push(issue("invalid_value", source, `${itemPath}.items`, valueType(item.items), "non-empty array", node.migration));
      } else {
        item.items.forEach((child, childIndex) => {
          if (isPlainObject(child)) validateAction(child, `${itemPath}.items[${childIndex}]`, true);
        });
      }
    }
  }
  input.forEach((item, index) => {
    if (!isPlainObject(item)) return;
    const itemPath = `${path}[${index}]`;
    validateAction(item, itemPath, false);
    if (item.type === "link") {
      if (typeof item.icon !== "string" || item.icon.length === 0) {
        issues.push(issue("missing_field", source, `${itemPath}.icon`, valueType(item.icon), "non-empty string", node.migration));
      }
    }
  });
}

function validateNavigationTabs(node, input, source, path, issues) {
  if (input.length === 0) return;
  for (const [index, item] of input.entries()) {
    if (!isPlainObject(item)) continue;
    if (typeof item.title !== "string" || item.title.length === 0) {
      issues.push(issue("invalid_value", source, `${path}[${index}].title`, valueType(item.title), "non-empty string", node.migration));
    }
    if (!isSafeNavigationUrl(item.url)) {
      issues.push(issue("invalid_value", source, `${path}[${index}].url`, valueType(item.url), "safe navigable URL or root-relative path", node.migration));
    }
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

function validateNullableAbsoluteHttpUrl(node, input, source, path, issues) {
  if (input == null) return;
  validateAbsoluteHttpUrl(node, input, source, path, issues);
}

function validateEmojiTemplate(node, input, source, path, issues) {
  if (typeof input === "string" && input.includes("{name}")) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "URL template containing {name}", node.migration));
}

function validateEmojiSources(node, input, source, path, issues) {
  const selected = input?.default_source;
  const sources = input?.sources;
  if (typeof selected === "string" && isPlainObject(sources) && Object.prototype.hasOwnProperty.call(sources, selected)) return;
  issues.push(issue("invalid_value", source, `${path}.default_source`, valueType(selected), "key declared in emoji.sources", node.migration));
}

function validateGithubRepository(node, input, source, path, issues) {
  if (typeof input === "string" && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(input)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "GitHub owner/repository", node.migration));
}

function validateContributorRepositories(node, input, source, path, issues) {
  const prefixes = new Set();
  input.forEach((item, index) => {
    if (!isPlainObject(item) || typeof item.source_prefix !== "string") return;
    const prefix = item.source_prefix.replace(/\\/g, "/").replace(/^\.\//, "");
    if (prefixes.has(prefix)) {
      issues.push(issue("invalid_value", source, `${path}[${index}].source_prefix`, "string", "unique source_prefix", node.migration));
    }
    prefixes.add(prefix);
  });
}

function validateDiagramsOverride(node, input, source, path, issues) {
  if (input === false) return;
  if (typeof input === "string" && input === "mermaid") return;
  if (isPlainObject(input)) return;
  issues.push(issue("invalid_value", source, path, valueType(input), "false, mermaid, or Mermaid options object", node.migration));
}

function validateSafeRelativePath(node, input, source, path, issues) {
  const unixPath = input.replace(/\\/g, "/");
  const normalized = nodePath.posix.normalize(unixPath);
  const hasDriveRoot = /^[A-Za-z]:/.test(unixPath);
  if (input.length === 0 || nodePath.isAbsolute(input) || nodePath.posix.isAbsolute(unixPath) || hasDriveRoot || /^\.\/?$/.test(normalized) || unixPath.split("/").includes("..")) {
    issues.push(issue("invalid_value", source, path, valueType(input), "safe non-empty relative path", node.migration));
  }
}

function validateCustom(node, input, source, path, issues) {
  if (!node.validator) return;
  if (node.validator === "non_empty_string") validateNonEmptyString(node, input, source, path, issues, false);
  else if (node.validator === "nullable_non_empty_string") validateNonEmptyString(node, input, source, path, issues, true);
  else if (node.validator === "string_tree") validateStringTree(node, input, source, path, issues);
  else if (node.validator === "effect") validateEffect(node, input, source, path, issues);
  else if (node.validator === "brand") validateBrand(node, input, source, path, issues);
  else if (node.validator === "absolute_http_url") validateAbsoluteHttpUrl(node, input, source, path, issues);
  else if (node.validator === "nullable_absolute_http_url") validateNullableAbsoluteHttpUrl(node, input, source, path, issues);
  else if (node.validator === "emoji_template") validateEmojiTemplate(node, input, source, path, issues);
  else if (node.validator === "emoji_sources") validateEmojiSources(node, input, source, path, issues);
  else if (node.validator === "github_repository") validateGithubRepository(node, input, source, path, issues);
  else if (node.validator === "contributor_repositories") validateContributorRepositories(node, input, source, path, issues);
  else if (node.validator === "diagrams_override") validateDiagramsOverride(node, input, source, path, issues);
  else if (node.validator === "safe_navigation_url") validateSafeNavigationUrl(node, input, source, path, issues, false);
  else if (node.validator === "nullable_safe_navigation_url") validateSafeNavigationUrl(node, input, source, path, issues, true);
  else if (node.validator === "nullable_template_navigation_url") validateTemplateNavigationUrl(node, input, source, path, issues, true);
  else if (node.validator === "css_color") validateCssColor(node, input, source, path, issues, false);
  else if (node.validator === "nullable_css_color") validateCssColor(node, input, source, path, issues, true);
  else if (node.validator === "css_length") validateCssLength(node, input, source, path, issues);
  else if (node.validator === "css_percentage") validateCssPercentage(node, input, source, path, issues);
  else if (node.validator === "css_font_family") validateCssFontFamily(node, input, source, path, issues);
  else if (node.validator === "css_gradient") validateCssGradient(node, input, source, path, issues);
  else if (node.validator === "sidebar_gradient_colors") validateSidebarGradientColors(node, input, source, path, issues);
  else if (node.validator === "css_selector") validateCssSelector(node, input, source, path, issues);
  else if (node.validator === "corner_shape") validateCornerShape(node, input, source, path, issues);
  else if (node.validator === "resource") validateResource(node, input, source, path, issues, false);
  else if (node.validator === "nullable_resource") validateResource(node, input, source, path, issues, true);
  else if (node.validator === "non_negative_integer") validateNonNegativeInteger(node, input, source, path, issues, false);
  else if (node.validator === "nullable_non_negative_integer") validateNonNegativeInteger(node, input, source, path, issues, true);
  else if (node.validator === "non_empty_record_keys") validateNonEmptyRecordKeys(node, input, source, path, issues);
  else if (node.validator === "license_value") validateLicense(node, input, source, path, issues, false);
  else if (node.validator === "license_override") validateLicense(node, input, source, path, issues, true);
  else if (node.validator === "share_override") validateShareOverride(node, input, source, path, issues);
  else if (node.validator === "kebab_id") validateKebabId(node, input, source, path, issues);
  else if (node.validator === "nullable_kebab_id") validateNullableKebabId(node, input, source, path, issues);
  else if (node.validator === "menu_items") validateMenuItems(node, input, source, path, issues);
  else if (node.validator === "region_widgets") validateRegionWidgets(node, input, source, path, issues);
  else if (node.validator === "leftbar_content_widgets") validateLeftbarContentWidgets(node, input, source, path, issues);
  else if (node.validator === "footer_actions") validateFooterActions(node, input, source, path, issues);
  else if (node.validator === "navigation_tabs") validateNavigationTabs(node, input, source, path, issues);
  else if (node.validator === "safe_relative_path") validateSafeRelativePath(node, input, source, path, issues);
  else if (node.validator === "topic_route_start" && input != null && !/[\\/]topic[\\/]/.test(source)) {
    issues.push(issue("invalid_scope", source, path, valueType(input), "Topic Collection only", node.migration));
  } else if (!["non_empty_string", "nullable_non_empty_string", "string_tree", "effect", "brand", "absolute_http_url", "nullable_absolute_http_url", "emoji_template", "emoji_sources", "github_repository", "contributor_repositories", "diagrams_override", "safe_navigation_url", "nullable_safe_navigation_url", "nullable_template_navigation_url", "css_color", "nullable_css_color", "css_length", "css_percentage", "css_font_family", "css_gradient", "sidebar_gradient_colors", "css_selector", "corner_shape", "resource", "nullable_resource", "non_negative_integer", "nullable_non_negative_integer", "non_empty_record_keys", "license_value", "license_override", "share_override", "kebab_id", "nullable_kebab_id", "menu_items", "region_widgets", "leftbar_content_widgets", "footer_actions", "navigation_tabs", "safe_relative_path", "topic_route_start"].includes(node.validator)) {
    throw new TypeError(`未知配置校验器：${node.validator}`);
  }
}

function parseNode(node, input, source, path, issues, context) {
  if (input === null && !node.type.includes("null") && context.applyDefaults) {
    input = resolveDefault(node);
  }
  if (node.normalizer === "leftbar_background_type" && typeof input === "string" && !node.values.includes(input)) {
    input = resolveDefault(node);
  }
  if (!matchesType(input, node.type)) {
    issues.push(issue("invalid_type", source, path || "root", valueType(input), expectedType(node), node.migration));
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
      const replacement = input[key] === null && Object.prototype.hasOwnProperty.call(node.removedNullProperties || {}, key)
        ? node.removedNullProperties[key]
        : node.removedProperties[key];
      const absoluteRoots = new Set(["site", "seo", "layout", "content", "appearance", "resources", "extensions", "inject"]);
      const replacementPath = replacement == null
        ? null
        : absoluteRoots.has(replacement.split(".")[0])
          ? replacement
          : (path ? `${path}.${replacement}` : replacement);
      issues.push(issue(
        "removed_field",
        source,
        childPath,
        valueType(input[key]),
        replacementPath == null ? "remove field without replacement" : replacementPath,
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
  return ["menu_item", "footer_action", "footer_action_item"].includes(node.normalizer)
    ? normalizeValue(node, result)
    : result;
}

function validateStellarSemantics(config, source) {
  const menuItems = config.menu?.items || [];
  if (menuItems.length === 0) return;
  const ids = new Set(menuItems.map(item => item.id).filter(id => typeof id === "string"));
  if (ids.size === 0) return;
  const issues = [];
  for (const [profile, definition] of Object.entries(config.profiles || {})) {
    const activeMenu = definition?.activeMenu;
    if (activeMenu != null && !ids.has(activeMenu)) {
      issues.push(issue(
        "invalid_value",
        source,
        `profiles.${profile}.active_menu`,
        "string",
        "id present in menu.items",
        null
      ));
    }
  }
  if (issues.length > 0) throw new ConfigSchemaError(issues);
}

function parseConfigSchemaStrict(schema, input = {}, options = {}) {
  const source = options.source || "<config>";
  const issues = [];
  const parsed = parseNode(schema, isPlainObject(input) ? input : input, source, "", issues, {
    applyDefaults: options.applyDefaults ?? schema.applyDefaults ?? false
  });
  if (issues.length > 0) throw new ConfigSchemaError(issues);
  const frozen = deepFreeze(parsed);
  options.validate?.(frozen, source);
  return frozen;
}

function pathTokens(value) {
  const tokens = [];
  for (const match of String(value).matchAll(/(?:^|\.)([^.\[]+)|\[(\d+)\]/g)) {
    tokens.push(match[1] === undefined ? Number(match[2]) : match[1]);
  }
  return tokens;
}

function valueAt(root, tokens) {
  let value = root;
  for (const token of tokens) {
    if (value == null || !Object.prototype.hasOwnProperty.call(value, token)) return undefined;
    value = value[token];
  }
  return value;
}

function inputPathTokens(root, tokens) {
  const resolved = [];
  let current = root;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (current != null && Object.prototype.hasOwnProperty.call(current, token)) {
      resolved.push(token);
      current = current[token];
      continue;
    }
    if (typeof token === "string" && isPlainObject(current)) {
      let matched = false;
      for (let end = tokens.length; end > index + 1; end -= 1) {
        const parts = tokens.slice(index, end);
        if (parts.some(part => typeof part !== "string")) continue;
        const joined = parts.join(".");
        if (!Object.prototype.hasOwnProperty.call(current, joined)) continue;
        resolved.push(joined);
        current = current[joined];
        index = end - 1;
        matched = true;
        break;
      }
      if (matched) continue;
    }
    resolved.push(...tokens.slice(index));
    break;
  }
  return resolved;
}

function deleteAt(root, tokens) {
  if (tokens.length === 0) return false;
  const parent = valueAt(root, tokens.slice(0, -1));
  const key = tokens.at(-1);
  if (parent == null || !Object.prototype.hasOwnProperty.call(parent, key)) return false;
  if (Array.isArray(parent) && Number.isInteger(key)) parent.splice(key, 1);
  else delete parent[key];
  return true;
}

function snakeCase(value) {
  return typeof value === "string" ? value.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`) : value;
}

function setAt(root, tokens, value) {
  if (tokens.length === 0) return false;
  let parent = root;
  for (const rawToken of tokens.slice(0, -1)) {
    const token = snakeCase(rawToken);
    if (!isPlainObject(parent[token])) parent[token] = {};
    parent = parent[token];
  }
  parent[snakeCase(tokens.at(-1))] = value;
  return true;
}

function recoveryTarget(root, currentIssue) {
  const tokens = inputPathTokens(root, pathTokens(currentIssue.path));
  const arrayIndex = tokens.findLastIndex(Number.isInteger);
  if (arrayIndex >= 0) return tokens.slice(0, arrayIndex + 1);
  if (currentIssue.code !== "missing_field") return tokens;
  if (valueAt(root, tokens) !== undefined) return tokens;
  return tokens.slice(0, -1);
}

function recoveryAction(currentIssue, target) {
  if (target.some(Number.isInteger)) return "忽略无效列表项";
  if (["unknown_field", "removed_field"].includes(currentIssue.code)) return "忽略字段";
  return "使用默认值或上一层有效配置";
}

function recoverConfigInput(input, issues) {
  const recovered = clone(input);
  const targets = issues.map(currentIssue => ({
    issue: currentIssue,
    tokens: recoveryTarget(recovered, currentIssue)
  }));
  const deleteTargets = [...new Map(targets.map(target => [JSON.stringify(target.tokens), target])).values()];
  deleteTargets.sort((left, right) => {
    const leftIndex = left.tokens.findLast(token => Number.isInteger(token));
    const rightIndex = right.tokens.findLast(token => Number.isInteger(token));
    return right.tokens.length - left.tokens.length || (rightIndex || 0) - (leftIndex || 0);
  });
  const originalArrays = new Map();
  let changed = false;
  for (const target of deleteTargets) {
    const numberIndex = target.tokens.findLastIndex(Number.isInteger);
    if (numberIndex >= 0) {
      const arrayTokens = target.tokens.slice(0, numberIndex);
      const key = JSON.stringify(arrayTokens);
      if (!originalArrays.has(key)) {
        const original = valueAt(input, arrayTokens);
        originalArrays.set(key, { tokens: arrayTokens, nonEmpty: Array.isArray(original) && original.length > 0 });
      }
    }
    const deleted = deleteAt(recovered, target.tokens);
    if (!deleted && target.issue.expected === "id present in menu.items") {
      changed = setAt(recovered, target.tokens, null) || changed;
    } else {
      changed = deleted || changed;
    }
  }
  for (const { tokens, nonEmpty } of originalArrays.values()) {
    if (nonEmpty && Array.isArray(valueAt(recovered, tokens)) && valueAt(recovered, tokens).length === 0) {
      changed = deleteAt(recovered, tokens) || changed;
    }
  }
  return {
    changed,
    input: recovered,
    diagnostics: targets.map(target => Object.freeze({
      ...target.issue,
      action: recoveryAction(target.issue, target.tokens)
    }))
  };
}

function uniqueDiagnostics(diagnostics) {
  const seen = new Set();
  return diagnostics.filter(item => {
    const key = [item.code, item.source, item.path, item.expected, item.action].join("\u0000");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseConfigSchema(schema, input = {}, options = {}) {
  if (options.mode !== "recover") return parseConfigSchemaStrict(schema, input, options);
  let candidate = clone(input);
  let diagnostics = [];
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const parsed = parseConfigSchemaStrict(schema, candidate, options);
      options.onIssues?.(Object.freeze(uniqueDiagnostics(diagnostics)));
      return parsed;
    } catch (error) {
      if (!(error instanceof ConfigSchemaError)) throw error;
      const fatal = error.issues.filter(currentIssue => currentIssue.path === "root" || options.isFatalIssue?.(currentIssue));
      const recoverable = error.issues.filter(currentIssue => !fatal.includes(currentIssue));
      if (recoverable.length > 0) {
        const recovery = recoverConfigInput(candidate, recoverable);
        diagnostics.push(...recovery.diagnostics);
        if (recovery.changed) {
          candidate = recovery.input;
          continue;
        }
      }
      if (fatal.length > 0) {
        options.onIssues?.(Object.freeze(uniqueDiagnostics(diagnostics)));
        throw new ConfigSchemaError(fatal);
      }
      options.onIssues?.(Object.freeze(uniqueDiagnostics(diagnostics)));
      throw error;
    }
  }
  throw new ConfigSchemaError([issue("invalid_value", options.source || "<config>", "root", "object", "recoverable configuration", null)]);
}

function parseStellarConfig(input = {}) {
  const source = input.source || "_config.stellar.yml";
  const themeConfig = input.themeConfig === undefined ? {} : input.themeConfig;
  return parseConfigSchema(CONFIG_SCHEMA, themeConfig, {
    source,
    applyDefaults: true,
    mode: input.mode,
    onIssues: input.onIssues,
    isFatalIssue: input.isFatalIssue,
    validate: validateStellarSemantics
  });
}

function formatConfigWarnings(issues) {
  if (!Array.isArray(issues) || issues.length === 0) return "";
  return [
    `Stellar: 已忽略 ${issues.length} 项不支持的配置：`,
    ...issues.map(currentIssue => `- ${formatIssue(currentIssue)}；处理：${currentIssue.action}`)
  ].join("\n");
}

module.exports = {
  ConfigSchemaError,
  deepFreeze,
  formatConfigWarnings,
  formatIssue,
  isPlainObject,
  parseConfigSchema,
  parseStellarConfig,
  valueType
};
