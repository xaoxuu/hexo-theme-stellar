"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { CONFIG_SCHEMA } = require("../scripts/schema/config-schema");
const {
  COLLECTION_CONFIG_SCHEMA,
  FRONT_MATTER_CONFIG_SCHEMA
} = require("../scripts/schema/content-config-schema");
const { flattenConfigFields } = require("../scripts/lib/config-reference-metadata");
const { CONFIG_DOMAIN_CATALOG } = require("../scripts/schema/config-inventory");
const {
  CONFIG_DOMAIN_TARGETS,
  CONFIG_INTERNALIZED_RESOURCES,
  CONFIG_TARGET_FIELDS,
  CONFIG_TARGET_ROOTS,
  FEATURE_ID_MIGRATIONS,
  PROFILE_ID_MIGRATIONS,
  PROFILE_IDS,
  SERVICE_ID_MIGRATIONS,
  resolveConfigMigration
} = require("../scripts/schema/config-target");

const ROOT = path.resolve(__dirname, "..");
const THEME_CONFIG = path.join(ROOT, "_config.yml");
const TARGET_ROOT_IDS = ["site", "seo", "layout", "content", "appearance", "resources", "extensions", "inject"];

function activeYamlLeaves(source) {
  const lines = source.split(/\r?\n/).map((raw, index) => ({ raw, index }))
    .filter(({ raw }) => raw.trim() && !raw.trimStart().startsWith("#"));
  const stack = [];
  const leaves = [];
  let blockIndent = null;

  for (let index = 0; index < lines.length; index += 1) {
    const { raw } = lines[index];
    const indent = raw.match(/^\s*/)[0].length;
    if (blockIndent !== null && indent > blockIndent) continue;
    blockIndent = null;
    const trimmed = raw.trim();
    if (trimmed.startsWith("- ")) continue;
    const match = trimmed.match(/^(?:'([^']*)'|"([^"]*)"|([^:]+)):\s*(.*)$/);
    if (!match) continue;

    while (stack.length > 0 && stack.at(-1).indent >= indent) stack.pop();
    const key = (match[1] ?? match[2] ?? match[3]).trim();
    const value = match[4].replace(/\s+#.*$/, "").trim();
    const currentPath = [...stack.map(entry => entry.key), key].join(".");
    const next = lines[index + 1];
    const nextIndent = next ? next.raw.match(/^\s*/)[0].length : -1;
    const hasChildren = nextIndent > indent;

    if (value.startsWith("[")) {
      leaves.push(`${currentPath}[]`);
    } else if (!hasChildren || value === "|" || value === ">") {
      leaves.push(currentPath);
    } else if (next.raw.trim().startsWith("- ")) {
      leaves.push(`${currentPath}[]`);
    }
    if (value === "|" || value === ">") blockIndent = indent;
    if (hasChildren && value !== "|" && value !== ">") stack.push({ indent, key });
  }
  return leaves;
}

function isSnakeSegment(segment) {
  return /^<[^>]+>$/.test(segment)
    || /^[a-z][a-z0-9_]*(?:\[\])?$/.test(segment);
}

function themeTargetForPath(pathValue) {
  const exact = CONFIG_TARGET_FIELDS.find(field => {
    if (!field.scopes.includes("theme")) return false;
    const pattern = field.path
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/<[^>]+>/g, "[^.]*");
    return new RegExp(`^${pattern}$`).test(pathValue);
  });
  if (exact) return exact;
  return CONFIG_TARGET_FIELDS.find(field => {
    if (!field.scopes.includes("theme") || !["registered_schema", "parameter_bag"].includes(field.boundary)) return false;
    const pattern = field.path
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/<[^>]+>/g, "[^.]*");
    return new RegExp(`^${pattern}\\.`).test(pathValue);
  });
}

test("目标主题配置只暴露八个职责根域", () => {
  assert.deepEqual(CONFIG_TARGET_ROOTS.map(root => root.id), TARGET_ROOT_IDS);
  assert.equal(new Set(CONFIG_TARGET_ROOTS.map(root => root.id)).size, 8);
  for (const root of CONFIG_TARGET_ROOTS) {
    assert.equal(root.owner, "stellar");
    assert.equal(root.status, "delivered");
    assert.equal(root.boundary, "sealed");
    assert.ok(root.purpose.length > 0);
  }
});

test("每个可配置目标节点声明完整状态化契约", () => {
  const allowedTypes = new Set(["array", "boolean", "null", "number", "object", "string"]);
  const allowedScopes = new Set(["theme", "collection", "front_matter"]);
  const allowedBoundaries = new Set(["sealed", "record", "parameter_bag", "registered_schema"]);
  const keys = new Set();

  for (const field of CONFIG_TARGET_FIELDS) {
    for (const type of field.type) assert.ok(allowedTypes.has(type), `${field.path} 类型非法`);
    assert.ok(field.default && ["literal", "derived", "registered"].includes(field.default.kind), `${field.path} 缺少默认值契约`);
    assert.ok(field.scopes.length > 0 && field.scopes.every(scope => allowedScopes.has(scope)), `${field.path} 作用域非法`);
    assert.ok(field.cascade.length > 0, `${field.path} 缺少级联顺序`);
    assert.ok(field.normalization.length > 0, `${field.path} 缺少规范化规则`);
    assert.ok(["replace", "merge_declared_keys", "merge_keys", "by_value_type"].includes(field.mergeStrategy), `${field.path} 合并策略非法`);
    if (field.type.length > 1 && (field.type.includes("array") || field.type.includes("object"))) {
      assert.equal(field.mergeStrategy, "by_value_type", `${field.path} 联合类型必须按实际值选择合并策略`);
    } else if (field.type.includes("array")) {
      assert.equal(field.mergeStrategy, "replace", `${field.path} 数组必须完整替换`);
    }
    assert.ok(field.runtimePath.length > 0, `${field.path} 缺少运行时键`);
    assert.ok(field.consumers.length > 0, `${field.path} 缺少消费方`);
    assert.ok(field.migration.length > 0, `${field.path} 缺少迁移章节`);
    assert.ok(["planned", "delivered"].includes(field.status), `${field.path} 状态非法`);
    assert.ok(allowedBoundaries.has(field.boundary), `${field.path} 边界非法`);

    for (const scope of field.scopes) {
      const key = `${scope}:${field.path}`;
      assert.equal(keys.has(key), false, `${key} 重复声明`);
      keys.add(key);
    }
  }
});

test("Stellar 目标 YAML 使用 snake_case，第三方参数袋只豁免子字段", () => {
  const bannedSegments = new Set(["enable", "site_tree", "menubar", "comment_title", "api_host", "ui-style"]);
  for (const field of CONFIG_TARGET_FIELDS) {
    const segments = field.path.split(".");
    assert.notEqual(segments[0], "default", `${field.path} 不应使用 default 根域`);
    for (const segment of segments) {
      assert.equal(isSnakeSegment(segment), true, `${field.path} 不是 snake_case`);
      assert.equal(bannedSegments.has(segment), false, `${field.path} 含旧含糊名称`);
      assert.equal(segment.endsWith("-px"), false, `${field.path} 含物理单位字段名`);
    }
    if (field.boundary === "parameter_bag") {
      assert.ok(field.type.includes("object"), `${field.path} 参数袋父级必须是对象`);
      assert.equal(field.mergeStrategy, field.type.length === 1 ? "merge_keys" : "by_value_type", `${field.path} 参数袋合并策略错误`);
    }
  }
  assert.ok(CONFIG_TARGET_FIELDS.some(field => field.path === "extensions.comments.providers.<provider>" && field.boundary === "parameter_bag"));
  assert.ok(CONFIG_TARGET_FIELDS.some(field => field.path === "comments.options" && field.boundary === "parameter_bag"));
});

test("Profile 旧 ID 全量映射到冻结的语义 ID", () => {
  assert.deepEqual(Object.values(PROFILE_ID_MIGRATIONS), PROFILE_IDS);
  assert.equal(new Set(Object.values(PROFILE_ID_MIGRATIONS)).size, PROFILE_IDS.length);
  assert.equal(PROFILE_ID_MIGRATIONS.index_blog, "blog_index");
  assert.equal(PROFILE_ID_MIGRATIONS.notebooks, "notebook_index");
  assert.equal(PROFILE_ID_MIGRATIONS.error_page, "error");
});

test("Extension 与服务旧 ID 映射到注册表 ID", () => {
  assert.equal(FEATURE_ID_MIGRATIONS.fancybox, "lightbox");
  assert.equal(FEATURE_ID_MIGRATIONS.scrollreveal, "reveal");
  assert.equal(FEATURE_ID_MIGRATIONS.tianli_gpt, "ai_summary");
  assert.equal(FEATURE_ID_MIGRATIONS.katex, FEATURE_ID_MIGRATIONS.mathjax);
  assert.equal(FEATURE_ID_MIGRATIONS.swiper, null);
  assert.equal(SERVICE_ID_MIGRATIONS.siteinfo, "site_info");
});

test("Collection 与 Front Matter 的完整目标节点保持严格作用域", () => {
  const hasField = (scope, pathValue) => CONFIG_TARGET_FIELDS.some(field => field.path === pathValue && field.scopes.includes(scope));
  for (const pathValue of [
    "name", "identity.icon", "card.cover", "hero.background.effect", "sidebar.left.widgets",
    "navigation.menu", "article.type", "footer.license", "comments.options", "source.repository",
    "route.path", "listing.order_by", "note_defaults.sidebar", "navigation.tree"
  ]) assert.equal(hasField("collection", pathValue), true, `Collection 缺少 ${pathValue}`);

  for (const pathValue of [
    "collection.profile", "collection.id", "card.cover", "banner.image", "sidebar.left.widgets",
    "navigation.menu", "article.type", "footer.license", "comments.options", "visibility.listed",
    "listing.priority", "source.repository", "render.math", "render.diagrams", "seo.open_graph", "inject.head"
  ]) assert.equal(hasField("front_matter", pathValue), true, `Front Matter 缺少 ${pathValue}`);

  for (const pathValue of ["route.path", "route.start", "navigation.tree", "note_defaults.sidebar"]) {
    assert.equal(hasField("front_matter", pathValue), false, `${pathValue} 不应放宽到 Front Matter`);
  }

  assert.equal(resolveConfigMigration("collection", "routing.base_dir").to, "route.path");
  assert.equal(resolveConfigMigration("collection", "comments.service").to, "comments.provider");
  assert.equal(resolveConfigMigration("front_matter", "collection.type").to, "collection.profile");
  assert.equal(resolveConfigMigration("front_matter", "comments.giscus.data-theme").to, "comments.options.*");
  assert.equal(resolveConfigMigration("front_matter", "inject.head[]").to, "inject.head");
});

test("主题默认配置的活动叶子与注释示例字段族都有迁移证据", () => {
  const activeLeaves = activeYamlLeaves(fs.readFileSync(THEME_CONFIG, "utf8"));
  for (const leaf of activeLeaves) {
    const domainId = leaf.split(".")[0].replace(/\[\]$/, "");
    if (Object.prototype.hasOwnProperty.call(CONFIG_SCHEMA.properties, domainId)) {
      const targetPath = leaf.replace(/\[\]$/, "");
      const target = themeTargetForPath(targetPath);
      assert.equal(target?.status, "delivered", `${leaf} 未登记为已交付目标字段`);
    } else {
      assert.ok(resolveConfigMigration(domainId, leaf), `${leaf} 没有迁移结果`);
    }
  }

  const requiredCommentFamilies = [
    "menubar.items[].id",
    "menubar.items[].theme",
    "site_tree.<profile>.navigation.tabs.<title>",
    "footer.social.<id>.onclick",
    "footer.social.<id>.items[].title",
    "footer.sitemap[].items[]",
    "comments.<service>.*",
    "tag_plugins.<extension>.*",
    "plugins.<extension>.*"
  ];
  const catalogFields = new Set(CONFIG_DOMAIN_CATALOG.flatMap(domain => domain.fields));
  for (const family of requiredCommentFamilies) assert.ok(catalogFields.has(family), `${family} 未登记`);

  for (const targetPath of [
    "site.footer.actions[].items[].icon",
    "site.footer.actions[].items[].title",
    "site.footer.actions[].items[].url",
    "site.footer.sections[].title",
    "site.footer.sections[].items",
    "site.footer.sections[].items[].title",
    "site.footer.sections[].items[].url"
  ]) assert.ok(CONFIG_TARGET_FIELDS.some(field => field.path === targetPath), `${targetPath} 未冻结目标结构`);
});

test("旧顶层域各自指向唯一目标根或明确排除", () => {
  assert.deepEqual(Object.keys(CONFIG_DOMAIN_TARGETS), CONFIG_DOMAIN_CATALOG.map(domain => domain.id));
  for (const [domain, target] of Object.entries(CONFIG_DOMAIN_TARGETS)) {
    if (target === null || ["collection", "front_matter", "theme_data"].includes(target)) continue;
    assert.ok(TARGET_ROOT_IDS.includes(target.split(".")[0]), `${domain} 指向未知目标根 ${target}`);
  }
  assert.equal(CONFIG_DOMAIN_TARGETS.canonical, "seo.canonical");
  assert.equal(CONFIG_DOMAIN_TARGETS.style, "appearance");
  assert.equal(CONFIG_DOMAIN_TARGETS.default, "resources.fallbacks");
});

test("官方脚本样式与内部集成有显式内部化清单", () => {
  assert.ok(CONFIG_INTERNALIZED_RESOURCES.includes("dependencies.marked"));
  assert.ok(CONFIG_INTERNALIZED_RESOURCES.includes("plugins.<official_extension>.{js,css,inject}"));
  assert.ok(CONFIG_INTERNALIZED_RESOURCES.includes("data_services.<official_service>.js"));
  assert.ok(CONFIG_INTERNALIZED_RESOURCES.includes("extensions.cache.*"));
  assert.ok(CONFIG_INTERNALIZED_RESOURCES.includes("extensions.features.{preload,lightbox,reveal,ai_summary,diagrams}.provider"));
  assert.ok(CONFIG_INTERNALIZED_RESOURCES.includes("style.loading.*"));
});

test("运行时只投影已交付配置节点且根配置已经封闭", () => {
  assert.equal(CONFIG_SCHEMA.sealed, true);
  assert.deepEqual(Object.keys(CONFIG_SCHEMA.properties), ["site", "layout", "content", "appearance", "seo", "resources", "extensions", "inject"]);
  const deliveredPaths = CONFIG_TARGET_FIELDS
    .filter(field => field.status === "delivered" && field.scopes.includes("theme"))
    .map(field => field.path);
  assert.deepEqual(
    deliveredPaths.filter(pathValue => !pathValue.startsWith("layout.") && !pathValue.startsWith("content.") && !pathValue.startsWith("appearance.") && !pathValue.startsWith("resources.fallbacks.") && !pathValue.startsWith("extensions.")),
    [
      "site.brand.image.src",
      "site.brand.image.variant",
      "site.brand.image.href",
      "site.brand.name",
      "site.brand.wordmark",
      "site.brand.tagline.text",
      "site.brand.tagline.hover",
      "site.brand.href",
      "site.menu.items",
      "site.menu.items[].id",
      "site.menu.items[].title",
      "site.menu.items[].icon",
      "site.menu.items[].url",
      "site.menu.items[].accent",
      "site.footer.actions",
      "site.footer.actions[].type",
      "site.footer.actions[].icon",
      "site.footer.actions[].title",
      "site.footer.actions[].url",
      "site.footer.actions[].items",
      "site.footer.actions[].items[].icon",
      "site.footer.actions[].items[].title",
      "site.footer.actions[].items[].url",
      "site.footer.sections",
      "site.footer.sections[].title",
      "site.footer.sections[].items",
      "site.footer.sections[].items[].title",
      "site.footer.sections[].items[].url",
      "site.footer.content",
      "seo.canonical.host",
      "seo.canonical.allowed_hosts",
      "seo.open_graph.enabled",
      "seo.open_graph.twitter_id",
      "seo.structured_data.same_as",
      "resources.preconnect",
      "inject.head",
      "inject.script"
    ]
  );
  assert.ok(deliveredPaths.includes("appearance.typography.font_family.inline_code"));
  assert.ok(deliveredPaths.includes("appearance.backgrounds.page.blur.saturation"));
  assert.ok(deliveredPaths.includes("resources.fallbacks.image.tag_plugin"));
  assert.ok(deliveredPaths.includes("resources.fallbacks.error_page"));
  const deliveredExtensionPaths = deliveredPaths.filter(pathValue => pathValue.startsWith("extensions."));
  assert.ok(deliveredExtensionPaths.includes("extensions.search.provider"));
  assert.ok(deliveredExtensionPaths.includes("extensions.comments.providers.<provider>"));
  assert.equal(deliveredExtensionPaths.includes("extensions.features.ai_summary.provider"), false);
  assert.ok(deliveredExtensionPaths.includes("extensions.services.github.raw_url"));
  assert.equal(deliveredExtensionPaths.some(pathValue => pathValue.startsWith("extensions.cache")), false);
  const deliveredContentPaths = deliveredPaths.filter(pathValue => pathValue.startsWith("content."));
  assert.equal(deliveredContentPaths.length, 26);
  for (const pathValue of [
    "content.article.listing.card_layout",
    "content.article.category_colors.<category>",
    "content.article.related_posts.enabled",
    "content.notebook.listing.order_by",
    "content.notebook.tag_icons.<tag>"
  ]) assert.ok(deliveredContentPaths.includes(pathValue));
  const deliveredLayoutPaths = deliveredPaths.filter(pathValue => pathValue.startsWith("layout."));
  assert.equal(deliveredLayoutPaths.length, 58);
  assert.ok(deliveredLayoutPaths.includes("layout.profiles"));
  for (const profile of PROFILE_IDS) {
    for (const suffix of ["navigation.active_menu", "sidebar.left", "sidebar.right"]) {
      assert.ok(deliveredLayoutPaths.includes(`layout.profiles.${profile}.${suffix}`));
    }
  }
  for (const profile of ["blog_index", "topic_index", "wiki_index", "notebook_index", "author", "error"]) {
    assert.ok(deliveredLayoutPaths.includes(`layout.profiles.${profile}.path`));
  }
  for (const profile of ["blog_index", "wiki_index"]) {
    for (const suffix of ["navigation.tabs", "navigation.tabs[].title", "navigation.tabs[].url"]) {
      assert.ok(deliveredLayoutPaths.includes(`layout.profiles.${profile}.${suffix}`));
    }
  }
  for (const suffix of ["comments", "comments.enabled", "comments.title", "comments.id", "comments.provider", "comments.options"]) {
    assert.ok(deliveredLayoutPaths.includes(`layout.profiles.home.${suffix}`));
  }
  assert.equal(CONFIG_TARGET_ROOTS.every(root => root.status === "delivered"), true);
  assert.ok(CONFIG_TARGET_FIELDS.some(field => field.status === "delivered" && field.scopes.includes("collection")));
  assert.ok(CONFIG_TARGET_FIELDS.some(field => field.status === "delivered" && field.scopes.includes("front_matter")));
});

test("运行时 Schema 完整投影已交付目标节点契约", () => {
  const activeFields = new Map([
    ...flattenConfigFields(CONFIG_SCHEMA),
    ...flattenConfigFields(COLLECTION_CONFIG_SCHEMA),
    ...flattenConfigFields(FRONT_MATTER_CONFIG_SCHEMA)
  ].map(field => [`${field.scope}:${field.path}`, field]));
  const delivered = CONFIG_TARGET_FIELDS.filter(field => field.status === "delivered");
  for (const target of delivered) {
    for (const scope of target.scopes) {
      const active = activeFields.get(`${scope}:${target.path}`);
      assert.ok(active, `${scope}:${target.path} 未进入运行时 Schema`);
      assert.deepEqual(active.type, target.type, `${scope}:${target.path} 类型漂移`);
      if (target.default.kind !== "registered") {
        assert.deepEqual(active.default, target.default, `${scope}:${target.path} 默认值漂移`);
      }
      assert.deepEqual(active.cascade, target.cascade, `${scope}:${target.path} 级联顺序漂移`);
      assert.equal(active.normalization, target.normalization, `${scope}:${target.path} 规范化规则漂移`);
      assert.deepEqual(active.consumers, target.consumers, `${scope}:${target.path} 消费方漂移`);
      assert.equal(active.migration, target.migration, `${scope}:${target.path} 迁移章节漂移`);
      assert.equal(active.runtimePath, target.runtimePath, `${scope}:${target.path} 运行时键漂移`);
    }
  }
});

test("目标契约对象深度冻结", () => {
  assert.equal(Object.isFrozen(CONFIG_TARGET_ROOTS), true);
  assert.equal(Object.isFrozen(CONFIG_TARGET_FIELDS), true);
  assert.equal(Object.isFrozen(CONFIG_TARGET_FIELDS[0]), true);
  assert.equal(Object.isFrozen(CONFIG_TARGET_FIELDS[0].scopes), true);
  assert.equal(Object.isFrozen(PROFILE_ID_MIGRATIONS), true);
  assert.equal(Object.isFrozen(CONFIG_INTERNALIZED_RESOURCES), true);
});
