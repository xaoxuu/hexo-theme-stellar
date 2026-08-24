/* global hexo */
"use strict";

const {
  ConfigSchemaError,
  isPlainObject,
  valueType
} = require("./config-schema");

function requireContentConfig(stellarConfig, source = "_config.stellar.yml") {
  const content = stellarConfig?.content;
  if (isPlainObject(content?.article) && isPlainObject(content?.notebook)) return content;
  throw new ConfigSchemaError([Object.freeze({
    code: "invalid_type",
    source,
    path: "stellarConfig.content",
    actualType: valueType(content),
    expected: "normalized content defaults object",
    migration: "configuration/content"
  })]);
}

function articlePresentationDefaults(content) {
  return {
    style: content.article.style,
    paragraphIndent: content.article.paragraphIndent
  };
}

function articleFooterDefaults(content) {
  return {
    references: [],
    license: content.article.footer.license,
    share: content.article.footer.share,
    showTags: content.article.footer.showTags
  };
}

module.exports = {
  articleFooterDefaults,
  articlePresentationDefaults,
  requireContentConfig
};
