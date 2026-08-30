"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const { stringifyDefaultConfig } = require("../scripts/lib/default-config");
const { CONFIG_SCHEMA } = require("../scripts/schema/config-schema");

const ROOT = path.resolve(__dirname, "..");
const CONFIG_SOURCE = fs.readFileSync(path.join(ROOT, "_config.yml"), "utf8");
const CONFIG = yaml.load(CONFIG_SOURCE);

function closedLeafPaths(definition, parents = [], result = []) {
  const properties = definition.properties || {};
  if (Object.keys(properties).length === 0) {
    result.push(parents.join("."));
    return result;
  }
  for (const [key, child] of Object.entries(properties)) {
    closedLeafPaths(child, [...parents, key], result);
  }
  return result;
}

function hasConfigPath(config, configPath) {
  let current = config;
  for (const key of configPath.split(".")) {
    if (current == null || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, key)) return false;
    current = current[key];
  }
  return true;
}

function collectYamlLeaves(definition, parents = [], result = []) {
  for (const [key, child] of Object.entries(definition.properties || {})) {
    const childPath = [...parents, key];
    if (Object.keys(child.properties || {}).length === 0) {
      result.push({ path: childPath.join("."), node: child });
    } else {
      collectYamlLeaves(child, childPath, result);
    }
  }
  return result;
}

test("主题默认配置由 CONFIG_SCHEMA 稳定生成并公开全部封闭字段", () => {
  assert.equal(CONFIG_SOURCE, stringifyDefaultConfig());
  assert.deepEqual(Object.keys(CONFIG), ["site", "layout", "content", "appearance", "seo", "resources", "extensions", "inject"]);

  const missing = closedLeafPaths(CONFIG_SCHEMA)
    .filter(configPath => !hasConfigPath(CONFIG, configPath))
    .sort();
  assert.deepEqual(missing, []);
});

test("Brand 空值保持活动字段并明确不继承 Hexo 配置", () => {
  assert.equal(CONFIG.site.brand.image.src, null);
  assert.equal(CONFIG.site.brand.name, null);
  assert.equal(CONFIG.site.brand.tagline, null);
  assert.match(CONFIG_SOURCE, /Brand 图片来源；null 隐藏图片且不会继承 Hexo avatar。/);
  assert.match(CONFIG_SOURCE, /Brand 纯文本名称；null 隐藏名称且不会继承 Hexo title。/);
  assert.match(CONFIG_SOURCE, /Brand 标语；null 隐藏标语且不会继承 Hexo subtitle。/);
});

test("侧栏与页面默认图片使用 YAML 留空写法且运行时保持 null", () => {
  assert.equal(CONFIG.appearance.backgrounds.leftbar.image, null);
  assert.equal(CONFIG.appearance.backgrounds.page.image, null);
  assert.match(CONFIG_SOURCE, /侧栏背景图片；留空不显示背景图。[\s\S]*?\n {6}image:\n {6}gradient:/);
  assert.match(CONFIG_SOURCE, /页面背景图片；留空不显示背景图。[\s\S]*?\n {6}image:\n {6}backdrop:/);
  assert.doesNotMatch(CONFIG_SOURCE, /\n {6}image: null\n {6}gradient:/);
  assert.doesNotMatch(CONFIG_SOURCE, /\n {6}image: null\n {6}backdrop:/);
});

test("所有活动叶子都有语义描述且约束提示来自 Schema", () => {
  const leaves = collectYamlLeaves(CONFIG_SCHEMA);
  assert.ok(leaves.length > 0);
  for (const { path: configPath, node } of leaves) {
    assert.ok(node.description, `${configPath} 缺少语义描述`);
    assert.ok(node.yaml, `${configPath} 缺少 YAML 展示元数据`);
    assert.doesNotMatch(node.description, new RegExp(`^${configPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} 配置。$`));
  }
  assert.doesNotMatch(CONFIG_SOURCE, /^\s*# [a-z0-9_.<>\[\]-]+ 配置。$/mu);
  assert.match(CONFIG_SOURCE, /文章默认排版风格。 \[字符串；可选值：tech \/ story\]/);
  assert.match(CONFIG_SOURCE, /文章列表封面的宽高比。 \[数字；必须大于 0\]/);
  assert.match(CONFIG_SOURCE, /侧栏背景不透明度。 \[数字；范围：0–1\]/);
  assert.match(CONFIG_SOURCE, /主导航菜单项；type: search 与链接共用 title、icon、accent 视觉字段并提供共享搜索入口，空数组不显示主菜单。 \[数组；元素：对象\]/);

  const incompleteSchema = structuredClone(CONFIG_SCHEMA);
  delete incompleteSchema.properties.site.properties.brand.properties.image.properties.src.description;
  assert.throws(
    () => stringifyDefaultConfig(incompleteSchema),
    /Theme Schema 活动叶子缺少语义描述：site\.brand\.image\.src/
  );
});

test("YAML 示例必须显式选择且不复用错误上下文", () => {
  assert.match(CONFIG_SOURCE, /# Example:/);
  assert.match(CONFIG_SOURCE, /# {3}- \{id: post, title: 博客/);
  assert.match(CONFIG_SOURCE, /# {3}- \{source_prefix: wiki\/stellar\//);
  assert.doesNotMatch(CONFIG_SOURCE, /wiki_index[\s\S]{0,500}# Example:[\s\S]{0,80}\/blog\//);
  assert.match(CONFIG_SOURCE, /items: \[\{key: 博客框架,[^\n]+\{key: 主题版本,/);
  assert.match(CONFIG_SOURCE, /tag_icons: \{\}/);
});
