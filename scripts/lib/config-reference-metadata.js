/* global hexo */
"use strict";

const { CONFIG_SCHEMA } = require("../schema/config-schema");
const {
  COLLECTION_CONFIG_SCHEMA,
  FRONT_MATTER_CONFIG_SCHEMA
} = require("../schema/content-config-schema");

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value == null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
}

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function flattenConfigFields(schema) {
  const fields = [];

  function addField(node, path, runtimePath) {
    fields.push({
      path,
      runtimePath,
      type: clone(node.type),
      default: clone(node.default),
      scope: node.scope,
      cascade: clone(node.cascade),
      normalizer: node.normalizer,
      normalization: node.normalization,
      consumers: clone(node.consumers),
      example: clone(node.example),
      migration: node.migration,
      ...(node.sealed ? { sealed: true } : {}),
      ...(node.values ? { values: clone(node.values) } : {}),
      ...(node.minimum !== undefined ? { minimum: node.minimum } : {}),
      ...(node.maximum !== undefined ? { maximum: node.maximum } : {}),
      ...(node.exclusiveMinimum !== undefined ? { exclusiveMinimum: node.exclusiveMinimum } : {})
    });
  }

  function visit(node, yamlPrefix, runtimePrefix) {
    for (const key of Object.keys(node.properties || {}).sort(compareText)) {
      const child = node.properties[key];
      const path = yamlPrefix ? `${yamlPrefix}.${key}` : key;
      const runtimeKey = child.runtimeKey || key;
      const runtimePath = runtimePrefix ? `${runtimePrefix}.${runtimeKey}` : runtimeKey;
      addField(child, path, runtimePath);
      visit(child, path, runtimePath);
      if (child.items?.properties || child.items?.additionalProperties) {
        visit(child.items, `${path}[]`, `${runtimePath}[]`);
      }
      if (child.additionalProperties) {
        const recordKey = child.additionalPropertyKey || "<key>";
        const recordPath = `${path}.${recordKey}`;
        const recordRuntimePath = `${runtimePath}.${recordKey}`;
        addField(child.additionalProperties, recordPath, recordRuntimePath);
        visit(child.additionalProperties, recordPath, recordRuntimePath);
      }
    }
  }

  visit(schema, "", "");
  return fields;
}

function generateConfigReferenceMetadata() {
  return {
    schemaVersion: 1,
    source: [
      "scripts/schema/config-schema.js",
      "scripts/schema/content-config-schema.js"
    ],
    status: "delivered",
    fields: [
      ...flattenConfigFields(CONFIG_SCHEMA),
      ...flattenConfigFields(COLLECTION_CONFIG_SCHEMA),
      ...flattenConfigFields(FRONT_MATTER_CONFIG_SCHEMA)
    ]
  };
}

function stringifyConfigReferenceMetadata() {
  return `${JSON.stringify(generateConfigReferenceMetadata(), null, 2)}\n`;
}

module.exports = {
  flattenConfigFields,
  generateConfigReferenceMetadata,
  stringifyConfigReferenceMetadata
};
