/* global hexo */
"use strict";

const { literal } = require("./config-schema");
const { CONFIG_TARGET_FIELDS } = require("./content-config-rules");
const { deepFreeze } = require("./schema-utils");

const HEXO_FRONT_MATTER_FIELDS = Object.freeze([
  "_content",
  "abbrlink",
  "categories",
  "date",
  "description",
  "disableNunjucks",
  "excerpt",
  "keywords",
  "lang",
  "language",
  "layout",
  "link",
  "permalink",
  "photos",
  "published",
  "robots",
  "sitemap",
  "tags",
  "title",
  "updated"
]);

const LEGACY_COLLECTION_ROOTS = Object.freeze({
  title: "name",
  subtitle: "tagline",
  coverpage: "hero",
  background: "hero.background",
  animation: "hero.background.effect",
  menu_id: "active_menu",
  header: "active_menu | breadcrumb",
  search: "leftbar.widgets",
  menu: "active_menu",
  type: "article.style",
  indent: "article.paragraph_indent",
  author: "article.author",
  ai_label: "article.ai_label",
  references: "footer.references",
  license: "footer.license",
  share: "footer.share",
  comment_title: "comments.title",
  repo: "source.repository",
  branch: "source.branch",
  available: "visibility",
  start: "route.start",
  base_dir: "route.path",
  preview: "hero.preview",
  actions: "hero.actions",
  routing: "route",
  note: null,
  tree: "navigation.tree"
});

const LEGACY_FRONT_MATTER_ROOTS = Object.freeze({
  wiki: "collection.id",
  topic: "collection.id",
  notebook: "collection.id",
  h1: "banner.headline",
  subtitle: "banner.tagline",
  banner_info: "banner",
  menu_id: "active_menu",
  header: "active_menu | breadcrumb",
  search: "leftbar.widgets",
  menu: "active_menu",
  logo: "leftbar.widgets",
  type: "article.style",
  indent: "article.paragraph_indent",
  author: "article.author",
  ai_label: "article.ai_label",
  references: "footer.references",
  license: "footer.license",
  share: "footer.share",
  comment_title: "comments.title",
  comment_id: "comments.id",
  comments_service: "comments.provider",
  indexing: "visibility.searchable",
  pin: "listing.priority",
  sticky: "listing.priority",
  repo: "source.repository",
  branch: "source.branch",
  nav_tabs: "active_menu | breadcrumb",
  poster: "banner",
  open_graph: "seo.open_graph",
  katex: "render.math",
  mathjax: "render.math",
  mermaid: "render.diagrams"
});

const COMMENT_PROVIDER_FIELDS = Object.freeze([
  "service",
  "beaudar",
  "utterances",
  "giscus",
  "twikoo",
  "waline",
  "artalk"
]);

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value == null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
}

function camelCase(value) {
  return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function exampleFor(target) {
  if (target.default?.kind === "literal") return clone(target.default.value);
  if (target.type.includes("object")) return {};
  if (target.type.includes("array")) return [];
  if (target.type.includes("string")) return "";
  if (target.type.includes("boolean")) return false;
  if (target.type.includes("number")) return 0;
  return null;
}

function normalizerFor(target) {
  if (target.path === "route.path") return "collection_path";
  if (target.path === "footer.share") return "share_override";
  if (target.boundary === "parameter_bag" || target.boundary === "record") return "parameter_bag";
  if (target.type.includes("object")) return "object";
  if (target.type.includes("array")) return "array";
  return "identity";
}

function runtimeKeyFor(target) {
  return target.runtimePath.split(".").at(-1).replace(/\[\]$/, "");
}

function targetNode(target) {
  return {
    type: clone(target.type),
    default: clone(target.default),
    scope: target.scopes[0],
    cascade: clone(target.cascade),
    normalizer: normalizerFor(target),
    normalization: target.normalization,
    consumers: clone(target.consumers),
    example: exampleFor(target),
    migration: target.migration,
    runtimeKey: runtimeKeyFor(target),
    ...(target.boundary === "sealed" ? { sealed: true } : {}),
    ...(target.values ? { values: clone(target.values) } : {}),
    ...(target.minimum !== undefined ? { minimum: target.minimum } : {}),
    ...(target.exclusiveMinimum !== undefined ? { exclusiveMinimum: target.exclusiveMinimum } : {})
  };
}

function syntheticObject(scope, path) {
  return {
    type: ["object"],
    default: literal({}),
    scope,
    cascade: scope === "collection"
      ? ["schema default", "theme profile", "collection"]
      : ["schema default", "theme profile", "collection", "front matter"],
    normalizer: "object",
    normalization: "merge declared child fields; deep-freeze the normalized JavaScript object",
    consumers: ["CollectionModel", "PageViewModel"],
    example: {},
    migration: `content-schema/${scope.replace("_", "-")}`,
    runtimeKey: camelCase(path.split(".").at(-1).replace(/\[\]$/, "")),
    sealed: true,
    properties: {}
  };
}

function itemNode(scope, path, item) {
  const types = clone(item?.type || ["object"]);
  const parameterBag = item?.boundary === "parameter_bag";
  return {
    type: types,
    default: types.includes("object") ? literal({}) : undefined,
    scope,
    cascade: scope === "collection"
      ? ["schema default", "theme profile", "collection"]
      : ["schema default", "theme profile", "collection", "front matter"],
    normalizer: parameterBag ? "parameter_bag" : (types.includes("object") ? "object" : "identity"),
    normalization: "validate the declared item type; preserve the value; deep-freeze the result",
    consumers: ["CollectionModel", "PageViewModel"],
    example: types.includes("object") ? {} : "",
    migration: `content-schema/${scope.replace("_", "-")}`,
    runtimeKey: path,
    ...(item?.values ? { values: clone(item.values) } : {}),
    ...(types.includes("object") && !parameterBag ? { sealed: true, properties: {} } : {})
  };
}

function mergeTargetNode(existing, target) {
  const properties = existing?.properties;
  const items = existing?.items;
  const result = { ...targetNode(target) };
  if (properties) result.properties = properties;
  if (items) result.items = items;
  if (target.items && !result.items) result.items = itemNode(target.scopes[0], target.path, target.items);
  return result;
}

function insertTarget(root, target) {
  const segments = target.path.split(".");
  let node = root;
  let currentPath = "";
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const array = segment.endsWith("[]");
    const key = array ? segment.slice(0, -2) : segment;
    currentPath = currentPath ? `${currentPath}.${segment}` : segment;
    node.properties ||= {};
    const last = index === segments.length - 1;
    const existing = node.properties[key];
    node.properties[key] = last
      ? mergeTargetNode(existing, target)
      : existing || syntheticObject(target.scopes[0], currentPath);
    const child = node.properties[key];
    if (array) {
      child.items ||= itemNode(target.scopes[0], currentPath, target.items);
      node = child.items;
    } else {
      node = child;
    }
  }
}

function schemaForScope(scope) {
  const root = syntheticObject(scope, scope);
  root.runtimeKey = scope;
  root.applyDefaults = false;
  root.sealed = true;
  for (const target of CONFIG_TARGET_FIELDS.filter(field => field.scopes.includes(scope))) {
    if (target.status !== "delivered") throw new Error(`配置目标 ${scope}:${target.path} 尚未交付`);
    insertTarget(root, target);
  }
  return root;
}

function decorateSharedSchemas(schema) {
  schema.removedProperties ||= {};
  schema.removedProperties.regions = "topbar | leftbar | rightbar";
  for (const region of ["topbar", "leftbar", "rightbar"]) {
    schema.properties[region].normalizer = "object";
    schema.properties[region].normalization = "accept a Region object; validate children and deep-freeze the normalized object";
    schema.properties[region].migration = `${region}.widgets`;
    schema.properties[region].removedProperties = { inherit: null };
  }
  schema.properties.topbar.properties.widgets.validator = "region_widgets";
  schema.properties.leftbar.properties.widgets.validator = "leftbar_content_widgets";
  schema.properties.rightbar.properties.widgets.validator = "region_widgets";
  for (const region of ["topbar", "leftbar"]) {
    schema.properties[region].properties.brand.validator = "brand";
    schema.properties[region].properties.brand.properties.href.validator = "nullable_safe_navigation_url";
    schema.properties[region].properties.menu.validator = "menu_items";
  }
  schema.properties.leftbar.properties.footer.properties.actions.validator = "footer_actions";

  const effect = schema.properties.hero?.properties.background?.properties.effect;
  if (effect) {
    effect.validator = "effect";
    effect.normalizer = "effect";
  }

  const tree = schema.properties.navigation?.properties.tree;
  if (tree) tree.validator = "string_tree";
}

function decorateCommon(schema) {
  schema.removedProperties.sidebar = "leftbar | rightbar";
  if (schema.properties.navigation) {
    schema.properties.navigation.removedProperties = {
      mobile_header: "active_menu | breadcrumb",
      menu: "active_menu",
      breadcrumb: "breadcrumb"
    };
  }
  schema.properties.comments.removedProperties = Object.fromEntries(
    COMMENT_PROVIDER_FIELDS.map(field => [field, field === "service" ? "provider" : "options"])
  );
  schema.properties.comments.properties.provider.validator = "nullable_non_empty_string";
  schema.properties.article.removedProperties = { type: "style", indent: "paragraph_indent" };
  schema.properties.article.properties.style.values = ["tech", "story"];
  schema.properties.article.properties.paragraph_indent.values = ["auto", "always", "never"];
  schema.properties.article.properties.ai_label.values = ["manual", "reviewed", "polished", "generated", null];
  schema.properties.footer.properties.license.validator = "license_override";
  schema.properties.footer.properties.share.validator = "share_override";
  if (schema.properties.listing?.properties?.priority) {
    schema.properties.listing.properties.priority.validator = "non_negative_integer";
  }
  if (schema.properties.render?.properties?.diagrams) {
    schema.properties.render.properties.diagrams.validator = "diagrams_override";
  }
}

const COLLECTION_CONFIG_SCHEMA = schemaForScope("collection");
COLLECTION_CONFIG_SCHEMA.requiredProperties = ["name"];
COLLECTION_CONFIG_SCHEMA.removedProperties = clone(LEGACY_COLLECTION_ROOTS);
COLLECTION_CONFIG_SCHEMA.removedProperties.identity = "icon";
COLLECTION_CONFIG_SCHEMA.removedProperties.banner_info = "banner";
COLLECTION_CONFIG_SCHEMA.removedProperties.note_defaults = null;
COLLECTION_CONFIG_SCHEMA.properties.name.validator = "non_empty_string";
COLLECTION_CONFIG_SCHEMA.properties.route.removedProperties = { base_dir: "path" };
COLLECTION_CONFIG_SCHEMA.properties.listing.properties.order.validator = "nullable_non_negative_integer";
COLLECTION_CONFIG_SCHEMA.properties.listing.properties.excerpt_length.validator = "nullable_non_negative_integer";
COLLECTION_CONFIG_SCHEMA.properties.listing.properties.per_page.validator = "nullable_non_negative_integer";
COLLECTION_CONFIG_SCHEMA.properties.listing.removedProperties = { order_by: "sort" };
decorateSharedSchemas(COLLECTION_CONFIG_SCHEMA);
decorateCommon(COLLECTION_CONFIG_SCHEMA);

const FRONT_MATTER_CONFIG_SCHEMA = schemaForScope("front_matter");
FRONT_MATTER_CONFIG_SCHEMA.externalProperties = HEXO_FRONT_MATTER_FIELDS;
FRONT_MATTER_CONFIG_SCHEMA.removedProperties = clone(LEGACY_FRONT_MATTER_ROOTS);
FRONT_MATTER_CONFIG_SCHEMA.removedProperties.navigation = "active_menu | breadcrumb";
FRONT_MATTER_CONFIG_SCHEMA.properties.collection.requiredProperties = ["profile", "id"];
FRONT_MATTER_CONFIG_SCHEMA.properties.collection.removedProperties = { type: "profile" };
FRONT_MATTER_CONFIG_SCHEMA.properties.collection.properties.id.validator = "non_empty_string";
decorateSharedSchemas(FRONT_MATTER_CONFIG_SCHEMA);
decorateCommon(FRONT_MATTER_CONFIG_SCHEMA);

module.exports = {
  COLLECTION_CONFIG_SCHEMA: deepFreeze(COLLECTION_CONFIG_SCHEMA),
  FRONT_MATTER_CONFIG_SCHEMA: deepFreeze(FRONT_MATTER_CONFIG_SCHEMA),
  HEXO_FRONT_MATTER_FIELDS
};
