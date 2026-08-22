"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

test("head 与 SEO 消费链只读取冻结配置，不再读取旧主题路径或 Hexo inject", () => {
  const head = read("layout/_partial/head.ejs");
  const scripts = read("layout/_partial/scripts.ejs");
  const defines = read("layout/_partial/scripts/defines.ejs");
  const jsonLd = read("scripts/helpers/json_ld.js");
  const models = read("scripts/lib/models/index.js");

  assert.match(head, /stellar_config\('seo'\)/);
  assert.match(head, /stellar_config\('resources'\)/);
  assert.match(head, /stellar_inject\('head'/);
  assert.doesNotMatch(head, /theme\.open_graph|theme\.preconnect|config\.inject|theme\.inject/);

  assert.match(scripts, /stellar_inject\('script'/);
  assert.doesNotMatch(scripts, /config\.inject|theme\.inject/);

  assert.match(defines, /stellar_config\('seo\.canonical'\)/);
  assert.doesNotMatch(defines, /originalHost|stellar_config\('canonical'\)/);

  assert.match(jsonLd, /stellar_config\("seo\.structuredData"\)/);
  assert.doesNotMatch(jsonLd, /theme\.structured_data/);

  assert.match(models, /input\.stellarConfig\.seo/);
  assert.doesNotMatch(models, /themeConfig\.open_graph|themeConfig\.structured_data|stellarConfig\.canonical/);
});

test("浏览器 canonical 上下文使用冻结 camelCase 字段", () => {
  const main = read("source/js/main.js");
  assert.match(main, /canonical\.host/);
  assert.match(main, /canonical\.allowedHosts/);
  assert.doesNotMatch(main, /canonical\.originalHost|canonical\.officialHosts/);
});
