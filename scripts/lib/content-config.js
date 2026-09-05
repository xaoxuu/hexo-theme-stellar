/* global hexo */
"use strict";

const {
  ConfigSchemaError,
  formatIssue,
  isPlainObject,
  parseConfigSchema
} = require("./config-schema");
const {
  COLLECTION_CONFIG_SCHEMA,
  FRONT_MATTER_CONFIG_SCHEMA
} = require("../schema/content-config-schema");

const CONTENT_MODEL_FIELDS = Object.freeze({
  article: Object.freeze(["style", "paragraphIndent", "author", "aiLabel"]),
  banner: Object.freeze(["enabled", "image", "avatar", "headline", "tagline"]),
  brand: Object.freeze(["image", "name", "tagline", "href"]),
  brandImage: Object.freeze(["src", "variant"]),
  comments: Object.freeze(["enabled", "title", "id", "provider", "options"]),
  footer: Object.freeze(["references", "license", "share", "showTags"]),
  navigation: Object.freeze(["menu", "breadcrumb"]),
  regionIds: Object.freeze(["topbar", "leftbar", "rightbar"]),
  region: Object.freeze(["enabled", "brand", "menu", "footer", "widgets"]),
  source: Object.freeze(["repository", "branch"]),
  visibility: Object.freeze(["listed", "searchable"])
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
    return parseConfigSchema(COLLECTION_CONFIG_SCHEMA, config, {
      ...options,
      source,
      isFatalIssue(currentIssue) {
        return currentIssue.path === "name" || options.isFatalIssue?.(currentIssue);
      }
    });
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

function validateCollectionProfileConfig(config, source, profile, capabilities) {
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
  if (issues.length > 0) throw new ContentConfigError(issues);
  return config;
}

function validatePageProfileConfig(config, source, profile, capabilities) {
  if (hasOwn(config?.listing, "priority") && capabilities?.page?.listingPriority !== true) {
    throw new ContentConfigError([unsupportedProfileField(source, "listing.priority", profile)]);
  }
  return config;
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
