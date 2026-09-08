/* global hexo */
"use strict";

const {
  ConfigSchemaError,
  deepFreeze,
  formatIssue,
  isPlainObject,
  parseConfigSchema
} = require("./config-schema");
const {
  COLLECTION_CONFIG_SCHEMA,
  FRONT_MATTER_CONFIG_SCHEMA
} = require("../schema/content-config-schema");

// Project the declared content fields; do not maintain a second field whitelist.
const contentFields = node => Object.freeze(Object.entries(node?.properties || {})
  .map(([key, child]) => child.runtimeKey || key));
const CONTENT_MODEL_FIELDS = Object.freeze({
  ...Object.fromEntries(Object.entries(FRONT_MATTER_CONFIG_SCHEMA.properties)
    .filter(([, node]) => node.properties)
    .map(([key, node]) => [node.runtimeKey || key, contentFields(node)])),
  navigation: Object.freeze(["menu", "breadcrumb"]),
  regionIds: Object.freeze(Object.keys(require("./widget-registry").REGION_PRESENTATIONS))
});

class ContentConfigError extends Error {
  constructor(issues) {
    super(`Stellar v2 内容配置校验失败：\n${issues.map(issue => `- ${typeof issue === "string" ? issue : formatIssue(issue)}`).join("\n")}`);
    this.name = "ContentConfigError";
    this.issues = issues;
  }
}

function contentError(error) {
  if (!(error instanceof ConfigSchemaError)) throw error;
  throw new ContentConfigError(error.issues);
}

function parseCollectionConfig(config, source = "<collection>", options = {}) {
  try {
    const diagnostics = [];
    const parsed = parseConfigSchema(COLLECTION_CONFIG_SCHEMA, config, {
      ...options, source, onIssues: current => diagnostics.push(...current)
    });
    const name = typeof parsed.name === "string" && parsed.name.trim() ? parsed.name : null;
    const id = options.collectionId || source.replace(/\\/g, "/").split("/").at(-1).replace(/\.ya?ml$/i, "");
    if (!name) diagnostics.push({ code: "invalid_value", source, path: "name", actualType: typeof parsed.name,
      expected: "non-empty display name", severity: "warning", action: "使用 Collection ID" });
    options.onIssues?.(diagnostics);
    return name ? parsed : deepFreeze({ ...parsed, name: id });
  } catch (error) {
    return contentError(error);
  }
}

function parsePageConfig(config, source = "<page>", options = {}) {
  try {
    return parseConfigSchema(FRONT_MATTER_CONFIG_SCHEMA, config, {
      ...options,
      source,
      isFatalIssue(currentIssue) {
        return /^collection\.(?:profile|id)$/.test(currentIssue.path) || options.isFatalIssue?.(currentIssue);
      }
    });
  } catch (error) {
    return contentError(error);
  }
}

function validateObjectInput(config, source) {
  if (isPlainObject(config)) return config;
  const issue = Object.freeze({
    code: "invalid_type",
    source,
    path: "root",
    actualType: Array.isArray(config) ? "array" : config === null ? "null" : typeof config,
    expected: "object",
    migration: "configuration/v2"
  });
  throw new ContentConfigError([issue]);
}

function validateThemeConfig(config, source = "<theme>") {
  return validateObjectInput(config, source);
}

function hasOwn(value, key) {
  return value != null && Object.prototype.hasOwnProperty.call(value, key);
}

function unsupportedProfileField(source, path, profile) {
  return Object.freeze({
    code: "invalid_value",
    source,
    path,
    actualType: "declared field",
    expected: `field supported by the ${profile} profile`,
    migration: "content-schema/profile-capabilities"
  });
}

function validateCollectionProfileConfig(config, source, profile, capabilities, options = {}) {
  const policy = capabilities?.collection;
  if (!policy) throw new ContentConfigError([unsupportedProfileField(source, "root", profile)]);
  const issues = [];
  if (hasOwn(config, "hero") && policy.hero !== true) {
    issues.push(unsupportedProfileField(source, "hero", profile));
  }
  if (hasOwn(config?.route, "start") && policy.routeStart !== true) {
    issues.push(unsupportedProfileField(source, "route.start", profile));
  }
  if (hasOwn(config?.navigation, "tree") && policy.navigationTree !== true) {
    issues.push(unsupportedProfileField(source, "navigation.tree", profile));
  }
  const listingFields = new Set(policy.listing || []);
  for (const field of Object.keys(config?.listing || {})) {
    if (!listingFields.has(field)) {
      issues.push(unsupportedProfileField(source, `listing.${field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)}`, profile));
    }
  }
  return omitUnsupported(config, issues, options);
}

function omitUnsupported(config, issues, options) {
  if (issues.length === 0) return config;
  const result = structuredClone(config);
  for (const issue of issues) {
    const parts = issue.path.split(".").map(key => key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()));
    const key = parts.pop();
    const parent = parts.reduce((value, part) => value?.[part], result);
    if (parent) delete parent[key];
  }
  options.onIssues?.(issues.map(issue => ({ ...issue, severity: "warning", action: "忽略不适用的表现参数" })));
  return deepFreeze(result);
}

function validatePageProfileConfig(config, source, profile, capabilities, options = {}) {
  const issues = hasOwn(config?.listing, "priority") && capabilities?.page?.listingPriority !== true
    ? [unsupportedProfileField(source, "listing.priority", profile)] : [];
  return omitUnsupported(config, issues, options);
}

function getCollectionId(page, profile) {
  if (page?.collection?.profile !== profile) return null;
  return page.collection.id;
}

function isListed(content) {
  return content?.visibility?.listed !== false;
}

function isSearchable(content) {
  return content?.visibility?.searchable !== false;
}

module.exports = {
  CONTENT_MODEL_FIELDS,
  ContentConfigError,
  getCollectionId,
  isPlainObject,
  isListed,
  isSearchable,
  parseCollectionConfig,
  parsePageConfig,
  validateCollectionProfileConfig,
  validatePageProfileConfig,
  validateThemeConfig
};
