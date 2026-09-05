/* global hexo */
"use strict";

function deepFreeze(value) {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function flattenSchemaFields(schema) {
  const fields = [];

  function visit(node, yamlPrefix, runtimePrefix, includeSelf = false) {
    const properties = Object.entries(node.properties || {});
    const itemProperties = Object.keys(node.items?.properties || {});
    if (includeSelf && properties.length === 0 && itemProperties.length === 0 && !node.additionalProperties) {
      fields.push({
        path: yamlPrefix,
        runtimePath: runtimePrefix,
        type: Array.isArray(node.type) ? [...node.type] : []
      });
      return;
    }

    for (const [key, child] of properties) {
      const yamlPath = yamlPrefix ? `${yamlPrefix}.${key}` : key;
      const runtimeKey = child.runtimeKey || key;
      const runtimePath = runtimePrefix ? `${runtimePrefix}.${runtimeKey}` : runtimeKey;
      if (child.items?.properties || child.items?.additionalProperties) {
        visit(child.items, `${yamlPath}[]`, `${runtimePath}[]`, true);
      } else {
        visit(child, yamlPath, runtimePath, true);
      }
      if (child.additionalProperties) {
        const recordKey = child.additionalPropertyKey || "<key>";
        visit(child.additionalProperties, `${yamlPath}.${recordKey}`, `${runtimePath}.${recordKey}`, true);
      }
    }
  }

  visit(schema, "", "");
  return fields;
}

module.exports = {
  deepFreeze,
  flattenSchemaFields
};
