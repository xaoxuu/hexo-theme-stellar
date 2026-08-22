/* global hexo */
"use strict";

const { CONFIG_SCHEMA } = require("../schema/config-schema");

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

  function visit(node, yamlPrefix, runtimePrefix) {
    for (const key of Object.keys(node.properties || {}).sort(compareText)) {
      const child = node.properties[key];
      const path = yamlPrefix ? `${yamlPrefix}.${key}` : key;
      const runtimeKey = child.runtimeKey || key;
      const runtimePath = runtimePrefix ? `${runtimePrefix}.${runtimeKey}` : runtimeKey;
      fields.push({
        path,
        runtimePath,
        type: clone(child.type),
        default: clone(child.default),
        scope: child.scope,
        cascade: clone(child.cascade),
        normalizer: child.normalizer,
        normalization: child.normalization,
        consumers: clone(child.consumers),
        example: clone(child.example),
        migration: child.migration,
        ...(child.sealed ? { sealed: true } : {})
      });
      visit(child, path, runtimePath);
    }
  }

  visit(schema, "", "");
  return fields;
}

function generateConfigReferenceMetadata() {
  return {
    schemaVersion: 1,
    source: "scripts/schema/config-schema.js",
    status: "partial",
    fields: flattenConfigFields(CONFIG_SCHEMA)
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
