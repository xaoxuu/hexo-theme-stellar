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

test("配置目录完整覆盖主题默认顶层域与站点专属入口", () => {
  const actual = topLevelYamlKeys(fs.readFileSync(THEME_CONFIG, "utf8"));
  const themeDomains = CONFIG_DOMAIN_CATALOG
    .filter(item => item.sourceKind === "theme")
    .map(item => item.id);
  const registeredRoots = new Set([...themeDomains, ...Object.keys(CONFIG_SCHEMA.properties)]);

  assert.equal(new Set(actual).size, actual.length, "主题默认配置不应重复定义顶层域");
  for (const root of actual) assert.ok(registeredRoots.has(root), `${root} 未登记到迁移目录或运行时 Schema`);
  for (const legacyRoot of ["preconnect", "canonical", "open_graph", "structured_data"]) {
    assert.equal(actual.includes(legacyRoot), false, `${legacyRoot} 不应继续作为主题默认根域`);
  }

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
    assert.equal(item.targetPath, null);
    assert.equal(item.targetStatus, "excluded");
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
  const targetStatuses = new Set(["planned", "delivered", "excluded"]);
  const sliceIds = new Set(CONFIG_MIGRATION_SLICES.map(item => item.id));

  for (const item of CONFIG_DOMAIN_CATALOG) {
    assert.ok(sourceKinds.has(item.sourceKind), `${item.id} sourceKind 非法`);
    assert.ok(owners.has(item.owner), `${item.id} owner 非法`);
    assert.ok(boundaries.has(item.boundary), `${item.id} boundary 非法`);
    assert.ok(statuses.has(item.status), `${item.id} status 非法`);
    assert.ok(targetStatuses.has(item.targetStatus), `${item.id} targetStatus 非法`);
    assert.ok(Array.isArray(item.sources) && item.sources.length > 0, `${item.id} 缺少来源`);
    assert.ok(Array.isArray(item.consumers) && item.consumers.length > 0, `${item.id} 缺少消费方`);
    assert.ok(Array.isArray(item.fields) && item.fields.length > 0, `${item.id} 缺少字段树`);
    assert.equal(new Set(item.fields).size, item.fields.length, `${item.id} 包含重复字段`);
    assert.ok(typeof item.runtimeTarget === "string" && item.runtimeTarget.length > 0, `${item.id} 缺少运行时目标`);
    assert.ok(sliceIds.has(item.migrationSlice), `${item.id} 指向未知迁移切片`);
    assert.ok(Array.isArray(item.migrations) && item.migrations.length > 0, `${item.id} 缺少迁移矩阵`);
    if (item.targetStatus !== "excluded") {
      assert.ok(typeof item.targetPath === "string" && item.targetPath.length > 0, `${item.id} 缺少目标路径`);
    } else {
      assert.equal(item.targetPath, null);
    }
  }
});

test("当前字段族都有唯一迁移结果，参数袋边界明确", () => {
  const actions = new Set(["rename", "move", "merge", "internalize", "remove"]);
  for (const item of CONFIG_DOMAIN_CATALOG) {
    const sources = item.migrations.map(entry => entry.from);
    assert.deepEqual(sources, item.fields, `${item.id} 迁移矩阵必须按目录顺序逐字段覆盖`);
    assert.equal(new Set(sources).size, sources.length, `${item.id} 迁移矩阵存在重复来源`);
    for (const entry of item.migrations) {
      assert.ok(actions.has(entry.action), `${entry.from} 使用了未知迁移动作`);
      assert.ok(typeof entry.reason === "string" && entry.reason.length > 0, `${entry.from} 缺少迁移理由`);
      if (["rename", "move", "merge"].includes(entry.action)) {
        assert.ok(typeof entry.to === "string" && entry.to.length > 0, `${entry.from} 缺少迁移目标`);
      } else {
        assert.equal(entry.to, undefined, `${entry.from} 不应声明公开迁移目标`);
      }
    }
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

test("运行时 Schema 交付 site Shell、Layout Profile、内容默认与 head/SEO 且不会提前封闭根配置", () => {
  assert.equal(CONFIG_SCHEMA.sealed, false);
  assert.deepEqual(Object.keys(CONFIG_SCHEMA.properties), ["site", "layout", "content", "seo", "resources", "inject"]);
  assert.deepEqual(
    CONFIG_DOMAIN_CATALOG.filter(item => item.status === "delivered").map(item => item.id),
    ["preconnect", "canonical", "open_graph", "structured_data", "brand", "menubar", "site_tree", "notebook", "article", "footer", "inject", "collection", "front_matter"]
  );
  assert.equal(CONFIG_DOMAIN_CATALOG.find(item => item.id === "canonical").targetStatus, "delivered");
  assert.equal(CONFIG_DOMAIN_CATALOG.find(item => item.id === "canonical").targetPath, "seo.canonical");
});

test("配置目录对象深度冻结", () => {
  assert.equal(Object.isFrozen(CONFIG_DOMAIN_CATALOG), true);
  assert.equal(Object.isFrozen(CONFIG_DOMAIN_CATALOG[0]), true);
  assert.equal(Object.isFrozen(CONFIG_DOMAIN_CATALOG[0].fields), true);
  assert.equal(Object.isFrozen(CONFIG_DOMAIN_CATALOG[0].migrations), true);
  assert.equal(Object.isFrozen(CONFIG_MIGRATION_SLICES), true);
  assert.equal(Object.isFrozen(CONFIG_MIGRATION_SLICES[0].domains), true);
});
