/* global hexo */

"use strict";

const CONTRIBUTION_KINDS = new Set(["extension", "feature", "component"]);
const ENTRY_TYPES = new Set(["browser-module", "template"]);
const ACTIVATION_TYPES = new Set(["always", "selector", "server"]);
const DEFINITION_FIELDS = new Set([
  "id",
  "kind",
  "entry",
  "resources",
  "activation",
  "schema",
  "i18n",
  "docs",
  "tests",
  "defaultsOwner",
  "project"
]);

function deepFreeze(value) {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function plainObject(value, label) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`[stellar contributions] ${label} must be an object`);
  }
  return value;
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`[stellar contributions] ${label} must be a non-empty string`);
  }
}

function stringList(value, label, options = {}) {
  if (!Array.isArray(value) || (!options.allowEmpty && value.length === 0)) {
    throw new TypeError(`[stellar contributions] ${label} must be ${options.allowEmpty ? "an" : "a non-empty"} array`);
  }
  const seen = new Set();
  value.forEach((item, index) => {
    nonEmptyString(item, `${label}[${index}]`);
    if (seen.has(item)) throw new TypeError(`[stellar contributions] duplicate ${label} value ${item}`);
    seen.add(item);
  });
}

function validateEntry(entry, label) {
  plainObject(entry, label);
  const allowed = new Set(["type", "path", "adapter"]);
  const unknown = Object.keys(entry).find(key => !allowed.has(key));
  if (unknown) throw new TypeError(`[stellar contributions] ${label} has unknown field ${unknown}`);
  if (!ENTRY_TYPES.has(entry.type)) throw new TypeError(`[stellar contributions] ${label}.type is invalid`);
  nonEmptyString(entry.path, `${label}.path`);
  if (entry.type === "browser-module" && (!entry.path.startsWith("/js/runtime/") || !entry.path.endsWith(".js"))) {
    throw new TypeError(`[stellar contributions] ${label}.path must be a local runtime .js path`);
  }
  if (entry.type === "template" && !entry.path.startsWith("layout/")) {
    throw new TypeError(`[stellar contributions] ${label}.path must be a layout path`);
  }
  if (entry.adapter !== undefined && entry.adapter !== "feature") {
    throw new TypeError(`[stellar contributions] ${label}.adapter is invalid`);
  }
}

function validateActivation(activation, label) {
  plainObject(activation, label);
  const allowed = new Set(["type", "value"]);
  const unknown = Object.keys(activation).find(key => !allowed.has(key));
  if (unknown) throw new TypeError(`[stellar contributions] ${label} has unknown field ${unknown}`);
  if (!ACTIVATION_TYPES.has(activation.type)) throw new TypeError(`[stellar contributions] ${label}.type is invalid`);
  if (activation.type === "always") {
    if (activation.value !== undefined) throw new TypeError(`[stellar contributions] ${label}.value is not allowed for always`);
    return;
  }
  nonEmptyString(activation.value, `${label}.value`);
}

function validateI18n(i18n, label) {
  if (i18n === null) return;
  plainObject(i18n, label);
  const unknown = Object.keys(i18n).find(key => !["namespace", "keys"].includes(key));
  if (unknown) throw new TypeError(`[stellar contributions] ${label} has unknown field ${unknown}`);
  nonEmptyString(i18n.namespace, `${label}.namespace`);
  stringList(i18n.keys, `${label}.keys`);
}

function validateDocs(docs, label) {
  plainObject(docs, label);
  const unknown = Object.keys(docs).find(key => !["category", "path"].includes(key));
  if (unknown) throw new TypeError(`[stellar contributions] ${label} has unknown field ${unknown}`);
  nonEmptyString(docs.category, `${label}.category`);
  nonEmptyString(docs.path, `${label}.path`);
}

function validateContributionDefinitions(definitions) {
  if (!Array.isArray(definitions) || definitions.length === 0) {
    throw new TypeError("[stellar contributions] registry must be a non-empty array");
  }
  const ids = new Set();
  const resourceOwners = new Map();
  const schemaOwners = new Map();

  definitions.forEach((definition, index) => {
    const label = `definitions[${index}]`;
    plainObject(definition, label);
    const unknown = Object.keys(definition).find(key => !DEFINITION_FIELDS.has(key));
    if (unknown) throw new TypeError(`[stellar contributions] ${label} has unknown field ${unknown}`);
    const missing = [...DEFINITION_FIELDS].find(key => !Object.prototype.hasOwnProperty.call(definition, key));
    if (missing) throw new TypeError(`[stellar contributions] ${label} is missing field ${missing}`);
    if (typeof definition.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(definition.id)) {
      throw new TypeError(`[stellar contributions] ${label}.id is invalid`);
    }
    if (ids.has(definition.id)) throw new TypeError(`[stellar contributions] duplicate contribution id ${definition.id}`);
    ids.add(definition.id);
    if (!CONTRIBUTION_KINDS.has(definition.kind)) throw new TypeError(`[stellar contributions] ${label}.kind is invalid`);
    validateEntry(definition.entry, `${label}.entry`);
    stringList(definition.resources, `${label}.resources`);
    validateActivation(definition.activation, `${label}.activation`);
    if (definition.schema !== null) nonEmptyString(definition.schema, `${label}.schema`);
    validateI18n(definition.i18n, `${label}.i18n`);
    validateDocs(definition.docs, `${label}.docs`);
    stringList(definition.tests, `${label}.tests`);
    if (definition.defaultsOwner !== null) nonEmptyString(definition.defaultsOwner, `${label}.defaultsOwner`);
    if ((definition.schema === null) !== (definition.defaultsOwner === null)) {
      throw new TypeError(`[stellar contributions] ${definition.id} schema and defaultsOwner must both be null or strings`);
    }
    if (definition.project !== null && typeof definition.project !== "function") {
      throw new TypeError(`[stellar contributions] ${label}.project must be a function or null`);
    }
    if (definition.project !== null && definition.entry.type !== "browser-module") {
      throw new TypeError(`[stellar contributions] ${definition.id} projected contribution must use a browser-module entry`);
    }

    definition.resources.forEach(resource => {
      if (resourceOwners.has(resource)) {
        throw new TypeError(`[stellar contributions] resource ${resource} is owned by both ${resourceOwners.get(resource)} and ${definition.id}`);
      }
      resourceOwners.set(resource, definition.id);
    });
    if (definition.schema !== null) {
      const owner = schemaOwners.get(definition.schema);
      if (owner && owner !== definition.defaultsOwner) {
        throw new TypeError(`[stellar contributions] schema ${definition.schema} has conflicting defaults owners ${owner} and ${definition.defaultsOwner}`);
      }
      schemaOwners.set(definition.schema, definition.defaultsOwner);
    }
  });
  return definitions;
}

function defineContributions(definitions) {
  validateContributionDefinitions(definitions);
  return deepFreeze(definitions.slice());
}

module.exports = {
  defineContributions,
  validateContributionDefinitions
};
