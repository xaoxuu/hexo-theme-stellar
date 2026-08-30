"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const yaml = require("js-yaml");

const { CONFIG_RULES } = require("../scripts/schema/config-rules");
const {
  CONFIG_DEFAULTS,
  CONFIG_SCHEMA,
  DEFAULT_CONFIG_PATH,
  loadDefaultConfig,
  patternMatches
} = require("../scripts/schema/config-schema");

const CONFIG_SOURCE = fs.readFileSync(DEFAULT_CONFIG_PATH, "utf8");
const CONFIG = yaml.load(CONFIG_SOURCE);
const ROOT_KEYS = [
  "brand", "menu", "settings", "footer",
  "regions", "profiles",
  "article", "notebook",
  "appearance",
  "canonical", "open_graph", "structured_data",
  "preconnect", "fallbacks", "error_page",
  "search", "comments", "tags", "features", "services",
  "inject"
];

function schemaPaths(node, parents = [], result = []) {
  if (parents.length > 0) result.push(parents.join("."));
  for (const [key, child] of Object.entries(node.properties || {})) {
    schemaPaths(child, [...parents, key], result);
  }
  return result;
}

test("手写 _config.yml 是公开字段树、默认值与顺序的唯一来源", () => {
  assert.deepEqual(Object.keys(CONFIG), ROOT_KEYS);
  assert.deepEqual(CONFIG, CONFIG_DEFAULTS);
  assert.deepEqual(loadDefaultConfig(CONFIG_SOURCE), CONFIG);
  assert.equal(Object.isFrozen(CONFIG_SCHEMA), true);
  assert.deepEqual(
    ["site", "layout", "content", "seo", "resources", "extensions"]
      .filter(key => Object.hasOwn(CONFIG, key)),
    []
  );
  assert.match(CONFIG_SOURCE, /single source of truth for the public configuration tree/);
  assert.match(CONFIG_SOURCE, /# Site[\s\S]*# Layout[\s\S]*# Content[\s\S]*# Appearance/);
});

test("轻量规则表中的每个路径都对应手写默认配置中的现存节点", () => {
  const paths = schemaPaths(CONFIG_SCHEMA);
  const missing = CONFIG_RULES
    .map(([pattern]) => pattern)
    .filter(pattern => !paths.some(configPath => patternMatches(pattern, configPath)));
  assert.deepEqual(missing, []);
});

test("Brand 与背景空值保持显式 null 语义", () => {
  assert.equal(CONFIG.brand.image.src, null);
  assert.equal(CONFIG.brand.name, null);
  assert.equal(CONFIG.brand.tagline, null);
  assert.equal(CONFIG.appearance.backgrounds.leftbar.image, null);
  assert.equal(CONFIG.appearance.backgrounds.page.image, null);
  assert.match(CONFIG_SOURCE, /Set to null to hide the image/);
  assert.match(CONFIG_SOURCE, /null does not inherit Hexo title\/subtitle/);
});

test("主干保持扁平，低频 Appearance 与 Inject 保留业务分组", () => {
  assert.equal(Array.isArray(CONFIG.regions.topbar), true);
  assert.equal(Array.isArray(CONFIG.regions.rightbar), true);
  assert.equal(CONFIG.profiles.blog_index.active_menu, "post");
  assert.equal(Array.isArray(CONFIG.profiles.wiki.topbar), true);
  assert.equal(CONFIG.profiles.wiki.leftbar.footer_actions, false);
  assert.equal(Object.hasOwn(CONFIG.comments, "providers"), false);
  assert.equal(Object.hasOwn(CONFIG.search, "providers"), false);
  assert.equal(Object.hasOwn(CONFIG.features.math, "providers"), false);
  assert.equal(Object.hasOwn(CONFIG.services.site_info, "providers"), false);
  assert.equal(CONFIG.appearance.preset, "card");
  assert.equal(CONFIG.inject.head_end, "");
});
