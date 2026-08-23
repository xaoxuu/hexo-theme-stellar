/* global hexo */
"use strict";

const yaml = require("js-yaml");

class FrontMatterParseError extends Error {
  constructor(kind, source, message) {
    super(`${source}: ${message}`);
    this.name = "FrontMatterParseError";
    this.kind = kind;
    this.source = source;
  }
}

function parseFrontMatterYaml(content, source) {
  if (!/^\uFEFF?---\r?\n/.test(content)) return null;
  const match = content.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new FrontMatterParseError("unterminated", source, "Front Matter 缺少结束分隔符");
  try {
    return yaml.load(match[1], { filename: source }) || {};
  } catch (error) {
    throw new FrontMatterParseError("invalid_yaml", source, `Front Matter YAML 无效（${error.message}）`);
  }
}

module.exports = {
  FrontMatterParseError,
  parseFrontMatterYaml
};
