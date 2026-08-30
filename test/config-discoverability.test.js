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

function configKeyLines(source) {
  return source.split(/\r?\n/).flatMap((line, index) => {
    if (line.trimStart().startsWith("#")) return [];
    if (!/^(\s*)(?:-\s+)?(?:[\w-]+|[^\s:#][^:]*):(?:\s|$)/.test(line)) return [];
    return [{ index, line }];
  });
}

function precedingNonEmptyLine(lines, index) {
  let previous = index - 1;
  while (previous >= 0 && lines[previous].trim() === "") previous -= 1;
  return previous >= 0 ? lines[previous] : "";
}

function nonEmptyFlowCollectionLines(source) {
  return source.split(/\r?\n/).flatMap((line, index) => {
    const code = line.replace(/\s+#.*$/, "");
    const flowValue = /:\s*(?:\[(?!\])|\{(?!\}))/.test(code);
    const flowItem = /^\s*-\s*(?:\[(?!\])|\{(?!\}))/.test(code);
    return flowValue || flowItem ? [`${index + 1}: ${line.trim()}`] : [];
  });
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
  assert.match(CONFIG_SOURCE, /公开配置树、默认值、字段顺序和用户示例的唯一事实来源/);
  assert.match(CONFIG_SOURCE, /# 站点[\s\S]*# 布局[\s\S]*# 内容[\s\S]*# 外观/);
});

test("手写 _config.yml 的每个配置键都有独立前置注释", () => {
  const lines = CONFIG_SOURCE.split(/\r?\n/);
  const missing = configKeyLines(CONFIG_SOURCE).flatMap(({ index, line }) => {
    const previous = precedingNonEmptyLine(lines, index);
    return previous.trimStart().startsWith("#") ? [] : [`${index + 1}: ${line.trim()}`];
  });
  assert.deepEqual(missing, []);
});

test("手写 _config.yml 仅允许空集合使用单行 flow style", () => {
  assert.deepEqual(nonEmptyFlowCollectionLines(CONFIG_SOURCE), []);
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
  assert.match(CONFIG_SOURCE, /品牌图片地址；null 表示隐藏图片/);
  assert.match(CONFIG_SOURCE, /品牌名称；null 表示隐藏名称且不继承 Hexo title/);
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
