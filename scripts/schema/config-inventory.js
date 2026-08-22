/* global hexo */
"use strict";

const { deepFreeze } = require("./schema-utils");

function domain(id, options) {
  return {
    id,
    sourceKind: options.sourceKind || "theme",
    sources: options.sources,
    owner: options.owner || "stellar",
    boundary: options.boundary,
    finalPath: options.finalPath === undefined ? id : options.finalPath,
    runtimeTarget: options.runtimeTarget,
    consumers: options.consumers,
    status: options.status,
    migrationSlice: options.migrationSlice,
    fields: options.fields,
    ...(options.dynamicRecords ? { dynamicRecords: options.dynamicRecords } : {}),
    ...(options.parameterBags ? { parameterBags: options.parameterBags } : {}),
    ...(options.legacyMappings ? { legacyMappings: options.legacyMappings } : {})
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
    finalPath: null,
    runtimeTarget: "package.json",
    consumers: ["asset loader", "stellar_info helper"],
    status: "excluded",
    migrationSlice: "root-seal",
    fields: ["stellar.version", "stellar.homepage", "stellar.repo", "stellar.main_css", "stellar.main_js"]
  }),
  domain("preconnect", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.preconnect",
    consumers: ["head renderer"],
    status: "planned",
    migrationSlice: "head-seo",
    fields: ["preconnect[]"]
  }),
  domain("canonical", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.canonical",
    consumers: ["Post PageViewModel", "head renderer", "browser canonical check", "Reference generator"],
    status: "delivered",
    migrationSlice: "head-seo",
    fields: ["canonical.original_host", "canonical.official_hosts[]"]
  }),
  domain("open_graph", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.openGraph",
    consumers: ["Post PageViewModel", "head renderer"],
    status: "planned",
    migrationSlice: "head-seo",
    fields: ["open_graph.enable", "open_graph.twitter_id"]
  }),
  domain("structured_data", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.structuredData",
    consumers: ["Post PageViewModel", "json_ld helper"],
    status: "planned",
    migrationSlice: "head-seo",
    fields: ["structured_data.links[]"]
  }),
  domain("brand", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.brand",
    consumers: ["PageViewModel", "brand helper", "sidebar renderer"],
    status: "planned",
    migrationSlice: "shell-content-defaults",
    fields: [
      "brand.image.src", "brand.image.style", "brand.image.url", "brand.image.background",
      "brand.name", "brand.tagline", "brand.url"
    ]
  }),
  domain("menubar", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.menubar",
    consumers: ["PageViewModel", "menu renderer"],
    status: "planned",
    migrationSlice: "shell-content-defaults",
    fields: [
      "menubar.items[].id", "menubar.items[].theme", "menubar.items[].icon",
      "menubar.items[].title", "menubar.items[].url"
    ]
  }),
  domain("site_tree", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.siteTree",
    consumers: ["CollectionModel", "PageViewModel", "page generators", "sidebar renderer"],
    status: "planned",
    migrationSlice: "shell-content-defaults",
    fields: [
      "site_tree.<profile>.base_dir", "site_tree.<profile>.navigation.menu",
      "site_tree.<profile>.navigation.tabs.<title>", "site_tree.<profile>.sidebar.left.widgets[]",
      "site_tree.<profile>.sidebar.right.widgets[]", "site_tree.home.comments",
      "site_tree.error_page.404"
    ]
  }),
  domain("notebook", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.notebook",
    consumers: ["Notebook CollectionModel", "notebook builder"],
    status: "planned",
    migrationSlice: "shell-content-defaults",
    fields: [
      "notebook.listing.excerpt_length", "notebook.listing.per_page", "notebook.listing.order_by",
      "notebook.tag_icons.<tag>", "notebook.footer.license", "notebook.footer.share"
    ]
  }),
  domain("article", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.article",
    consumers: ["Post PageViewModel", "CollectionModel", "article renderer", "listing renderer"],
    status: "planned",
    migrationSlice: "shell-content-defaults",
    fields: [
      "article.pin_style", "article.type", "article.indent", "article.cover_ratio",
      "article.card_style", "article.banner_ratio", "article.auto_excerpt",
      "article.category_color.<category>", "article.ai_label.default",
      "article.ai_label.<level>.color", "article.ai_label.<level>.icon", "article.license",
      "article.share[]", "article.related_posts.enable", "article.related_posts.max_count",
      "article.reading_time", "article.card_tags", "article.tags"
    ]
  }),
  domain("search", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.extensions.search",
    consumers: ["search generator", "search renderer", "browser search extension"],
    status: "planned",
    migrationSlice: "extensions-services",
    fields: [
      "search.service", "search.local_search.field", "search.local_search.path",
      "search.local_search.content", "search.local_search.lazy_load",
      "search.local_search.cache_ttl", "search.local_search.skip_search[]",
      "search.algolia_search.*"
    ],
    parameterBags: ["search.algolia_search"]
  }),
  domain("comments", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.extensions.comments",
    consumers: ["Post PageViewModel", "comments renderer", "comment extensions"],
    status: "planned",
    migrationSlice: "extensions-services",
    fields: ["comments.service", "comments.title", "comments.custom_css", "comments.<service>.*"],
    parameterBags: [
      "comments.beaudar", "comments.utterances", "comments.giscus",
      "comments.twikoo", "comments.waline", "comments.artalk"
    ],
    legacyMappings: [{ from: "comments.comment_title", to: "comments.title" }]
  }),
  domain("footer", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.footer",
    consumers: ["PageViewModel", "sidebar footer renderer", "main footer renderer"],
    status: "planned",
    migrationSlice: "shell-content-defaults",
    fields: [
      "footer.social.<id>.type", "footer.social.<id>.icon", "footer.social.<id>.title",
      "footer.social.<id>.url", "footer.social.<id>.onclick", "footer.social.<id>.items[]",
      "footer.sitemap[]", "footer.content"
    ],
    dynamicRecords: ["footer.social.<id>"]
  }),
  domain("tag_plugins", {
    sources: THEME_SOURCES,
    boundary: "record",
    runtimeTarget: "hexo.stellar.config.extensions.tagPlugins",
    consumers: ["tag renderers", "browser tag extensions"],
    status: "planned",
    migrationSlice: "extensions-services",
    fields: ["tag_plugins.<extension>.*"],
    legacyMappings: [{ from: "tag_plugins.timeline.max-height", to: "tag_plugins.timeline.max_height" }]
  }),
  domain("dependencies", {
    sources: THEME_SOURCES,
    boundary: "record",
    runtimeTarget: "hexo.stellar.config.extensions.dependencies",
    consumers: ["head renderer", "script loader", "browser extension loader"],
    status: "planned",
    migrationSlice: "extensions-services",
    fields: ["dependencies.<dependency>.js", "dependencies.<dependency>.css", "dependencies.<dependency>.*"]
  }),
  domain("data_services", {
    sources: THEME_SOURCES,
    boundary: "record",
    runtimeTarget: "hexo.stellar.config.extensions.dataServices",
    consumers: ["tag renderers", "browser data service loader"],
    status: "planned",
    migrationSlice: "extensions-services",
    fields: ["data_services.<service>.js", "data_services.<service>.api", "data_services.<service>.*"],
    legacyMappings: [{ from: "data_services.download-file", to: "data_services.download_file" }]
  }),
  domain("data_cache", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.extensions.dataCache",
    consumers: ["browser request/cache client"],
    status: "planned",
    migrationSlice: "extensions-services",
    fields: ["data_cache.enable", "data_cache.default_ttl", "data_cache.ttl.<service>", "data_cache.max_entries"],
    dynamicRecords: ["data_cache.ttl.<service>"]
  }),
  domain("plugins", {
    sources: THEME_SOURCES,
    boundary: "record",
    runtimeTarget: "hexo.stellar.config.extensions.plugins",
    consumers: ["plugin renderer", "browser extension loader", "style compiler"],
    status: "planned",
    migrationSlice: "extensions-services",
    fields: ["plugins.<extension>.enable", "plugins.<extension>.js", "plugins.<extension>.css", "plugins.<extension>.*"]
  }),
  domain("style", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.style",
    consumers: ["PageViewModel", "layout renderer", "Stylus compiler", "browser theme state"],
    status: "planned",
    migrationSlice: "shell-content-defaults",
    fields: [
      "style.prefers_theme", "style.page_transition.enable", "style.font_size.*",
      "style.font_family.*", "style.text_align", "style.prefix.*", "style.border_radius.*",
      "style.corner_shape", "style.color.*", "style.animated_avatar.animate",
      "style.codeblock.*", "style.loading.*", "style.gradient.*", "style.leftbar.*",
      "style.error_page", "style.site.*", "style.header_prefix.*"
    ],
    legacyMappings: [
      { from: "style.font-size", to: "style.font_size" },
      { from: "style.font-family", to: "style.font_family" },
      { from: "style.text-align", to: "style.text_align" },
      { from: "style.border-radius", to: "style.border_radius" },
      { from: "style.border-radius.card-l", to: "style.border_radius.card_l" },
      { from: "style.border-radius.card-s", to: "style.border_radius.card_s" },
      { from: "style.border-radius.image-l", to: "style.border_radius.image_l" },
      { from: "style.border-radius.image-s", to: "style.border_radius.image_s" },
      { from: "style.corner-shape", to: "style.corner_shape" },
      { from: "style.leftbar.ui-style", to: "style.leftbar.ui_style" },
      { from: "style.leftbar.background-color-light", to: "style.leftbar.background_color_light" },
      { from: "style.leftbar.background-color-dark", to: "style.leftbar.background_color_dark" },
      { from: "style.leftbar.background-image", to: "style.leftbar.background_image" },
      { from: "style.leftbar.blur-px", to: "style.leftbar.blur_px" },
      { from: "style.leftbar.blur-bg", to: "style.leftbar.blur_bg" },
      { from: "style.leftbar.background-opacity", to: "style.leftbar.background_opacity" },
      { from: "style.site.blur-px", to: "style.site.blur_px" },
      { from: "style.site.blur-bg", to: "style.site.blur_bg" },
      { from: "style.site.blur-sat", to: "style.site.blur_sat" }
    ]
  }),
  domain("default", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.defaultAssets",
    consumers: ["PageViewModel", "tag renderers", "image fallback filters"],
    status: "planned",
    migrationSlice: "shell-content-defaults",
    fields: [
      "default.avatar", "default.link", "default.cover", "default.image",
      "default.project", "default.banner", "default.topic", "default.image_onerror"
    ]
  }),
  domain("api_host", {
    sources: THEME_SOURCES,
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.extensions.apiHost",
    consumers: ["tag renderers", "data service renderers"],
    status: "planned",
    migrationSlice: "extensions-services",
    fields: ["api_host.ghapi", "api_host.ghraw", "api_host.gist", "api_host.ghcard"]
  }),
  domain("system", {
    sources: THEME_SOURCES,
    owner: "internal",
    boundary: "sealed",
    finalPath: null,
    runtimeTarget: "Hexo build integration",
    consumers: ["generateBefore config integration"],
    status: "excluded",
    migrationSlice: "root-seal",
    fields: ["system.override_pretty_urls"]
  }),
  domain("inject", {
    sourceKind: "site_theme_override",
    sources: ["_config.stellar.yml"],
    boundary: "sealed",
    runtimeTarget: "hexo.stellar.config.inject",
    consumers: ["head renderer", "script renderer", "PageViewModel"],
    status: "planned",
    migrationSlice: "head-seo",
    fields: ["inject.head[]", "inject.script[]"]
  }),
  domain("cache", {
    sourceKind: "site_theme_override",
    sources: ["_config.stellar.yml"],
    boundary: "sealed",
    finalPath: null,
    runtimeTarget: "hexo.theme.config legacy compatibility",
    consumers: ["generateBefore config integration"],
    status: "excluded",
    migrationSlice: "root-seal",
    fields: ["cache.enable"]
  }),
  domain("language_switcher", {
    sourceKind: "site_theme_override",
    sources: ["_config.stellar.yml"],
    boundary: "sealed",
    finalPath: null,
    runtimeTarget: "hexo.theme.config legacy compatibility",
    consumers: ["generateBefore config integration"],
    status: "excluded",
    migrationSlice: "root-seal",
    fields: ["language_switcher.enable", "language_switcher.items[]"]
  }),
  domain("collection", {
    sourceKind: "collection",
    sources: ["source/_data/wiki/*.yml", "source/_data/topic/*.yml", "source/_data/notebooks/*.yml"],
    boundary: "sealed",
    runtimeTarget: "CollectionModel",
    consumers: ["CollectionModel", "ContentItemModel", "PageViewModel"],
    status: "partial",
    migrationSlice: "collection-front-matter",
    fields: [
      "name", "headline", "tagline", "description", "tags[]", "audience",
      "identity.icon", "card.*", "hero.*", "sidebar.*", "navigation.*", "article.*",
      "footer.*", "comments.*", "source.*", "routing.*", "listing.*", "note.*", "tree.*"
    ],
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
    fields: [
      "collection.*", "card.*", "banner.*", "sidebar.*", "navigation.*", "article.*",
      "footer.*", "comments.*", "visibility.*", "listing.*", "source.*",
      "robots", "open_graph.*", "katex", "mathjax", "mermaid", "inject.*"
    ],
    parameterBags: ["comments.<service>", "open_graph", "mermaid"]
  }),
  domain("hexo", {
    sourceKind: "hexo",
    sources: ["_config.yml", "Hexo runtime"],
    owner: "hexo",
    boundary: "external",
    finalPath: null,
    runtimeTarget: "hexo.config",
    consumers: ["PageViewModel", "generators", "head renderer", "date formatter", "URL helpers"],
    status: "external",
    migrationSlice: "root-seal",
    fields: [
      "title", "subtitle", "description", "keywords", "author", "email", "avatar", "url",
      "root", "language", "date_format", "per_page", "relative_link", "pretty_urls.*",
      "index_generator.path", "category_dir", "tag_dir", "archive_dir", "feed.path",
      "favicon", "highlight.*", "prismjs.*", "inject.head[]", "inject.script[]"
    ]
  }),
  domain("hexo_front_matter", {
    sourceKind: "front_matter",
    sources: ["source/_posts/**/*.md", "source/**/*.md"],
    owner: "hexo",
    boundary: "external",
    finalPath: null,
    runtimeTarget: "Hexo page/post document fields",
    consumers: ["Hexo core", "ContentItemModel", "PageViewModel"],
    status: "external",
    migrationSlice: "root-seal",
    fields: [
      "date", "updated", "title", "layout", "permalink", "published", "tags[]",
      "categories[]", "description", "excerpt", "photos[]", "sitemap", "keywords[]",
      "lang", "language", "abbrlink", "disableNunjucks"
    ]
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
    fields: [
      "icons.<id>", "widgets.<id>.*", "authors.<id>.*", "links.<group>[].*",
      "chat_users.<id>.*", "wiki[]", "topic.publish_list[]"
    ]
  }),
  domain("derived_runtime", {
    sourceKind: "derived",
    sources: ["generateBefore data builders"],
    owner: "internal",
    boundary: "derived",
    finalPath: null,
    runtimeTarget: "hexo.theme.config legacy bridge",
    consumers: ["legacy templates", "legacy generators", "ViewModel builders"],
    status: "derived",
    migrationSlice: "root-seal",
    fields: [
      "theme.config.icons", "theme.config.widgets", "theme.config.authors",
      "theme.config.default_author", "theme.config.links", "theme.config.chat_users",
      "theme.config.wiki", "theme.config.topic", "theme.config.notebooks"
    ]
  })
]);

module.exports = {
  CONFIG_DOMAIN_CATALOG,
  CONFIG_MIGRATION_SLICES
};
