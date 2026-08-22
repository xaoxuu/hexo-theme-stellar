"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { CONFIG_SCHEMA } = require("../scripts/schema/config-schema");
const {
  CONFIG_DOMAIN_CATALOG,
  CONFIG_MIGRATION_SLICES
} = require("../scripts/schema/config-inventory");

const ROOT = path.resolve(__dirname, "..");
const THEME_CONFIG = path.join(ROOT, "_config.yml");

function topLevelYamlKeys(source) {
  const keys = [];
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):(?:\s|$)/);
    if (match) keys.push(match[1]);
  }
  return keys;
}

function isSnakePath(pathValue) {
  return pathValue.split(".").every(segment => (
    /^<[^>]+>$/.test(segment)
    || /^[a-z0-9_]+(?:\[\])?$/.test(segment)
  ));
}

test("配置目录完整覆盖主题默认顶层域与站点专属入口", () => {
  const actual = topLevelYamlKeys(fs.readFileSync(THEME_CONFIG, "utf8"));
  const themeDomains = CONFIG_DOMAIN_CATALOG
    .filter(item => item.sourceKind === "theme")
    .map(item => item.id);

  assert.equal(new Set(actual).size, actual.length, "主题默认配置不应重复定义顶层域");
  assert.deepEqual([...themeDomains].sort(), [...actual].sort());

  const inject = CONFIG_DOMAIN_CATALOG.find(item => item.id === "inject");
  assert.equal(inject.sourceKind, "site_theme_override");
  assert.deepEqual(inject.fields, ["inject.head[]", "inject.script[]"]);

  const siteOnly = CONFIG_DOMAIN_CATALOG
    .filter(item => item.sourceKind === "site_theme_override")
    .map(item => item.id);
  assert.deepEqual(siteOnly, ["inject", "cache", "language_switcher"]);
  for (const legacyId of ["cache", "language_switcher"]) {
    const item = CONFIG_DOMAIN_CATALOG.find(candidate => candidate.id === legacyId);
    assert.equal(item.status, "excluded");
    assert.equal(item.finalPath, null);
    assert.equal(item.migrationSlice, "root-seal");
  }
});

test("每个配置域都有唯一职责、边界、目标和迁移切片", () => {
  const ids = CONFIG_DOMAIN_CATALOG.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length);

  const sourceKinds = new Set(["theme", "site_theme_override", "collection", "front_matter", "hexo", "theme_data", "derived"]);
  const owners = new Set(["stellar", "package", "hexo", "internal"]);
  const boundaries = new Set(["sealed", "record", "external", "derived"]);
  const statuses = new Set(["delivered", "planned", "partial", "excluded", "external", "derived"]);
  const sliceIds = new Set(CONFIG_MIGRATION_SLICES.map(item => item.id));

  for (const item of CONFIG_DOMAIN_CATALOG) {
    assert.ok(sourceKinds.has(item.sourceKind), `${item.id} sourceKind 非法`);
    assert.ok(owners.has(item.owner), `${item.id} owner 非法`);
    assert.ok(boundaries.has(item.boundary), `${item.id} boundary 非法`);
    assert.ok(statuses.has(item.status), `${item.id} status 非法`);
    assert.ok(Array.isArray(item.sources) && item.sources.length > 0, `${item.id} 缺少来源`);
    assert.ok(Array.isArray(item.consumers) && item.consumers.length > 0, `${item.id} 缺少消费方`);
    assert.ok(Array.isArray(item.fields) && item.fields.length > 0, `${item.id} 缺少字段树`);
    assert.equal(new Set(item.fields).size, item.fields.length, `${item.id} 包含重复字段`);
    assert.ok(typeof item.runtimeTarget === "string" && item.runtimeTarget.length > 0, `${item.id} 缺少运行时目标`);
    assert.ok(sliceIds.has(item.migrationSlice), `${item.id} 指向未知迁移切片`);
    if (["delivered", "planned", "partial"].includes(item.status)) {
      assert.ok(typeof item.finalPath === "string" && item.finalPath.length > 0, `${item.id} 缺少最终路径`);
    }
  }
});

test("Stellar 自有旧字段显式映射到 snake_case，参数袋边界明确", () => {
  const mappings = CONFIG_DOMAIN_CATALOG.flatMap(item => item.legacyMappings || []);
  assert.ok(mappings.length > 0);
  for (const mapping of mappings) {
    assert.notEqual(mapping.from, mapping.to);
    assert.equal(isSnakePath(mapping.to), true, `${mapping.to} 不是 snake_case 路径`);
  }

  const parameterBags = CONFIG_DOMAIN_CATALOG.flatMap(item => item.parameterBags || []);
  assert.ok(parameterBags.includes("comments.giscus"));
  assert.ok(parameterBags.includes("search.algolia_search"));
  assert.ok(parameterBags.includes("hero.background.effect.options"));

  const footer = CONFIG_DOMAIN_CATALOG.find(item => item.id === "footer");
  const dataCache = CONFIG_DOMAIN_CATALOG.find(item => item.id === "data_cache");
  assert.equal(footer.boundary, "sealed");
  assert.deepEqual(footer.dynamicRecords, ["footer.social.<id>"]);
  assert.equal(dataCache.boundary, "sealed");
  assert.deepEqual(dataCache.dynamicRecords, ["data_cache.ttl.<service>"]);
  assert.equal(parameterBags.includes("data_cache.ttl"), false);

  const themeData = CONFIG_DOMAIN_CATALOG.find(item => item.id === "theme_data");
  assert.ok(themeData.fields.includes("links.<group>[].*"));
});

test("Hexo 自有配置与 Front Matter 保持独立外部边界", () => {
  const hexo = CONFIG_DOMAIN_CATALOG.find(item => item.id === "hexo");
  const hexoFrontMatter = CONFIG_DOMAIN_CATALOG.find(item => item.id === "hexo_front_matter");

  assert.deepEqual(hexo.sources, ["_config.yml", "Hexo runtime"]);
  assert.equal(hexo.runtimeTarget, "hexo.config");
  assert.equal(hexo.fields.some(field => field.startsWith("front_matter.")), false);

  assert.deepEqual(hexoFrontMatter.sources, ["source/_posts/**/*.md", "source/**/*.md"]);
  assert.equal(hexoFrontMatter.owner, "hexo");
  assert.equal(hexoFrontMatter.boundary, "external");
  assert.equal(hexoFrontMatter.runtimeTarget, "Hexo page/post document fields");
});

test("五个迁移切片按序且每个配置域恰好出现一次", () => {
  assert.deepEqual(CONFIG_MIGRATION_SLICES.map(item => item.order), [1, 2, 3, 4, 5]);
  assert.deepEqual(CONFIG_MIGRATION_SLICES.map(item => item.id), [
    "head-seo",
    "shell-content-defaults",
    "collection-front-matter",
    "extensions-services",
    "root-seal"
  ]);

  const scheduled = CONFIG_MIGRATION_SLICES.flatMap(item => item.domains);
  const catalogIds = CONFIG_DOMAIN_CATALOG.map(item => item.id);
  assert.equal(new Set(scheduled).size, scheduled.length, "迁移队列包含重复配置域");
  assert.deepEqual([...scheduled].sort(), [...catalogIds].sort());
  for (const slice of CONFIG_MIGRATION_SLICES) {
    for (const domainId of slice.domains) {
      const item = CONFIG_DOMAIN_CATALOG.find(candidate => candidate.id === domainId);
      assert.equal(item.migrationSlice, slice.id, `${domainId} 的反向迁移切片与队列不一致`);
    }
  }
});

test("运行时 Schema 仍只交付 canonical，规划目录不会提前封闭根配置", () => {
  assert.equal(CONFIG_SCHEMA.sealed, false);
  assert.deepEqual(Object.keys(CONFIG_SCHEMA.properties), ["canonical"]);
  assert.deepEqual(
    CONFIG_DOMAIN_CATALOG.filter(item => item.status === "delivered").map(item => item.id),
    ["canonical"]
  );
});

test("配置目录对象深度冻结", () => {
  assert.equal(Object.isFrozen(CONFIG_DOMAIN_CATALOG), true);
  assert.equal(Object.isFrozen(CONFIG_DOMAIN_CATALOG[0]), true);
  assert.equal(Object.isFrozen(CONFIG_DOMAIN_CATALOG[0].fields), true);
  assert.equal(Object.isFrozen(CONFIG_MIGRATION_SLICES), true);
  assert.equal(Object.isFrozen(CONFIG_MIGRATION_SLICES[0].domains), true);
});
