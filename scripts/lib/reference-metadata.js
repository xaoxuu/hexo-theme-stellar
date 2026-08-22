/* global hexo */
"use strict";

const { MODEL_SCHEMAS, PROFILES } = require("../schema/model-schema");

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value == null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
}

function flattenFields(schema) {
  const fields = [];

  function visit(properties, prefix) {
    for (const key of Object.keys(properties || {}).sort(compareText)) {
      const node = properties[key];
      const path = prefix ? `${prefix}.${key}` : key;
      fields.push({
        path,
        type: clone(node.type),
        required: node.required === true,
        default: clone(node.default),
        scope: node.scope,
        consumers: clone(node.consumers),
        example: clone(node.example),
        ...(node.reference ? { reference: node.reference } : {}),
        ...(node.additionalProperties ? { open: true } : {})
      });
      visit(node.properties, path);
      if (node.items?.properties) visit(node.items.properties, `${path}[]`);
    }
  }

  visit(schema.properties, "");
  return fields;
}

function generateReferenceMetadata() {
  const collectionModels = Object.keys(MODEL_SCHEMAS.CollectionModel.profiles)
    .sort(compareText)
    .map(profile => ({
      name: "CollectionModel",
      profile,
      fields: flattenFields(MODEL_SCHEMAS.CollectionModel.profiles[profile])
    }));

  return {
    schemaVersion: 1,
    source: "scripts/schema/model-schema.js",
    profiles: [...PROFILES].sort(compareText),
    models: [
      ...collectionModels,
      {
        name: "ContentItemModel",
        profiles: [...PROFILES].sort(compareText),
        fields: flattenFields(MODEL_SCHEMAS.ContentItemModel.schema)
      },
      {
        name: "PageViewModel",
        profiles: [...PROFILES].sort(compareText),
        fields: flattenFields(MODEL_SCHEMAS.PageViewModel.schema)
      }
    ]
  };
}

function stringifyReferenceMetadata() {
  return `${JSON.stringify(generateReferenceMetadata(), null, 2)}\n`;
}

module.exports = {
  flattenFields,
  generateReferenceMetadata,
  stringifyReferenceMetadata
};
