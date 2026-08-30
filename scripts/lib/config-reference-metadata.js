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

function defaultValue(node) {
  if (node.default?.kind === "literal") return clone(node.default.value);
  return clone(node.default);
}

function flattenConfigFields(schema, surface = "Theme") {
  const fields = [];

  function addField(node, path, runtimePath) {
    fields.push({
      surface,
      path,
      runtimePath,
      type: clone(node.type),
      default: defaultValue(node),
      ...(node.values ? { values: clone(node.values) } : {}),
      ...(node.minimum !== undefined ? { minimum: node.minimum } : {}),
      ...(node.maximum !== undefined ? { maximum: node.maximum } : {}),
      ...(node.exclusiveMinimum !== undefined ? { exclusiveMinimum: node.exclusiveMinimum } : {}),
      ...(node.validator ? { validator: node.validator } : {}),
      ...(node.additionalProperties ? { open: node.sealed !== true } : {})
    });
  }

  function visit(node, yamlPrefix, runtimePrefix, includeSelf = false) {
    const properties = Object.keys(node.properties || {});
    const itemProperties = Object.keys(node.items?.properties || {});
    if (includeSelf && properties.length === 0 && itemProperties.length === 0 && !node.additionalProperties) {
      addField(node, yamlPrefix, runtimePrefix);
      return;
    }
    for (const key of properties) {
      const child = node.properties[key];
      const path = yamlPrefix ? `${yamlPrefix}.${key}` : key;
      const runtimeKey = child.runtimeKey || key;
      const runtimePath = runtimePrefix ? `${runtimePrefix}.${runtimeKey}` : runtimeKey;
      if (child.items?.properties || child.items?.additionalProperties) {
        visit(child.items, `${path}[]`, `${runtimePath}[]`, true);
      } else {
        visit(child, path, runtimePath, true);
      }
      if (child.additionalProperties) {
        const recordKey = child.additionalPropertyKey || "<key>";
        const recordPath = `${path}.${recordKey}`;
        const recordRuntimePath = `${runtimePath}.${recordKey}`;
        visit(child.additionalProperties, recordPath, recordRuntimePath, true);
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
      "_config.yml",
      "scripts/schema/config-rules.js",
      "scripts/schema/content-config-schema.js"
    ],
    fields: [
      ...flattenConfigFields(CONFIG_SCHEMA, "Theme"),
      ...flattenConfigFields(COLLECTION_CONFIG_SCHEMA, "Collection"),
      ...flattenConfigFields(FRONT_MATTER_CONFIG_SCHEMA, "Front Matter")
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
