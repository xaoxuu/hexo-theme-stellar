/* global hexo */
"use strict";

const { deepFreeze } = require("./schema-utils");

const COLLECTION_SCOPE = Object.freeze(["collection"]);
const FRONT_MATTER_SCOPE = Object.freeze(["front_matter"]);
const COLLECTION_CASCADE = Object.freeze(["schema default", "theme profile", "collection"]);
const FRONT_MATTER_CASCADE = Object.freeze(["schema default", "theme profile", "collection", "front matter"]);

function literal(value) {
  return { kind: "literal", value };
}

function derived(...sources) {
  return { kind: "derived", sources };
}

function runtimePath(path) {
  const segments = path.split(".");
  return segments.map((segment, index) => {
    if (segment.startsWith("<")) return segment;
    if (segments[index - 1] === "providers") return segment;
    return segment.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }).join(".");
}

function targetField(path, options) {
  const scopes = options.scopes;
  const types = Array.isArray(options.type) ? options.type : [options.type];
  const boundary = options.boundary || "sealed";
  const hasMergeableUnion = types.length > 1 && (types.includes("array") || types.includes("object"));
  return {
    path,
    type: types,
    default: options.default,
    scopes,
    cascade: options.cascade,
    normalization: options.normalization || "validate the declared type; preserve the value; deep-freeze the result",
    mergeStrategy: options.mergeStrategy || (hasMergeableUnion ? "by_value_type" : (types.includes("array") ? "replace" : (types.includes("object") ? (boundary === "parameter_bag" ? "merge_keys" : "merge_declared_keys") : "replace"))),
    runtimePath: options.runtimePath || runtimePath(path),
    consumers: options.consumers,
    migration: options.migration || `configuration/${path.split(".")[0]}`,
    status: options.status || "planned",
    boundary,
    ...(options.items ? { items: options.items } : {}),
    ...(options.values ? { values: options.values } : {}),
    ...(options.minimum !== undefined ? { minimum: options.minimum } : {}),
    ...(options.maximum !== undefined ? { maximum: options.maximum } : {}),
    ...(options.exclusiveMinimum !== undefined ? { exclusiveMinimum: options.exclusiveMinimum } : {})
  };
}

function fields(consumers, definitions, options = {}) {
  return definitions.map(definition => targetField(definition[0], {
    type: definition[1],
    default: definition[2],
    consumers,
    ...options,
    ...(definition[3] || {})
  }));
}


const CONTENT_CONSUMERS = Object.freeze(["CollectionModel", "PageViewModel", "article renderer", "listing renderer"]);
const REGION_NORMALIZATION = "accept a widget array shorthand or a full region object; validate children and deep-freeze the normalized object";

const CONTENT_OVERRIDE_DEFINITIONS = [
  ["card", "object", derived("theme profile card"), { boundary: "sealed" }],
  ["card.cover", ["string", "null"], derived("theme or collection card.cover")],
  ["card.tagline", ["string", "null"], derived("theme or collection card.tagline")],
  ["regions", "object", derived("theme profile regions"), { boundary: "sealed" }],
  ["regions.topbar", "object", derived("theme or collection topbar"), { boundary: "sealed", normalization: REGION_NORMALIZATION }],
  ["regions.topbar.widgets", "array", literal([]), { items: { type: ["string", "object"], boundary: "parameter_bag" } }],
  ["regions.leftbar", "object", derived("theme or collection leftbar"), { boundary: "sealed", normalization: REGION_NORMALIZATION }],
  ["regions.leftbar.enabled", ["boolean", "null"], literal(null)],
  ["regions.leftbar.brand", ["string", "boolean", "null"], literal(null), { values: [null, false, "site_brand", "collection_brand"] }],
  ["regions.leftbar.menu", ["boolean", "null"], literal(null)],
  ["regions.leftbar.footer", "object", literal({}), { boundary: "sealed" }],
  ["regions.leftbar.footer.actions", ["boolean", "null"], literal(null)],
  ["regions.leftbar.widgets", "array", literal([]), { items: { type: ["string", "object"], boundary: "parameter_bag" } }],
  ["regions.rightbar", "object", derived("theme or collection rightbar"), { boundary: "sealed", normalization: REGION_NORMALIZATION }],
  ["regions.rightbar.widgets", "array", literal([]), { items: { type: ["string", "object"], boundary: "parameter_bag" } }],
  ["navigation", "object", derived("theme profile navigation"), { boundary: "sealed" }],
  ["navigation.menu", ["string", "null"], literal(null)],
  ["navigation.breadcrumb", ["boolean", "null"], literal(null)],
  ["article", "object", derived("content.article"), { boundary: "sealed" }],
  ["article.style", ["string", "null"], literal(null), { values: ["tech", "story"] }],
  ["article.paragraph_indent", ["string", "null"], literal(null), { values: ["auto", "always", "never"] }],
  ["article.author", ["string", "null"], literal(null)],
  ["article.ai_label", ["string", "null"], literal(null), { values: ["manual", "reviewed", "polished", "generated"] }],
  ["footer", "object", derived("content defaults footer"), { boundary: "sealed" }],
  ["footer.references", "array", literal([]), { items: { type: ["object", "string"] } }],
  ["footer.license", ["boolean", "string", "null"], literal(null)],
  ["footer.share", ["boolean", "array", "null"], literal(null), { items: { type: ["string"], values: ["wechat", "weibo", "email", "link"] } }],
  ["footer.show_tags", ["boolean", "null"], literal(null)],
  ["comments", "object", derived("extensions.comments and broader content scope"), { boundary: "sealed" }],
  ["comments.enabled", ["boolean", "null"], literal(null)],
  ["comments.title", ["string", "null"], literal(null)],
  ["comments.id", ["string", "null"], literal(null)],
  ["comments.provider", ["string", "null"], literal(null)],
  ["comments.options", "object", literal({}), { boundary: "parameter_bag" }],
  ["source", "object", literal({}), { boundary: "sealed" }],
  ["source.repository", ["string", "null"], literal(null)],
  ["source.branch", ["string", "null"], literal(null)]
];

const COLLECTION_TARGET_DEFINITIONS = [
  ["name", "string", derived("required collection identity")],
  ["headline", ["string", "null"], literal(null)],
  ["tagline", ["string", "null"], literal(null)],
  ["description", ["string", "null"], literal(null)],
  ["tags", "array", literal([]), { items: { type: ["string"] } }],
  ["audience", ["string", "null"], literal(null)],
  ["identity", "object", literal({}), { boundary: "sealed" }],
  ["identity.icon", ["string", "null"], literal(null)],
  ["hero", "object", literal({}), { boundary: "sealed" }],
  ["hero.enabled", ["boolean", "null"], literal(null)],
  ["hero.background", "object", literal({}), { boundary: "sealed" }],
  ["hero.background.image", ["string", "null"], literal(null)],
  ["hero.background.effect", ["object", "null"], literal(null), { boundary: "registered_schema" }],
  ["hero.preview", ["object", "null"], literal(null), { boundary: "sealed" }],
  ["hero.preview.type", ["string", "null"], literal(null), { values: ["terminal", "image"] }],
  ["hero.preview.src", ["string", "null"], literal(null)],
  ["hero.preview.alt", ["string", "null"], literal(null)],
  ["hero.preview.commands", "array", literal([]), { items: { type: ["object"] } }],
  ["hero.preview.commands[].label", ["string", "null"], literal(null)],
  ["hero.preview.commands[].codes", ["string", "null"], literal(null)],
  ["hero.actions", "array", literal([]), { items: { type: ["object"] } }],
  ["hero.actions[].title", ["string", "null"], literal(null)],
  ["hero.actions[].url", ["string", "null"], literal(null)],
  ["hero.actions[].icon", ["string", "null"], literal(null)],
  ["route", "object", literal({}), { boundary: "sealed" }],
  ["route.path", "string", derived("collection route"), { normalization: "normalize to a collection-relative path" }],
  ["route.start", ["string", "null"], literal(null)],
  ["listing", "object", literal({}), { boundary: "sealed" }],
  ["listing.priority", ["number", "null"], literal(null), { minimum: 0 }],
  ["listing.order", ["number", "null"], literal(null), { minimum: 0 }],
  ["listing.excerpt_length", ["number", "null"], literal(null), { minimum: 0 }],
  ["listing.per_page", ["number", "null"], literal(null), { minimum: 0 }],
  ["listing.sort", ["object", "null"], literal(null), { boundary: "sealed" }],
  ["listing.sort.field", ["string", "null"], literal(null), { values: ["date", "updated", "title"] }],
  ["listing.sort.direction", ["string", "null"], literal(null), { values: ["asc", "desc"] }],
  ["note_defaults", "object", literal({}), { boundary: "sealed" }],
  ["note_defaults.regions", "object", literal({}), { boundary: "registered_schema" }],
  ["navigation.tree", ["array", "object"], literal([]), { boundary: "record" }]
];

const FRONT_MATTER_TARGET_DEFINITIONS = [
  ["collection", "object", literal({}), { boundary: "sealed" }],
  ["collection.profile", "string", derived("required collection profile"), { values: ["wiki", "topic", "notebook"] }],
  ["collection.id", "string", derived("required collection ID")],
  ["banner", "object", derived("collection or theme banner"), { boundary: "sealed" }],
  ["banner.enabled", ["boolean", "null"], literal(null)],
  ["banner.image", ["string", "null"], literal(null)],
  ["banner.avatar", ["string", "null"], literal(null)],
  ["banner.headline", ["string", "null"], literal(null)],
  ["banner.tagline", ["string", "null"], literal(null)],
  ["visibility", "object", literal({}), { boundary: "sealed" }],
  ["visibility.listed", "boolean", literal(true)],
  ["visibility.searchable", "boolean", literal(true)],
  ["listing", "object", literal({}), { boundary: "sealed" }],
  ["listing.priority", "number", literal(0), { minimum: 0 }],
  ["render", "object", literal({}), { boundary: "sealed" }],
  ["render.math", ["boolean", "string"], literal(false), { values: [false, "katex", "mathjax"] }],
  ["render.diagrams", ["boolean", "string", "object"], literal(false), { boundary: "parameter_bag" }],
  ["seo", "object", literal({}), { boundary: "sealed" }],
  ["seo.open_graph", "object", literal({}), { boundary: "parameter_bag" }],
  ["inject", "object", literal({}), { boundary: "sealed" }],
  ["inject.head_end", "string", literal("")],
  ["inject.body_end", "string", literal("")]
];

const CONFIG_TARGET_FIELDS = deepFreeze([
  ...fields(CONTENT_CONSUMERS, CONTENT_OVERRIDE_DEFINITIONS, {
    scopes: COLLECTION_SCOPE,
    cascade: COLLECTION_CASCADE,
    migration: "content-schema/collection",
    status: "delivered"
  }),
  ...fields(CONTENT_CONSUMERS, CONTENT_OVERRIDE_DEFINITIONS, {
    scopes: FRONT_MATTER_SCOPE,
    cascade: FRONT_MATTER_CASCADE,
    migration: "content-schema/front-matter",
    status: "delivered"
  }),
  ...fields(CONTENT_CONSUMERS, COLLECTION_TARGET_DEFINITIONS, {
    scopes: COLLECTION_SCOPE,
    cascade: COLLECTION_CASCADE,
    migration: "content-schema/collection",
    status: "delivered"
  }),
  ...fields(CONTENT_CONSUMERS, FRONT_MATTER_TARGET_DEFINITIONS, {
    scopes: FRONT_MATTER_SCOPE,
    cascade: FRONT_MATTER_CASCADE,
    migration: "content-schema/front-matter",
    status: "delivered"
  })
]);

module.exports = { CONFIG_TARGET_FIELDS };
