/* global hexo */
"use strict";

const { MODEL_SCHEMAS, PROFILES } = require("../schema/model-schema");

class ModelSchemaError extends Error {
  constructor(issues) {
    super(`Stellar v2 模型 Schema 校验失败：\n${issues.map(issue => `- ${issue}`).join("\n")}`);
    this.name = "ModelSchemaError";
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
  return typeof value;
}

function matchesType(value, type) {
  if (type === "any") return true;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return isPlainObject(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "null") return value === null;
  return typeof value === type;
}

function resolveReference(reference, profile) {
  if (reference === "CollectionModel") return MODEL_SCHEMAS.CollectionModel.profiles[profile];
  if (reference === "ContentItemModel") return MODEL_SCHEMAS.ContentItemModel.schema;
  throw new ModelSchemaError([`未知模型引用 ${reference}`]);
}

function validateNode(node, value, path, profile, issues) {
  if (!node.type.some(type => matchesType(value, type))) {
    issues.push(`${path} 应为 ${node.type.join(" | ")}，实际为 ${valueType(value)}`);
    return;
  }

  if (node.reference) {
    validateNode(resolveReference(node.reference, profile), value, path, profile, issues);
    return;
  }

  if (Array.isArray(value) && node.items) {
    value.forEach((item, index) => validateNode(node.items, item, `${path}[${index}]`, profile, issues));
    return;
  }

  if (!isPlainObject(value)) return;
  const properties = node.properties || {};
  for (const [key, child] of Object.entries(properties)) {
    if (child.required && !Object.prototype.hasOwnProperty.call(value, key)) {
      issues.push(`${path}.${key} 缺少必填模型字段`);
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      validateNode(child, value[key], `${path}.${key}`, profile, issues);
    }
  }
  if (!node.additionalProperties) {
    for (const key of Object.keys(value)) {
      if (!Object.prototype.hasOwnProperty.call(properties, key)) {
        issues.push(`${path}.${key} 未在模型 Schema 中声明`);
      }
    }
  }
}

function assertPageViewModel(profile, value) {
  if (!PROFILES.includes(profile)) {
    throw new ModelSchemaError([`未知 Collection profile ${profile}`]);
  }
  const issues = [];
  validateNode(MODEL_SCHEMAS.PageViewModel.profiles[profile], value, "PageViewModel", profile, issues);
  if (issues.length > 0) throw new ModelSchemaError(issues);
  return value;
}

module.exports = {
  ModelSchemaError,
  assertPageViewModel
};
