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
  article: Object.freeze(["type", "indent", "author", "aiLabel"]),
  banner: Object.freeze(["enabled", "image", "avatar", "headline", "tagline"]),
  brand: Object.freeze(["image", "name", "wordmark", "tagline", "href"]),
  brandImage: Object.freeze(["src", "variant", "href"]),
  card: Object.freeze(["cover", "tagline"]),
  comments: Object.freeze(["enabled", "title", "id", "provider", "options"]),
  footer: Object.freeze(["references", "license", "share"]),
  navigation: Object.freeze(["menu", "breadcrumb"]),
  sidebar: Object.freeze(["left", "right"]),
  sidebarLeft: Object.freeze(["widgets", "search", "menu", "brand", "wikiHome"]),
  sidebarRight: Object.freeze(["widgets"]),
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

function parseCollectionConfig(config, source = "<collection>") {
  try {
    return parseConfigSchema(COLLECTION_CONFIG_SCHEMA, config, { source });
  } catch (error) {
    return contentError(error);
  }
}

function parsePageConfig(config, source = "<page>") {
  try {
    return parseConfigSchema(FRONT_MATTER_CONFIG_SCHEMA, config, { source });
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
  validateThemeConfig
};
