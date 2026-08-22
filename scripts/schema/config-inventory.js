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
    targetStatus: deliveredTargetStatus(CONFIG_DOMAIN_TARGETS[id]),
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
    runtimeTarget: "hexo.stellar.config.notebook",
    consumers: ["Notebook CollectionModel", "notebook builder"],
    status: "planned",
    migrationSlice: "shell-content-defaults",
  }),
  domain("article", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.article",
    consumers: ["Post PageViewModel", "CollectionModel", "article renderer", "listing renderer"],
    status: "planned",
    migrationSlice: "shell-content-defaults",
  }),
  domain("search", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.extensions.search",
    consumers: ["search generator", "search renderer", "browser search extension"],
    status: "planned",
    migrationSlice: "extensions-services",
    parameterBags: ["search.algolia_search"]
  }),
  domain("comments", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.extensions.comments",
    consumers: ["Post PageViewModel", "comments renderer", "comment extensions"],
    status: "planned",
    migrationSlice: "extensions-services",
    parameterBags: [
      "comments.beaudar", "comments.utterances", "comments.giscus",
      "comments.twikoo", "comments.waline", "comments.artalk"
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
    runtimeTarget: "hexo.stellar.config.extensions.tagPlugins",
    consumers: ["tag renderers", "browser tag extensions"],
    status: "planned",
    migrationSlice: "extensions-services",
  }),
  domain("dependencies", {
    sources: THEME_SOURCES,
    boundary: "record",
    runtimeTarget: "hexo.stellar.config.extensions.dependencies",
    consumers: ["head renderer", "script loader", "browser extension loader"],
    status: "planned",
    migrationSlice: "extensions-services",
  }),
  domain("data_services", {
    sources: THEME_SOURCES,
    boundary: "record",
    runtimeTarget: "hexo.stellar.config.extensions.dataServices",
    consumers: ["tag renderers", "browser data service loader"],
    status: "planned",
    migrationSlice: "extensions-services",
  }),
  domain("data_cache", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.extensions.dataCache",
    consumers: ["browser request/cache client"],
    status: "planned",
    migrationSlice: "extensions-services",
    dynamicRecords: ["data_cache.ttl.<service>"]
  }),
  domain("plugins", {
    sources: THEME_SOURCES,
    boundary: "record",
    runtimeTarget: "hexo.stellar.config.extensions.plugins",
    consumers: ["plugin renderer", "browser extension loader", "style compiler"],
    status: "planned",
    migrationSlice: "extensions-services",
  }),
  domain("style", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.style",
    consumers: ["PageViewModel", "layout renderer", "Stylus compiler", "browser theme state"],
    status: "planned",
    migrationSlice: "shell-content-defaults",
  }),
  domain("default", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.defaultAssets",
    consumers: ["PageViewModel", "tag renderers", "image fallback filters"],
    status: "planned",
    migrationSlice: "shell-content-defaults",
  }),
  domain("api_host", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.extensions.apiHost",
    consumers: ["tag renderers", "data service renderers"],
    status: "planned",
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
    runtimeTarget: "hexo.theme.config legacy compatibility",
    consumers: ["generateBefore config integration"],
    status: "excluded",
    migrationSlice: "root-seal",
  }),
  domain("language_switcher", {
    sourceKind: "site_theme_override",
    sources: ["_config.stellar.yml"],
    boundary: "sealed",
    runtimeTarget: "hexo.theme.config legacy compatibility",
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
    status: "partial",
    migrationSlice: "collection-front-matter",
    parameterBags: ["comments.<service>", "hero.background.effect.options"]
  }),
  domain("front_matter", {
    sourceKind: "front_matter",
    sources: ["source/_posts/**/*.md", "source/**/*.md"],
    boundary: "sealed",
    runtimeTarget: "ContentItemModel and PageViewModel",
    consumers: ["ContentItemModel", "PageViewModel", "Hexo core"],
    status: "partial",
    migrationSlice: "collection-front-matter",
    parameterBags: ["comments.<service>", "open_graph", "mermaid"]
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
    runtimeTarget: "normalized data inputs",
    consumers: ["config merge", "Collection builders", "tag renderers", "widget renderers"],
    status: "planned",
    migrationSlice: "root-seal",
  }),
  domain("derived_runtime", {
    sourceKind: "derived",
    sources: ["generateBefore data builders"],
    owner: "internal",
    boundary: "derived",
    runtimeTarget: "hexo.theme.config legacy bridge",
    consumers: ["legacy templates", "legacy generators", "ViewModel builders"],
    status: "derived",
    migrationSlice: "root-seal",
  })
]);

module.exports = {
  CONFIG_DOMAIN_CATALOG,
  CONFIG_MIGRATION_SLICES
};
