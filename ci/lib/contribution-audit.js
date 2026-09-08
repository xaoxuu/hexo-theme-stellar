"use strict";

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");
const { validateContributionDefinitions } = require("../../scripts/lib/contribution-contract");
const { flattenSchemaFields } = require("../../scripts/schema/schema-utils");
const { CONFIG_SCHEMA } = require("../../scripts/schema/config-schema");

function leafPaths(value, parents = [], result = []) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    result.push(parents.join("."));
    return result;
  }
  for (const [key, child] of Object.entries(value)) leafPaths(child, [...parents, key], result);
  return result;
}

function hasPath(value, target) {
  let current = value;
  for (const key of target.split(".")) {
    if (current == null || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, key)) return false;
    current = current[key];
  }
  return true;
}

function entryFile(entry) {
  if (entry.type === "template") return entry.path;
  return path.posix.join("source", entry.path.replace(/^\//, ""));
}

function loadLanguages(root, ids) {
  return Object.fromEntries(ids.map(id => [
    id,
    yaml.load(fs.readFileSync(path.join(root, "languages", `${id}.yml`), "utf8"))
  ]));
}

function auditContributionRegistry(options) {
  const root = path.resolve(options.root);
  const definitions = options.definitions;
  const assets = options.assets;
  const languages = options.languages || loadLanguages(root, ["en", "zh-CN", "zh-TW"]);
  const schemaFields = options.schemaFields || flattenSchemaFields(CONFIG_SCHEMA);
  const issues = [];
  const diagnostic = message => options.onWarning?.(message);

  try {
    validateContributionDefinitions(definitions);
  } catch (error) {
    issues.push(error.message);
    return issues;
  }

  const assetLeaves = leafPaths(assets).sort();
  const assetOwners = new Map();
  for (const definition of definitions) {
    for (const resource of definition.resources) {
      const ownedLeaves = assetLeaves.filter(asset => asset === resource || asset.startsWith(`${resource}.`));
      if (ownedLeaves.length === 0) {
        issues.push(`${definition.id}: registered resource ${resource} does not exist`);
        continue;
      }
      for (const asset of ownedLeaves) {
        if (assetOwners.has(asset)) {
          issues.push(`${asset}: resource is owned by both ${assetOwners.get(asset)} and ${definition.id}`);
        } else {
          assetOwners.set(asset, definition.id);
        }
      }
    }
  }
  for (const asset of assetLeaves) {
    if (!assetOwners.has(asset)) issues.push(`${asset}: internal asset has no contribution owner`);
  }

  const schemaPaths = schemaFields.map(field => field.path);
  for (const definition of definitions) {
    const entry = entryFile(definition.entry);
    if (!fs.existsSync(path.join(root, entry))) issues.push(`${definition.id}: entry file ${entry} does not exist`);
    if (typeof definition.docs?.path !== "string" || !definition.docs.path || !fs.existsSync(path.join(root, definition.docs.path))) {
      diagnostic(`${definition.id}: docs file ${definition.docs?.path || "<missing>"} does not exist`);
    }
    if (!Array.isArray(definition.tests) || !definition.tests.length) diagnostic(`${definition.id}: tests is empty`);
    for (const testFile of Array.isArray(definition.tests) ? definition.tests : []) {
      if (typeof testFile !== "string" || !testFile) {
        diagnostic(`${definition.id}: contract test path must be a non-empty string`);
        continue;
      }
      const absolute = path.join(root, testFile);
      if (!fs.existsSync(absolute)) {
        diagnostic(`${definition.id}: contract test ${testFile} does not exist`);
      } else if (!fs.statSync(absolute).isFile()) {
        diagnostic(`${definition.id}: contract test ${testFile} is not a file`);
      }
    }

    if (definition.schema !== null) {
      const count = schemaPaths.filter(item => item === definition.schema).length;
      if (count !== 1) issues.push(`${definition.id}: schema ${definition.schema} appears ${count} times in Theme Schema`);
      const [ownerFile, ownerPath] = definition.defaultsOwner.split("#");
      if (ownerPath !== definition.schema) {
        issues.push(`${definition.id}: defaults owner path ${ownerPath || "<missing>"} differs from schema ${definition.schema}`);
      }
      if (!fs.existsSync(path.join(root, ownerFile))) issues.push(`${definition.id}: defaults owner ${ownerFile} does not exist`);
    }

    for (const key of definition.i18n?.keys || []) {
      for (const [language, messages] of Object.entries(languages)) {
        if (!hasPath(messages, key)) issues.push(`${definition.id}: language ${language} is missing ${key}`);
      }
    }
  }
  return issues;
}

function assertContributionRegistry(options) {
  const issues = auditContributionRegistry(options);
  if (issues.length > 0) {
    throw new Error(`Contribution registry audit failed:\n- ${issues.join("\n- ")}`);
  }
}

module.exports = {
  assertContributionRegistry,
  auditContributionRegistry,
  leafPaths
};
