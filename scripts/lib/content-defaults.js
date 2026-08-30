/* global hexo */
"use strict";

const {
  ConfigSchemaError,
  isPlainObject,
  valueType
} = require("./config-schema");

function requireContentConfig(stellarConfig, source = "_config.stellar.yml") {
  if (isPlainObject(stellarConfig?.article) && isPlainObject(stellarConfig?.notebook)) {
    return { article: stellarConfig.article, notebook: stellarConfig.notebook };
  }
  throw new ConfigSchemaError([Object.freeze({
    code: "invalid_type",
    source,
    path: "stellarConfig.article",
    actualType: valueType(stellarConfig?.article),
    expected: "normalized content defaults object",
    migration: null
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
