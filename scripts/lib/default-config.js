/* global hexo */
"use strict";

const yaml = require("js-yaml");

const { CONFIG_SCHEMA } = require("../schema/config-schema");

function defaultValue(node) {
  if (node.default?.kind !== "literal") {
    throw new Error(`Theme Schema 默认值必须是 literal：${node.description}`);
  }
  return node.default.value;
}

function yamlLines(value) {
  return yaml.dump(value, {
    flowLevel: 1,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  }).trimEnd().split("\n");
}

const TYPE_LABELS = Object.freeze({
  array: "数组",
  boolean: "布尔值",
  null: "null",
  number: "数字",
  object: "对象",
  string: "字符串"
});

function displayValue(value) {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function constraintHint(node) {
  const hints = [];
  const types = (node.type || []).map(type => TYPE_LABELS[type] || type);
  if (types.length > 0) hints.push(types.join("或"));
  if (Array.isArray(node.values)) hints.push(`可选值：${node.values.map(displayValue).join(" / ")}`);
  if (node.type?.includes("array") && node.items?.type) {
    hints.push(`元素：${node.items.type.map(type => TYPE_LABELS[type] || type).join("或")}`);
  }
  if (node.minimum !== undefined && node.maximum !== undefined) {
    hints.push(`范围：${node.minimum}–${node.maximum}`);
  } else if (node.minimum !== undefined) {
    hints.push(`最小值：${node.minimum}`);
  } else if (node.exclusiveMinimum !== undefined) {
    hints.push(`必须大于 ${node.exclusiveMinimum}`);
  } else if (node.maximum !== undefined) {
    hints.push(`最大值：${node.maximum}`);
  }
  if (node.type?.includes("object") && node.sealed === false) hints.push("允许自定义键");
  return hints.join("；");
}

function commentLine(node, indent) {
  if (!node.description) return [];
  const prefix = " ".repeat(indent);
  const hint = constraintHint(node);
  return [`${prefix}# ${node.description}${hint ? ` [${hint}]` : ""}`];
}

function commentedExample(node, indent) {
  if (node.yaml?.example === undefined) return [];
  const prefix = " ".repeat(indent);
  const lines = yamlLines(node.yaml.example);
  return [`${prefix}# Example:`, ...lines.map(line => `${prefix}#   ${line}`)];
}

function renderLeaf(key, node, indent, path) {
  if (!node.description) throw new Error(`Theme Schema 活动叶子缺少语义描述：${path}`);
  const prefix = " ".repeat(indent);
  const value = defaultValue(node);
  const rendered = yamlLines({ [key]: value }).map(line => `${prefix}${line}`);
  const shouldShowExample = node.yaml?.example !== undefined
    && JSON.stringify(node.yaml.example) !== JSON.stringify(value);
  return [
    ...commentLine(node, indent),
    ...(shouldShowExample ? commentedExample(node, indent) : []),
    ...rendered
  ];
}

function renderNode(key, node, indent, path = key) {
  const properties = Object.entries(node.properties || {})
    .sort(([, left], [, right]) => (left.yaml?.order || 0) - (right.yaml?.order || 0));
  if (properties.length === 0) return renderLeaf(key, node, indent, path);

  const prefix = " ".repeat(indent);
  const lines = [...commentLine(node, indent), `${prefix}${key}:`];
  for (const [childKey, child] of properties) {
    lines.push(...renderNode(childKey, child, indent + 2, `${path}.${childKey}`));
  }
  return lines;
}

function stringifyDefaultConfig(schema = CONFIG_SCHEMA) {
  const roots = Object.entries(schema.properties || {})
    .sort(([, left], [, right]) => (left.yaml?.order || 0) - (right.yaml?.order || 0));
  const lines = [
    "# Stellar v2 主题默认配置。",
    "# 由 scripts/schema/config-schema.js 自动生成，请勿手工编辑。",
    "# 注释格式：用途与空值行为。[类型；枚举、范围或元素类型]",
    "# 修改 CONFIG_SCHEMA 后运行 `npm run schema:generate`。",
    ""
  ];
  roots.forEach(([key, node], index) => {
    if (index > 0) lines.push("");
    lines.push(...renderNode(key, node, 0, key));
  });
  return `${lines.join("\n")}\n`;
}

module.exports = {
  stringifyDefaultConfig
};
