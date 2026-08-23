/* global hexo */
"use strict";

const { deepFreeze } = require("./schema-utils");
const {
  CONFIG_DOMAIN_MIGRATIONS,
  CONFIG_DOMAIN_TARGETS,
  CONFIG_TARGET_FIELDS
} = require("./config-target");

function deliveredTargetStatus(targetPath) {
  if (targetPath === null) return "excluded";
  const targets = CONFIG_TARGET_FIELDS.filter(field => field.scopes.includes("theme") && (field.path === targetPath || field.path.startsWith(`${targetPath}.`)));
  return targets.length > 0 && targets.every(field => field.status === "delivered") ? "delivered" : "planned";
}

function domain(id, options) {
  return {
    id,
    sourceKind: options.sourceKind || "theme",
    sources: options.sources,
    owner: options.owner || "stellar",
    boundary: options.boundary,
    targetPath: CONFIG_DOMAIN_TARGETS[id],
    targetStatus: options.targetStatus || deliveredTargetStatus(CONFIG_DOMAIN_TARGETS[id]),
    runtimeTarget: options.runtimeTarget,
    consumers: options.consumers,
    status: options.status,
    migrationSlice: options.migrationSlice,
    fields: CONFIG_DOMAIN_MIGRATIONS[id].map(entry => entry.from),
    migrations: CONFIG_DOMAIN_MIGRATIONS[id],
    ...(options.dynamicRecords ? { dynamicRecords: options.dynamicRecords } : {}),
    ...(options.parameterBags ? { parameterBags: options.parameterBags } : {})
  };
}

const THEME_SOURCES = Object.freeze([
  "themes/stellar/_config.yml",
  "_config.stellar.yml"
]);

const CONFIG_MIGRATION_SLICES = deepFreeze([
  {
    id: "head-seo",
    order: 1,
    domains: ["preconnect", "canonical", "open_graph", "structured_data", "inject"]
  },
  {
    id: "shell-content-defaults",
    order: 2,
    domains: ["brand", "menubar", "site_tree", "notebook", "article", "footer", "style", "default"]
  },
  {
    id: "collection-front-matter",
    order: 3,
    domains: ["collection", "front_matter"]
  },
  {
    id: "extensions-services",
    order: 4,
    domains: [
      "search", "comments", "tag_plugins", "dependencies", "data_services",
      "data_cache", "plugins", "api_host"
    ]
  },
  {
    id: "root-seal",
    order: 5,
    domains: [
      "stellar", "system", "cache", "language_switcher", "hexo", "hexo_front_matter",
      "theme_data", "derived_runtime"
    ]
  }
]);

const CONFIG_DOMAIN_CATALOG = deepFreeze([
  domain("stellar", {
    sources: THEME_SOURCES,
    owner: "package",
    boundary: "sealed",
    runtimeTarget: "package.json",
    consumers: ["asset loader", "stellar_info helper"],
    status: "excluded",
    migrationSlice: "root-seal",
  }),
  domain("preconnect", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.resources.preconnect",
    consumers: ["head renderer"],
    status: "delivered",
    migrationSlice: "head-seo",
  }),
  domain("canonical", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.seo.canonical",
    consumers: ["Post PageViewModel", "head renderer", "browser canonical check", "Reference generator"],
    status: "delivered",
    migrationSlice: "head-seo",
  }),
  domain("open_graph", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.seo.openGraph",
    consumers: ["Post PageViewModel", "head renderer"],
    status: "delivered",
    migrationSlice: "head-seo",
  }),
  domain("structured_data", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.seo.structuredData",
    consumers: ["Post PageViewModel", "json_ld helper"],
    status: "delivered",
    migrationSlice: "head-seo",
  }),
  domain("brand", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.site.brand",
    consumers: ["PageViewModel", "brand helper", "sidebar renderer"],
    status: "delivered",
    migrationSlice: "shell-content-defaults",
  }),
  domain("menubar", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.site.menu",
    consumers: ["PageViewModel", "menu renderer"],
    status: "delivered",
    migrationSlice: "shell-content-defaults",
  }),
  domain("site_tree", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.layout.profiles",
    consumers: ["CollectionModel", "PageViewModel", "page generators", "sidebar renderer"],
    status: "delivered",
    migrationSlice: "shell-content-defaults",
  }),
  domain("notebook", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.content.notebook",
    consumers: ["Notebook CollectionModel", "notebook builder"],
    status: "delivered",
    migrationSlice: "shell-content-defaults",
  }),
  domain("article", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.content.article",
    consumers: ["Post PageViewModel", "CollectionModel", "article renderer", "listing renderer"],
    status: "delivered",
    migrationSlice: "shell-content-defaults",
  }),
  domain("search", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.extensions.search",
    consumers: ["search generator", "search renderer", "browser search extension"],
    status: "delivered",
    migrationSlice: "extensions-services",
    parameterBags: ["search.algolia_search.<option>"]
  }),
  domain("comments", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.extensions.comments",
    consumers: ["Post PageViewModel", "comments renderer", "comment extensions"],
    status: "delivered",
    migrationSlice: "extensions-services",
    parameterBags: [
      "comments.beaudar.<option>", "comments.utterances.<option>", "comments.giscus.<option>",
      "comments.twikoo.<option>", "comments.waline.<option>", "comments.artalk.<option>"
    ]
  }),
  domain("footer", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.site.footer",
    consumers: ["PageViewModel", "sidebar footer renderer", "main footer renderer"],
    status: "delivered",
    migrationSlice: "shell-content-defaults",
    dynamicRecords: ["footer.social.<id>"]
  }),
  domain("tag_plugins", {
    sources: THEME_SOURCES,
    boundary: "record",
    runtimeTarget: "hexo.stellar.config.extensions.tags",
    consumers: ["tag renderers", "browser tag extensions"],
    status: "delivered",
    migrationSlice: "extensions-services",
  }),
  domain("dependencies", {
    sources: THEME_SOURCES,
    boundary: "record",
    runtimeTarget: "scripts/lib/extension-assets.js",
    consumers: ["head renderer", "script loader", "browser extension loader"],
    status: "delivered",
    migrationSlice: "extensions-services",
  }),
  domain("data_services", {
    sources: THEME_SOURCES,
    boundary: "record",
    runtimeTarget: "hexo.stellar.config.extensions.services",
    consumers: ["tag renderers", "browser data service loader"],
    status: "delivered",
    migrationSlice: "extensions-services",
  }),
  domain("data_cache", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.extensions.cache",
    consumers: ["browser request/cache client"],
    status: "delivered",
    migrationSlice: "extensions-services",
    dynamicRecords: ["data_cache.ttl.<service>"]
  }),
  domain("plugins", {
    sources: THEME_SOURCES,
    boundary: "record",
    runtimeTarget: "hexo.stellar.config.extensions.features",
    consumers: ["plugin renderer", "browser extension loader", "style compiler"],
    status: "delivered",
    migrationSlice: "extensions-services",
  }),
  domain("style", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.appearance",
    consumers: ["PageViewModel", "layout renderer", "Stylus compiler", "browser theme state"],
    status: "delivered",
    migrationSlice: "shell-content-defaults",
  }),
  domain("default", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.resources.fallbacks",
    consumers: ["PageViewModel", "tag renderers", "image fallback filters"],
    status: "delivered",
    migrationSlice: "shell-content-defaults",
  }),
  domain("api_host", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.extensions.services.github",
    consumers: ["tag renderers", "data service renderers"],
    status: "delivered",
    migrationSlice: "extensions-services",
  }),
  domain("system", {
    sources: THEME_SOURCES,
    owner: "internal",
    boundary: "sealed",
    runtimeTarget: "Hexo build integration",
    consumers: ["generateBefore config integration"],
    status: "excluded",
    migrationSlice: "root-seal",
  }),
  domain("inject", {
    sourceKind: "site_theme_override",
    sources: ["_config.stellar.yml"],
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.inject",
    consumers: ["head renderer", "script renderer", "PageViewModel"],
    status: "delivered",
    migrationSlice: "head-seo",
  }),
  domain("cache", {
    sourceKind: "site_theme_override",
    sources: ["_config.stellar.yml"],
    boundary: "sealed",
    runtimeTarget: "removed legacy input",
    consumers: ["generateBefore config integration"],
    status: "excluded",
    migrationSlice: "root-seal",
  }),
  domain("language_switcher", {
    sourceKind: "site_theme_override",
    sources: ["_config.stellar.yml"],
    boundary: "sealed",
    runtimeTarget: "removed legacy input",
    consumers: ["generateBefore config integration"],
    status: "excluded",
    migrationSlice: "root-seal",
  }),
  domain("collection", {
    sourceKind: "collection",
    sources: ["source/_data/wiki/*.yml", "source/_data/topic/*.yml", "source/_data/notebooks/*.yml"],
    boundary: "sealed",
    runtimeTarget: "CollectionModel",
    consumers: ["CollectionModel", "ContentItemModel", "PageViewModel"],
    status: "delivered",
    migrationSlice: "collection-front-matter",
    parameterBags: ["comments.options", "hero.background.effect.options"]
  }),
  domain("front_matter", {
    sourceKind: "front_matter",
    sources: ["source/_posts/**/*.md", "source/**/*.md"],
    boundary: "sealed",
    runtimeTarget: "ContentItemModel and PageViewModel",
    consumers: ["ContentItemModel", "PageViewModel", "Hexo core"],
    status: "delivered",
    migrationSlice: "collection-front-matter",
    parameterBags: ["comments.options", "seo.open_graph", "render.diagrams"]
  }),
  domain("hexo", {
    sourceKind: "hexo",
    sources: ["_config.yml", "Hexo runtime"],
    owner: "hexo",
    boundary: "external",
    runtimeTarget: "hexo.config",
    consumers: ["PageViewModel", "generators", "head renderer", "date formatter", "URL helpers"],
    status: "external",
    migrationSlice: "root-seal",
  }),
  domain("hexo_front_matter", {
    sourceKind: "front_matter",
    sources: ["source/_posts/**/*.md", "source/**/*.md"],
    owner: "hexo",
    boundary: "external",
    runtimeTarget: "Hexo page/post document fields",
    consumers: ["Hexo core", "ContentItemModel", "PageViewModel"],
    status: "external",
    migrationSlice: "root-seal",
  }),
  domain("theme_data", {
    sourceKind: "theme_data",
    sources: [
      "themes/stellar/_data/icons.yml", "themes/stellar/_data/widgets.yml",
      "source/_data/icons.yml", "source/_data/widgets.yml", "source/_data/authors.yml",
      "source/_data/links/*.yml", "source/_data/chat_users.yml",
      "source/_data/wiki.yml", "source/_data/topic.yml"
    ],
    boundary: "record",
    runtimeTarget: "hexo.stellar.data registered inputs",
    consumers: ["config merge", "Collection builders", "tag renderers", "widget renderers"],
    status: "delivered",
    targetStatus: "delivered",
    migrationSlice: "root-seal",
  }),
  domain("derived_runtime", {
    sourceKind: "derived",
    sources: ["generateBefore data builders"],
    owner: "internal",
    boundary: "derived",
    runtimeTarget: "hexo.stellar.data internal runtime",
    consumers: ["stellar_data helper", "generators", "ViewModel builders"],
    status: "derived",
    migrationSlice: "root-seal",
  })
]);

module.exports = {
  CONFIG_DOMAIN_CATALOG,
  CONFIG_MIGRATION_SLICES
};
