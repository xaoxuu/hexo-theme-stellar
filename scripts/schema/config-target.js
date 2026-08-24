/* global hexo */
"use strict";

const { deepFreeze } = require("./schema-utils");

const THEME_SCOPE = Object.freeze(["theme"]);
const COLLECTION_SCOPE = Object.freeze(["collection"]);
const FRONT_MATTER_SCOPE = Object.freeze(["front_matter"]);
const THEME_CASCADE = Object.freeze(["schema default", "_config.stellar.yml"]);
const COLLECTION_CASCADE = Object.freeze(["schema default", "theme profile", "collection"]);
const FRONT_MATTER_CASCADE = Object.freeze(["schema default", "theme profile", "collection", "front matter"]);
const DELIVERED_TARGET_PATHS = new Set([
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
  "inject.script",
  "content.article.type",
  "content.article.indent",
  "content.article.listing.pinned_layout",
  "content.article.listing.card_layout",
  "content.article.listing.cover_ratio",
  "content.article.listing.excerpt_length",
  "content.article.listing.show_tags",
  "content.article.banner.ratio",
  "content.article.category_colors",
  "content.article.category_colors.<category>",
  "content.article.ai_label.default",
  "content.article.ai_label.<level>.color",
  "content.article.ai_label.<level>.icon",
  "content.article.footer.license",
  "content.article.footer.share",
  "content.article.related_posts.enabled",
  "content.article.related_posts.limit",
  "content.article.show_reading_time",
  "content.article.show_tags",
  "content.notebook.listing.excerpt_length",
  "content.notebook.listing.per_page",
  "content.notebook.listing.order_by",
  "content.notebook.tag_icons",
  "content.notebook.tag_icons.<tag>",
  "content.notebook.footer.license",
  "content.notebook.footer.share",
  "appearance.color_scheme",
  "appearance.typography.font_size.root",
  "appearance.typography.font_size.inline_code",
  "appearance.typography.font_size.code_block",
  "appearance.typography.font_family.body",
  "appearance.typography.font_family.inline_code",
  "appearance.typography.font_family.code_block",
  "appearance.typography.text_align",
  "appearance.typography.heading_prefixes",
  "appearance.typography.heading_prefixes.h2",
  "appearance.typography.heading_prefixes.h3",
  "appearance.typography.heading_prefixes.h4",
  "appearance.typography.heading_prefixes.h5",
  "appearance.shape.corner",
  "appearance.shape.radius.card_large",
  "appearance.shape.radius.card",
  "appearance.shape.radius.card_small",
  "appearance.shape.radius.bar",
  "appearance.shape.radius.image_large",
  "appearance.shape.radius.image",
  "appearance.shape.radius.image_small",
  "appearance.colors.theme",
  "appearance.colors.accent",
  "appearance.colors.link",
  "appearance.gradients.primary_action",
  "appearance.gradients.search_bar",
  "appearance.gradients.avatar_ring",
  "appearance.gradients.angle",
  "appearance.motion.page_transition",
  "appearance.motion.avatar",
  "appearance.code_block.scrollbar_width",
  "appearance.code_block.highlight_theme",
  "appearance.backgrounds.sidebar.surface",
  "appearance.backgrounds.sidebar.color.light",
  "appearance.backgrounds.sidebar.color.dark",
  "appearance.backgrounds.sidebar.image",
  "appearance.backgrounds.sidebar.opacity",
  "appearance.backgrounds.sidebar.blur.radius",
  "appearance.backgrounds.sidebar.blur.overlay",
  "appearance.backgrounds.page.image",
  "appearance.backgrounds.page.blur.radius",
  "appearance.backgrounds.page.blur.overlay",
  "appearance.backgrounds.page.blur.saturation",
  "resources.fallbacks.avatar",
  "resources.fallbacks.link_card",
  "resources.fallbacks.cover",
  "resources.fallbacks.project_icon",
  "resources.fallbacks.banner",
  "resources.fallbacks.topic_cover",
  "resources.fallbacks.image.content",
  "resources.fallbacks.image.tag_plugin",
  "resources.fallbacks.error_page"
]);

const TAG_PLUGIN_IMAGE_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2rem' height='2rem' viewBox='0 0 24 24'%3E%3C!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --%3E%3Cpath fill='%23F44336' d='M22 12.698c-.002 1.47-.013 2.718-.096 3.743c-.097 1.19-.296 2.184-.74 3.009a4.2 4.2 0 0 1-.73.983c-.833.833-1.893 1.21-3.237 1.39C15.884 22 14.2 22 12.053 22h-.106c-2.148 0-3.83 0-5.144-.177c-1.343-.18-2.404-.557-3.236-1.39c-.738-.738-1.12-1.656-1.322-2.795c-.2-1.12-.236-2.512-.243-4.241Q1.999 12.737 2 12v-.054c0-2.148 0-3.83.177-5.144c.18-1.343.557-2.404 1.39-3.236s1.893-1.21 3.236-1.39c1.168-.157 2.67-.175 4.499-.177a.697.697 0 1 1 0 1.396c-1.855.002-3.234.018-4.313.163c-1.189.16-1.906.464-2.436.994S3.72 5.8 3.56 6.99C3.397 8.2 3.395 9.788 3.395 12v.784l.932-.814a2.14 2.14 0 0 1 2.922.097l3.99 3.99a1.86 1.86 0 0 0 2.385.207l.278-.195a2.79 2.79 0 0 1 3.471.209l2.633 2.37c.265-.557.423-1.288.507-2.32c.079-.972.09-2.152.091-3.63a.698.698 0 0 1 1.396 0' opacity='.5'/%3E%3Cpath fill='%23F44336' fill-rule='evenodd' d='M17.5 11c-2.121 0-3.182 0-3.841-.659S13 8.621 13 6.5s0-3.182.659-3.841S15.379 2 17.5 2s3.182 0 3.841.659S22 4.379 22 6.5s0 3.182-.659 3.841S19.621 11 17.5 11m-1.47-7.03a.75.75 0 1 0-1.06 1.06l1.47 1.47l-1.47 1.47a.75.75 0 0 0 1.06 1.06l1.47-1.47l1.47 1.47a.75.75 0 1 0 1.06-1.06L18.56 6.5l1.47-1.47a.75.75 0 0 0-1.06-1.06L17.5 5.44z' clip-rule='evenodd'/%3E%3C/svg%3E";

function literal(value) {
  return { kind: "literal", value };
}

function derived(...sources) {
  return { kind: "derived", sources };
}

function registered(owner) {
  return { kind: "registered", owner };
}

function runtimePath(path) {
  return path.split(".").map(segment => {
    if (segment.startsWith("<")) return segment;
    return segment.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }).join(".");
}

function targetField(path, options) {
  const scopes = options.scopes || THEME_SCOPE;
  const types = Array.isArray(options.type) ? options.type : [options.type];
  const boundary = options.boundary || "sealed";
  const hasMergeableUnion = types.length > 1 && (types.includes("array") || types.includes("object"));
  return {
    path,
    type: types,
    default: options.default,
    scopes,
    cascade: options.cascade || (scopes === THEME_SCOPE ? THEME_CASCADE : (scopes.length === 1 && scopes[0] === "collection" ? COLLECTION_CASCADE : FRONT_MATTER_CASCADE)),
    normalization: options.normalization || "validate the declared type; preserve the value; deep-freeze the result",
    mergeStrategy: options.mergeStrategy || (hasMergeableUnion ? "by_value_type" : (types.includes("array") ? "replace" : (types.includes("object") ? (boundary === "parameter_bag" ? "merge_keys" : "merge_declared_keys") : "replace"))),
    runtimePath: options.runtimePath || runtimePath(path),
    consumers: options.consumers,
    migration: options.migration || `configuration/${path.split(".")[0]}`,
    status: options.status || (scopes.includes("theme") && DELIVERED_TARGET_PATHS.has(path) ? "delivered" : "planned"),
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

const CONFIG_TARGET_ROOTS = deepFreeze([
  { id: "site", owner: "stellar", boundary: "sealed", status: "delivered", purpose: "站点身份、菜单和 Footer 外壳" },
  { id: "seo", owner: "stellar", boundary: "sealed", status: "delivered", purpose: "canonical、Open Graph 与结构化数据" },
  { id: "layout", owner: "stellar", boundary: "sealed", status: "delivered", purpose: "页面 Profile 的路由、导航与侧边栏默认值" },
  { id: "content", owner: "stellar", boundary: "sealed", status: "delivered", purpose: "Article 与 Notebook 内容默认值" },
  { id: "appearance", owner: "stellar", boundary: "sealed", status: "delivered", purpose: "Visual Style 语义令牌" },
  { id: "resources", owner: "stellar", boundary: "sealed", status: "delivered", purpose: "连接提示与资源兜底" },
  { id: "extensions", owner: "stellar", boundary: "sealed", status: "delivered", purpose: "搜索、评论、标签、特性、服务与缓存" },
  { id: "inject", owner: "stellar", boundary: "sealed", status: "delivered", purpose: "可信原文注入逃生口" }
]);

const SITE_CONSUMERS = Object.freeze(["PageViewModel", "Shell renderer", "menu renderer", "footer renderer"]);
const SEO_CONSUMERS = Object.freeze(["PageViewModel", "head renderer", "JSON-LD helper", "browser canonical check"]);
const LAYOUT_CONSUMERS = Object.freeze(["CollectionModel", "PageViewModel", "page generators", "navigation renderer", "sidebar renderer", "Reference generator"]);
const CONTENT_CONSUMERS = Object.freeze(["CollectionModel", "PageViewModel", "article renderer", "listing renderer"]);
const APPEARANCE_CONSUMERS = Object.freeze(["PageViewModel", "layout renderer", "Stylus compiler", "browser theme state"]);
const RESOURCE_CONSUMERS = Object.freeze(["head renderer", "PageViewModel", "tag renderers", "image fallback filters"]);
const EXTENSION_CONSUMERS = Object.freeze(["Extension registry", "Extension renderer", "browser Extension runtime", "Reference generator"]);
const INJECT_CONSUMERS = Object.freeze(["head renderer", "script renderer", "PageViewModel"]);

const CONTENT_OVERRIDE_DEFINITIONS = [
  ["card", "object", derived("theme profile card"), { boundary: "sealed" }],
  ["card.cover", ["string", "null"], derived("theme or collection card.cover")],
  ["card.tagline", ["string", "null"], derived("theme or collection card.tagline")],
  ["sidebar", "object", derived("theme profile sidebar"), { boundary: "sealed" }],
  ["sidebar.left.widgets", "array", derived("theme or collection left widgets"), { items: { type: ["string", "object"], boundary: "parameter_bag" } }],
  ["sidebar.right.widgets", "array", derived("theme or collection right widgets"), { items: { type: ["string", "object"], boundary: "parameter_bag" } }],
  ["sidebar.left.search", ["boolean", "object"], derived("theme or collection search"), { boundary: "sealed" }],
  ["sidebar.left.search.filter", ["string", "null"], literal(null)],
  ["sidebar.left.search.placeholder", ["string", "null"], literal(null)],
  ["sidebar.left.menu", ["boolean", "null"], literal(null)],
  ["sidebar.left.brand", ["object", "null"], literal(null), { boundary: "registered_schema" }],
  ["sidebar.left.wiki_home", ["boolean", "null"], literal(null)],
  ["navigation", "object", derived("theme profile navigation"), { boundary: "sealed" }],
  ["navigation.menu", ["string", "null"], literal(null)],
  ["navigation.breadcrumb", ["boolean", "null"], literal(null)],
  ["article", "object", derived("content.article"), { boundary: "sealed" }],
  ["article.type", ["string", "null"], literal(null), { values: ["tech", "story"] }],
  ["article.indent", ["boolean", "null"], literal(null)],
  ["article.author", ["string", "null"], literal(null)],
  ["article.ai_label", ["string", "null"], literal(null)],
  ["footer", "object", derived("content defaults footer"), { boundary: "sealed" }],
  ["footer.references", "array", literal([]), { items: { type: ["object", "string"] } }],
  ["footer.license", ["boolean", "string", "null"], literal(null)],
  ["footer.share", ["boolean", "null"], literal(null)],
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
  ["listing.sort", ["number", "null"], literal(null)],
  ["listing.excerpt_length", ["number", "null"], literal(null), { minimum: 0 }],
  ["listing.per_page", ["number", "null"], literal(null), { minimum: 0 }],
  ["listing.order_by", ["string", "null"], literal(null)],
  ["note_defaults", "object", literal({}), { boundary: "sealed" }],
  ["note_defaults.sidebar", "object", literal({}), { boundary: "registered_schema" }],
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
  ["inject.head", "string", literal("")],
  ["inject.script", "string", literal("")]
];

const PROFILE_IDS = deepFreeze([
  "home", "blog_index", "topic_index", "wiki_index", "post", "topic", "wiki",
  "notebook_index", "note_index", "note", "author", "error", "page"
]);

const PROFILE_ID_MIGRATIONS = deepFreeze({
  home: "home",
  index_blog: "blog_index",
  index_topic: "topic_index",
  index_wiki: "wiki_index",
  post: "post",
  topic: "topic",
  wiki: "wiki",
  notebooks: "notebook_index",
  notes: "note_index",
  note: "note",
  author: "author",
  error_page: "error",
  page: "page"
});

const LAYOUT_PROFILE_DEFAULTS = deepFreeze({
  home: {
    path: null,
    activeMenu: "post",
    tabs: [],
    leftWidgets: ["welcome", "recent"],
    rightWidgets: []
  },
  blog_index: {
    path: "/blog/",
    activeMenu: "post",
    tabs: [],
    leftWidgets: ["welcome", "recent"],
    rightWidgets: []
  },
  topic_index: {
    path: "/topic/",
    activeMenu: "post",
    tabs: [],
    leftWidgets: ["welcome", "recent"],
    rightWidgets: []
  },
  wiki_index: {
    path: "/wiki/",
    activeMenu: "wiki",
    tabs: [],
    leftWidgets: ["related", "recent"],
    rightWidgets: []
  },
  post: {
    path: null,
    activeMenu: "post",
    tabs: [],
    leftWidgets: ["related", "recent"],
    rightWidgets: ["ghrepo", "toc"]
  },
  topic: {
    path: null,
    activeMenu: "post",
    tabs: [],
    leftWidgets: ["related", "recent"],
    rightWidgets: ["ghrepo", "toc"]
  },
  wiki: {
    path: null,
    activeMenu: "wiki",
    tabs: [],
    leftWidgets: ["tree", "related", "recent"],
    rightWidgets: ["ghrepo", "toc"]
  },
  notebook_index: {
    path: "/notebooks/",
    activeMenu: "notebooks",
    tabs: [],
    leftWidgets: ["recent"],
    rightWidgets: []
  },
  note_index: {
    path: null,
    activeMenu: "notebooks",
    tabs: [],
    leftWidgets: ["tagtree", "recent"],
    rightWidgets: []
  },
  note: {
    path: null,
    activeMenu: "notebooks",
    tabs: [],
    leftWidgets: ["tagtree", "recent"],
    rightWidgets: ["toc"]
  },
  author: {
    path: "/author/",
    activeMenu: "post",
    tabs: [],
    leftWidgets: ["recent"],
    rightWidgets: []
  },
  error: {
    path: "/404.html",
    activeMenu: "post",
    tabs: [],
    leftWidgets: ["recent"],
    rightWidgets: []
  },
  page: {
    path: null,
    activeMenu: "post",
    tabs: [],
    leftWidgets: ["recent"],
    rightWidgets: ["toc"]
  }
});

const TAG_EXTENSION_IDS = deepFreeze([
  "note", "checkbox", "quot", "emoji", "icon", "button", "image",
  "timeline", "mark", "hashtag", "okr", "gallery", "chat"
]);

const FEATURE_EXTENSION_IDS = deepFreeze([
  "lazy_loading", "preload", "lightbox", "reveal", "ai_summary", "math", "diagrams",
  "code_copy", "adaptive_text", "card_hover", "cjk_typography"
]);

const FEATURE_ID_MIGRATIONS = deepFreeze({
  preload: "preload",
  fancybox: "lightbox",
  swiper: null,
  scrollreveal: "reveal",
  tianli_gpt: "ai_summary",
  katex: "math",
  mathjax: "math",
  mermaid: "diagrams",
  copycode: "code_copy",
  adaptive_text: "adaptive_text",
  card_hover: "card_hover",
  heti: "cjk_typography"
});

const SERVICE_ID_MIGRATIONS = deepFreeze({
  siteinfo: "site_info",
  rating: "rating",
  vote: "vote",
  contributors: "contributors",
  ghinfo: "github"
});

const CONFIG_INTERNALIZED_RESOURCES = deepFreeze([
  "stellar.{version,homepage,repo,main_css,main_js}",
  "dependencies.marked",
  "dependencies.<official_dependency>.{js,css}",
  "plugins.<official_extension>.{js,css,inject}",
  "data_services.<official_service>.js",
  "comments.custom_css",
  "extensions.features.{preload,lightbox,reveal,ai_summary,diagrams}.provider",
  "extensions.features.ai_summary.interface.version",
  "extensions.cache.*",
  "style.loading.*",
  "system.override_pretty_urls"
]);

function layoutProfileFields() {
  const pathProfiles = new Set(["blog_index", "topic_index", "wiki_index", "notebook_index", "author", "error"]);
  const tabProfiles = new Set(["blog_index", "wiki_index"]);
  const definitions = [
    ["layout.profiles", "object", literal({}), { boundary: "sealed", status: "delivered" }]
  ];
  for (const profile of PROFILE_IDS) {
    const defaults = LAYOUT_PROFILE_DEFAULTS[profile];
    const base = `layout.profiles.${profile}`;
    if (pathProfiles.has(profile)) {
      definitions.push([
        `${base}.path`,
        "string",
        literal(defaults.path),
        {
          normalization: "normalize to a root-relative path; directory paths end with a slash",
          status: "delivered"
        }
      ]);
    }
    definitions.push(
      [`${base}.navigation.active_menu`, ["string", "null"], literal(defaults.activeMenu), { status: "delivered" }],
      [
        `${base}.sidebar.left`,
        "array",
        literal(defaults.leftWidgets),
        { items: { type: ["string", "object"], boundary: "registered_schema" }, status: "delivered" }
      ],
      [
        `${base}.sidebar.right`,
        "array",
        literal(defaults.rightWidgets),
        { items: { type: ["string", "object"], boundary: "registered_schema" }, status: "delivered" }
      ]
    );
    if (tabProfiles.has(profile)) {
      definitions.push(
        [`${base}.navigation.tabs`, "array", literal(defaults.tabs), { items: { type: ["object"] }, status: "delivered" }],
        [`${base}.navigation.tabs[].title`, "string", literal(""), { status: "delivered" }],
        [`${base}.navigation.tabs[].url`, "string", literal(""), { status: "delivered" }]
      );
    }
  }
  definitions.push(
    ["layout.profiles.home.comments", "object", literal({ enabled: false, title: null, id: null, provider: null, options: {} }), {
      boundary: "sealed",
      normalization: "merge declared child fields; deep-freeze the normalized JavaScript object",
      status: "delivered"
    }],
    ["layout.profiles.home.comments.enabled", "boolean", literal(false), { status: "delivered" }],
    ["layout.profiles.home.comments.title", ["string", "null"], literal(null), { status: "delivered" }],
    ["layout.profiles.home.comments.id", ["string", "null"], literal(null), { status: "delivered" }],
    ["layout.profiles.home.comments.provider", ["string", "null"], literal(null), {
      values: [null, "beaudar", "utterances", "giscus", "twikoo", "waline", "artalk"],
      status: "delivered"
    }],
    ["layout.profiles.home.comments.options", "object", literal({}), { boundary: "parameter_bag", status: "delivered" }]
  );
  return fields(LAYOUT_CONSUMERS, definitions);
}

const CONFIG_TARGET_FIELDS = deepFreeze([
  ...fields(SITE_CONSUMERS, [
    ["site.brand.image.src", ["string", "null"], derived("hexo.config.avatar")],
    ["site.brand.image.variant", "string", literal("avatar"), { values: ["avatar", "icon", "plain"] }],
    ["site.brand.image.href", ["string", "null"], literal(null)],
    ["site.brand.name", ["string", "null"], derived("hexo.config.title")],
    ["site.brand.wordmark", ["string", "null"], literal(null)],
    ["site.brand.tagline.text", ["string", "null"], derived("hexo.config.subtitle")],
    ["site.brand.tagline.hover", ["string", "null"], literal(null)],
    ["site.brand.href", ["string", "null"], literal("/")],
    ["site.menu.items", "array", literal([]), { items: { type: ["object"] } }],
    ["site.menu.items[].id", "string", derived("site menu item")],
    ["site.menu.items[].title", "string", literal("")],
    ["site.menu.items[].icon", ["string", "null"], literal(null)],
    ["site.menu.items[].url", "string", literal("")],
    ["site.menu.items[].accent", ["string", "null"], literal(null)],
    ["site.footer.actions", "array", literal([]), { items: { type: ["object"] } }],
    ["site.footer.actions[].type", "string", derived("footer action"), { values: ["link", "dropdown", "spacer"] }],
    ["site.footer.actions[].icon", ["string", "null"], literal(null)],
    ["site.footer.actions[].title", "string", literal("")],
    ["site.footer.actions[].url", ["string", "null"], literal(null)],
    ["site.footer.actions[].items", "array", literal([]), { items: { type: ["object"] } }],
    ["site.footer.actions[].items[].icon", ["string", "null"], literal(null)],
    ["site.footer.actions[].items[].title", "string", literal("")],
    ["site.footer.actions[].items[].url", "string", literal("")],
    ["site.footer.sections", "array", literal([]), { items: { type: ["object"] } }],
    ["site.footer.sections[].title", "string", literal("")],
    ["site.footer.sections[].items", "array", literal([]), { items: { type: ["object"] } }],
    ["site.footer.sections[].items[].title", "string", literal("")],
    ["site.footer.sections[].items[].url", "string", literal("")],
    ["site.footer.content", "string", literal("本站由 [{author.name}](/) 使用 [{theme.name} {theme.version}]({theme.tree}) 主题创建。")]
  ]),
  ...fields(SEO_CONSUMERS, [
    ["seo.canonical.host", ["string", "null"], literal(null), { normalization: "trim; remove scheme and trailing slash; null disables canonical output" }],
    ["seo.canonical.allowed_hosts", "array", literal(["localhost"]), { items: { type: ["string"] }, normalization: "trim hosts; remove empty values; stable-deduplicate; replace on site override" }],
    ["seo.open_graph.enabled", "boolean", literal(true)],
    ["seo.open_graph.twitter_id", ["string", "null"], literal(null)],
    ["seo.structured_data.same_as", "array", literal([]), { items: { type: ["string"] }, normalization: "trim URLs; remove empty values; stable-deduplicate; replace on site override" }]
  ]),
  ...layoutProfileFields(),
  ...fields(CONTENT_CONSUMERS, [
    ["content.article.type", "string", literal("tech"), { values: ["tech", "story"] }],
    ["content.article.indent", ["boolean", "null"], literal(null)],
    ["content.article.listing.pinned_layout", "string", literal("carousel"), { values: ["carousel", "flat"] }],
    ["content.article.listing.card_layout", "string", literal("hero"), { values: ["hero", "classic"] }],
    ["content.article.listing.cover_ratio", "number", literal(2), { exclusiveMinimum: 0 }],
    ["content.article.listing.excerpt_length", "number", literal(128), { minimum: 0 }],
    ["content.article.listing.show_tags", "boolean", literal(false)],
    ["content.article.banner.ratio", "number", literal(2.5), { exclusiveMinimum: 0 }],
    ["content.article.category_colors", "object", literal({ "探索号": "#f44336" }), { boundary: "record" }],
    ["content.article.category_colors.<category>", "string", derived("current category color map")],
    ["content.article.ai_label.default", ["string", "null"], literal(null)],
    ["content.article.ai_label.<level>.color", "string", derived("current AI label palette")],
    ["content.article.ai_label.<level>.icon", ["string", "null"], literal(null)],
    ["content.article.footer.license", ["boolean", "string"], literal("本文采用 [署名-非商业性使用-相同方式共享 4.0 国际](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可协议，转载请注明出处。")],
    ["content.article.footer.share", ["boolean", "array"], literal(false), { items: { type: ["string"] } }],
    ["content.article.related_posts.enabled", "boolean", literal(false)],
    ["content.article.related_posts.limit", "number", literal(5), { minimum: 0 }],
    ["content.article.show_reading_time", "boolean", literal(false)],
    ["content.article.show_tags", "boolean", literal(true)],
    ["content.notebook.listing.excerpt_length", "number", literal(128), { minimum: 0 }],
    ["content.notebook.listing.per_page", ["number", "null"], literal(null), { minimum: 0 }],
    ["content.notebook.listing.order_by", "string", literal("-updated")],
    ["content.notebook.tag_icons", "object", literal({ "": "quot:hashtag" }), { boundary: "record" }],
    ["content.notebook.tag_icons.<tag>", "string", derived("current notebook tag icon map")],
    ["content.notebook.footer.license", "boolean", literal(false)],
    ["content.notebook.footer.share", "boolean", literal(false)]
  ]),
  ...fields(APPEARANCE_CONSUMERS, [
    ["appearance.color_scheme", "string", literal("auto"), { values: ["auto", "light", "dark"] }],
    ["appearance.typography.font_size.root", "string", literal("16px")],
    ["appearance.typography.font_size.inline_code", "string", literal("85%")],
    ["appearance.typography.font_size.code_block", "string", literal("0.8125rem")],
    ["appearance.typography.font_family.body", "string", literal("system-ui, \"Microsoft Yahei\", \"Segoe UI\", Arial, sans-serif")],
    ["appearance.typography.font_family.inline_code", "string", literal("Menlo, Monaco, Consolas, system-ui, monospace, sans-serif")],
    ["appearance.typography.font_family.code_block", "string", literal("Menlo, Monaco, Consolas, system-ui, monospace, sans-serif")],
    ["appearance.typography.text_align", "string", literal("left")],
    ["appearance.typography.heading_prefixes", "object", literal({ h2: "#", h3: "=", h4: "|", h5: ":" }), { boundary: "sealed" }],
    ["appearance.typography.heading_prefixes.h2", "string", literal("#")],
    ["appearance.typography.heading_prefixes.h3", "string", literal("=")],
    ["appearance.typography.heading_prefixes.h4", "string", literal("|")],
    ["appearance.typography.heading_prefixes.h5", "string", literal(":")],
    ["appearance.shape.corner", "string", literal("superellipse(1.25)")],
    ["appearance.shape.radius.card_large", "string", literal("24px")],
    ["appearance.shape.radius.card", "string", literal("16px")],
    ["appearance.shape.radius.card_small", "string", literal("12px")],
    ["appearance.shape.radius.bar", "string", literal("12px")],
    ["appearance.shape.radius.image_large", "string", literal("24px")],
    ["appearance.shape.radius.image", "string", literal("16px")],
    ["appearance.shape.radius.image_small", "string", literal("8px")],
    ["appearance.colors.theme", "string", literal("hsl(192 98% 55%)")],
    ["appearance.colors.accent", "string", literal("hsl(14 100% 57%)")],
    ["appearance.colors.link", "string", literal("hsl(207 90% 54%)")],
    ["appearance.gradients.primary_action", "string", literal("linear-gradient(to right, hsl(215, 95%, 64%), hsl(195, 95%, 60%), hsl(165, 95%, 56%), hsl(165, 95%, 56%), hsl(195 95% 60%), hsl(215, 95%, 64%))")],
    ["appearance.gradients.search_bar", "string", literal("linear-gradient(to right, #04f3ff, #08ffc6, #ddf730, #ffbd19, #ff1fe0, #c418ff, #3b5bff, #04f3ff)")],
    ["appearance.gradients.avatar_ring", "string", literal("conic-gradient(from 0deg, #04f3ff, #08ffc6, #ddf730, #ffbd19, #ff1fe0, #c418ff, #3b5bff, #04f3ff)")],
    ["appearance.gradients.angle", "string", literal("210deg")],
    ["appearance.motion.page_transition", "boolean", literal(true)],
    ["appearance.motion.avatar", "string", literal("auto"), { values: ["auto", "always", "never"] }],
    ["appearance.code_block.scrollbar_width", "string", literal("4px")],
    ["appearance.code_block.highlight_theme", ["string", "null"], literal("https://gcore.jsdelivr.net/gh/highlightjs/cdn-release@11.9/build/styles/atom-one-dark.min.css")],
    ["appearance.backgrounds.sidebar.surface", "string", literal("card"), { values: ["glass", "card"] }],
    ["appearance.backgrounds.sidebar.color.light", "string", literal("var(--card)")],
    ["appearance.backgrounds.sidebar.color.dark", "string", literal("var(--card)")],
    ["appearance.backgrounds.sidebar.image", ["string", "null"], literal("url(https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.13/image/sidebar-bg1@small.jpg)")],
    ["appearance.backgrounds.sidebar.opacity", "number", literal(0.8), { minimum: 0, maximum: 1 }],
    ["appearance.backgrounds.sidebar.blur.radius", "string", literal("100px")],
    ["appearance.backgrounds.sidebar.blur.overlay", "string", literal("var(--bg-a60)")],
    ["appearance.backgrounds.page.image", ["string", "null"], literal(null)],
    ["appearance.backgrounds.page.blur.radius", "string", literal("100px")],
    ["appearance.backgrounds.page.blur.overlay", "string", literal("var(--bg-a75)")],
    ["appearance.backgrounds.page.blur.saturation", "string", literal("300%")]
  ]),
  ...fields(RESOURCE_CONSUMERS, [
    ["resources.preconnect", "array", literal([]), { items: { type: ["string"] }, normalization: "normalize origins; stable-deduplicate; replace on site override" }],
    ["resources.fallbacks.avatar", "string", literal("https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/avatar/round/3442075.svg")],
    ["resources.fallbacks.link_card", "string", literal("https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/link/8f277b4ee0ecd.svg")],
    ["resources.fallbacks.cover", "string", literal("https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/cover/76b86c0226ffd.svg")],
    ["resources.fallbacks.project_icon", "string", literal("https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/image/2779789.png")],
    ["resources.fallbacks.banner", "string", literal("https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/banner/books.jpg")],
    ["resources.fallbacks.topic_cover", "string", literal("https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/image/10433048.png")],
    ["resources.fallbacks.image.content", "string", literal("https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/image/2659360.svg")],
    ["resources.fallbacks.image.tag_plugin", "string", literal(TAG_PLUGIN_IMAGE_FALLBACK)],
    ["resources.fallbacks.error_page", "string", literal("https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/404/1c830bfcd517d.svg")]
  ]),
  ...fields(EXTENSION_CONSUMERS, [
    ["extensions.search.provider", ["string", "null"], literal("local"), { values: [null, "local", "algolia"], normalization: "require a registered provider ID; preserve null as disabled" }],
    ["extensions.search.providers.local.scope", "string", literal("all")],
    ["extensions.search.providers.local.index_path", "string", literal("/search.json")],
    ["extensions.search.providers.local.include_content", "boolean", literal(true)],
    ["extensions.search.providers.local.lazy", "boolean", literal(true)],
    ["extensions.search.providers.local.cache_ttl", "number", literal(86400)],
    ["extensions.search.providers.local.exclude", "array", literal([]), { items: { type: ["string"] } }],
    ["extensions.search.providers.algolia", "object", registered("Algolia"), { boundary: "parameter_bag" }],
    ["extensions.comments.provider", ["string", "null"], literal(null), { values: [null, "beaudar", "utterances", "giscus", "twikoo", "waline", "artalk"] }],
    ["extensions.comments.title", ["string", "null"], literal(null)],
    ["extensions.comments.providers.<provider>", "object", registered("comment provider"), { boundary: "parameter_bag" }],
    ...TAG_EXTENSION_IDS.map(id => [`extensions.tags.${id}`, "object", registered(`tag:${id}`), {
      boundary: "registered_schema",
      normalization: "merge declared child fields; deep-freeze the normalized JavaScript object"
    }]),
    ...FEATURE_EXTENSION_IDS.map(id => [`extensions.features.${id}`, "object", registered(`feature:${id}`), {
      boundary: "registered_schema",
      normalization: "merge declared child fields; deep-freeze the normalized JavaScript object"
    }]),
    ["extensions.features.math.provider", ["string", "null"], literal(null), { values: [null, "katex", "mathjax"] }],
    ["extensions.services.site_info.endpoint", ["string", "null"], literal(null)],
    ["extensions.services.rating.endpoint", ["string", "null"], literal("https://star-vote.xaox.cc/api/rating")],
    ["extensions.services.vote.endpoint", ["string", "null"], literal("https://star-vote.xaox.cc/api/vote")],
    ["extensions.services.contributors.edit_page", "object", literal({ "_posts/": null, "wiki/stellar/": "https://github.com/xaoxuu/hexo-theme-stellar-docs/blob/main/" }), { boundary: "record" }],
    ["extensions.services.contributors.edit_page.<prefix>", ["string", "null"], literal(null)],
    ["extensions.services.github.api_url", "string", literal("https://api.github.com"), { normalization: "require an absolute HTTP(S) URL; preserve the URL" }],
    ["extensions.services.github.raw_url", "string", literal("https://raw.githubusercontent.com"), { normalization: "require an absolute HTTP(S) URL; preserve the URL" }],
    ["extensions.services.github.gist_url", "string", literal("https://gist.github.com"), { normalization: "require an absolute HTTP(S) URL; preserve the URL" }],
    ["extensions.services.github.card_url", "string", literal("https://github-readme-stats.vercel.app"), { normalization: "require an absolute HTTP(S) URL; preserve the URL" }]
  ], { status: "delivered" }),
  ...fields(INJECT_CONSUMERS, [
    ["inject.head", "string", literal(""), { normalization: "preserve trusted source text exactly; append page text after site text with one newline" }],
    ["inject.script", "string", literal(""), { normalization: "preserve trusted source text exactly; append page text after site text with one newline" }]
  ]),
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

function migration(from, action, to, reason) {
  return {
    from,
    action,
    ...(to ? { to } : {}),
    reason
  };
}

const CONFIG_DOMAIN_TARGETS = deepFreeze({
  stellar: null,
  preconnect: "resources.preconnect",
  canonical: "seo.canonical",
  open_graph: "seo.open_graph",
  structured_data: "seo.structured_data",
  brand: "site.brand",
  menubar: "site.menu",
  site_tree: "layout.profiles",
  notebook: "content.notebook",
  article: "content.article",
  search: "extensions.search",
  comments: "extensions.comments",
  footer: "site.footer",
  tag_plugins: "extensions.tags",
  dependencies: "extensions.features",
  data_services: "extensions.services",
  data_cache: null,
  plugins: "extensions.features",
  style: "appearance",
  default: "resources.fallbacks",
  api_host: "extensions.services.github",
  system: null,
  inject: "inject",
  cache: null,
  language_switcher: null,
  collection: "collection",
  front_matter: "front_matter",
  hexo: null,
  hexo_front_matter: null,
  theme_data: "theme_data",
  derived_runtime: null
});

const CONFIG_DOMAIN_MIGRATIONS = deepFreeze({
  stellar: [
    migration("stellar.version", "internalize", null, "版本由 package.json 唯一提供"),
    migration("stellar.homepage", "internalize", null, "项目地址由 package metadata 提供"),
    migration("stellar.repo", "internalize", null, "仓库地址由 package metadata 提供"),
    migration("stellar.main_css", "internalize", null, "核心资源由内部 asset manifest 提供"),
    migration("stellar.main_js", "internalize", null, "核心资源由内部 asset manifest 提供")
  ],
  preconnect: [migration("preconnect[]", "move", "resources.preconnect[]", "资源连接提示归 resources 所有")],
  canonical: [
    migration("canonical.original_host", "rename", "seo.canonical.host", "canonical 子域已表达主机语义"),
    migration("canonical.official_hosts[]", "rename", "seo.canonical.allowed_hosts[]", "字段表达允许访问而非所有权")
  ],
  open_graph: [
    migration("open_graph.enable", "rename", "seo.open_graph.enabled", "布尔状态统一使用 enabled"),
    migration("open_graph.twitter_id", "move", "seo.open_graph.twitter_id", "SEO 字段统一归 seo")
  ],
  structured_data: [migration("structured_data.links[]", "rename", "seo.structured_data.same_as[]", "字段直接对应 JSON-LD sameAs")],
  brand: [
    migration("brand.image.src", "move", "site.brand.image.src", "站点身份归 site 所有"),
    migration("brand.image.style", "rename", "site.brand.image.variant", "值表示展示变体而非任意样式"),
    migration("brand.image.url", "rename", "site.brand.image.href", "链接字段统一使用 href"),
    migration("brand.image.background", "remove", null, "图片背景不再属于公开 Brand 契约"),
    migration("brand.name", "move", "site.brand.name", "站点身份归 site 所有"),
    migration("brand.tagline", "rename", "site.brand.tagline.text", "标语改为显式文本，悬停文本按需单独配置"),
    migration("brand.url", "rename", "site.brand.href", "链接字段统一使用 href")
  ],
  menubar: [
    migration("menubar.items", "move", "site.menu.items", "空菜单与菜单记录统一归 site shell 所有"),
    migration("menubar.items[].id", "move", "site.menu.items[].id", "菜单归 site shell 所有"),
    migration("menubar.items[].theme", "rename", "site.menu.items[].accent", "字段实际控制激活强调色"),
    migration("menubar.items[].icon", "move", "site.menu.items[].icon", "菜单归 site shell 所有"),
    migration("menubar.items[].title", "move", "site.menu.items[].title", "菜单归 site shell 所有"),
    migration("menubar.items[].url", "move", "site.menu.items[].url", "菜单归 site shell 所有")
  ],
  site_tree: [
    migration("site_tree.<profile>.base_dir", "rename", "layout.profiles.<profile>.path", "Profile 公开最终路由路径"),
    migration("site_tree.<profile>.navigation.menu", "rename", "layout.profiles.<profile>.navigation.active_menu", "字段选择高亮菜单项"),
    migration("site_tree.<profile>.navigation.tabs.<title>", "rename", "layout.profiles.<profile>.navigation.tabs[]", "动态记录改为有序 title/url 对象数组"),
    migration("site_tree.<profile>.sidebar.left.widgets[]", "rename", "layout.profiles.<profile>.sidebar.left[]", "Profile 侧栏直接使用 Widget 数组"),
    migration("site_tree.<profile>.sidebar.right.widgets[]", "rename", "layout.profiles.<profile>.sidebar.right[]", "Profile 侧栏直接使用 Widget 数组"),
    migration("site_tree.home.comments", "move", "layout.profiles.home.comments", "首页评论是 Profile 默认行为"),
    migration("site_tree.error_page.404", "rename", "layout.profiles.error.path", "错误页路径使用统一 Profile path")
  ],
  notebook: [
    migration("notebook.listing.excerpt_length", "move", "content.notebook.listing.excerpt_length", "内容默认值归 content 所有"),
    migration("notebook.listing.per_page", "move", "content.notebook.listing.per_page", "内容默认值归 content 所有"),
    migration("notebook.listing.order_by", "move", "content.notebook.listing.order_by", "内容默认值归 content 所有"),
    migration("notebook.tag_icons.<tag>", "move", "content.notebook.tag_icons.<tag>", "内容默认值归 content 所有"),
    migration("notebook.footer.license", "move", "content.notebook.footer.license", "内容默认值归 content 所有"),
    migration("notebook.footer.share", "move", "content.notebook.footer.share", "内容默认值归 content 所有")
  ],
  article: [
    migration("article.pin_style", "rename", "content.article.listing.pinned_layout", "字段控制置顶列表布局"),
    migration("article.type", "move", "content.article.type", "内容默认值归 content 所有"),
    migration("article.indent", "move", "content.article.indent", "内容默认值归 content 所有"),
    migration("article.cover_ratio", "move", "content.article.listing.cover_ratio", "比例作用于文章列表封面"),
    migration("article.card_style", "rename", "content.article.listing.card_layout", "字段控制卡片布局"),
    migration("article.banner_ratio", "move", "content.article.banner.ratio", "横幅参数归 banner 子域"),
    migration("article.auto_excerpt", "rename", "content.article.listing.excerpt_length", "字段表示摘要字符数"),
    migration("article.category_color.<category>", "rename", "content.article.category_colors.<category>", "动态颜色表使用复数名词"),
    migration("article.ai_label.default", "move", "content.article.ai_label.default", "内容默认值归 content 所有"),
    migration("article.ai_label.<level>.color", "move", "content.article.ai_label.<level>.color", "内容默认值归 content 所有"),
    migration("article.ai_label.<level>.icon", "move", "content.article.ai_label.<level>.icon", "内容默认值归 content 所有"),
    migration("article.license", "move", "content.article.footer.license", "许可协议属于文章 Footer"),
    migration("article.share[]", "move", "content.article.footer.share[]", "分享入口属于文章 Footer"),
    migration("article.related_posts.enable", "rename", "content.article.related_posts.enabled", "布尔状态统一使用 enabled"),
    migration("article.related_posts.max_count", "rename", "content.article.related_posts.limit", "字段表达结果上限"),
    migration("article.reading_time", "rename", "content.article.show_reading_time", "布尔字段明确表示显示行为"),
    migration("article.card_tags", "rename", "content.article.listing.show_tags", "布尔字段明确列表作用域与显示行为"),
    migration("article.tags", "rename", "content.article.show_tags", "布尔字段明确显示行为")
  ],
  search: [
    migration("search.service", "rename", "extensions.search.provider", "第三方实现统一称 provider"),
    migration("search.local_search.field", "rename", "extensions.search.providers.local.scope", "字段描述索引范围"),
    migration("search.local_search.path", "rename", "extensions.search.providers.local.index_path", "字段描述索引文件路径"),
    migration("search.local_search.content", "rename", "extensions.search.providers.local.include_content", "布尔字段明确包含行为"),
    migration("search.local_search.lazy_load", "rename", "extensions.search.providers.local.lazy", "简化重复后缀"),
    migration("search.local_search.cache_ttl", "move", "extensions.search.providers.local.cache_ttl", "provider 参数归 providers"),
    migration("search.local_search.skip_search[]", "rename", "extensions.search.providers.local.exclude[]", "字段描述排除规则"),
    migration("search.algolia_search.js", "internalize", null, "官方 Algolia 客户端由主题内部资源注册表提供"),
    migration("search.algolia_search.<option>", "move", "extensions.search.providers.algolia.<option>", "上游参数袋保持原字段")
  ],
  comments: [
    migration("comments.service", "rename", "extensions.comments.provider", "第三方实现统一称 provider"),
    migration("comments.comment_title", "rename", "extensions.comments.title", "去掉父级已表达的重复前缀"),
    migration("comments.custom_css", "remove", null, "Extension 自行按需加载样式"),
    migration("comments.<service>.js", "internalize", null, "官方评论客户端由主题内部资源注册表提供"),
    migration("comments.<service>.css", "internalize", null, "官方评论样式由主题内部资源注册表提供"),
    migration("comments.<service>.meta_css", "internalize", null, "官方评论元数据样式由主题内部资源注册表提供"),
    migration("comments.<service>.src", "internalize", null, "官方评论客户端由主题内部资源注册表提供"),
    migration("comments.<service>.<option>", "move", "extensions.comments.providers.<provider>.<option>", "上游参数袋归 providers")
  ],
  footer: [
    migration("footer.social", "rename", "site.footer.actions", "空操作表与动态记录统一归 actions"),
    migration("footer.social.<id>.type", "rename", "site.footer.actions[].type", "动态记录改为有序判别联合数组"),
    migration("footer.social.<id>.icon", "rename", "site.footer.actions[].icon", "动态记录改为有序判别联合数组"),
    migration("footer.social.<id>.title", "rename", "site.footer.actions[].title", "动态记录改为有序判别联合数组"),
    migration("footer.social.<id>.url", "rename", "site.footer.actions[].url", "动态记录改为有序判别联合数组"),
    migration("footer.social.<id>.onclick", "remove", null, "Footer 不再接受可执行 JavaScript"),
    migration("footer.social.<id>.items[]", "rename", "site.footer.actions[].items[]", "动态记录改为有序判别联合数组"),
    migration("footer.social.<id>.items[].icon", "rename", "site.footer.actions[].items[].icon", "Dropdown item 图标保持显式"),
    migration("footer.social.<id>.items[].title", "rename", "site.footer.actions[].items[].title", "Dropdown item 标题保持显式"),
    migration("footer.social.<id>.items[].url", "rename", "site.footer.actions[].items[].url", "Dropdown item 链接保持显式"),
    migration("footer.sitemap[]", "rename", "site.footer.sections[]", "该数组是 Footer 分栏而非 sitemap 输出"),
    migration("footer.sitemap[].title", "move", "site.footer.sections[].title", "Footer section 标题保持显式"),
    migration("footer.sitemap[].items[]", "rename", "site.footer.sections[].items[]", "Markdown 链接改为显式 title/url 对象"),
    migration("footer.content", "move", "site.footer.content", "Footer 归 site shell 所有")
  ],
  tag_plugins: [
    migration("tag_plugins.timeline.max-height", "rename", "extensions.tags.timeline.max_height", "Stellar 字段统一使用 snake_case"),
    migration("tag_plugins.<extension>.*", "move", "extensions.tags.<tag_id>.*", "标签能力进入注册式 Extension 注册 Schema")
  ],
  dependencies: [
    migration("dependencies.marked", "internalize", null, "Markdown 解析器由内部 Extension runtime 提供"),
    migration("dependencies.<dependency>.js", "internalize", null, "官方模块随主题发布"),
    migration("dependencies.<dependency>.css", "internalize", null, "官方样式随主题发布"),
    migration("dependencies.lazyload.transition", "move", "extensions.features.lazy_loading.transition", "懒加载行为参数归语义 Feature"),
    migration("dependencies.lazyload.fix_ratio", "move", "extensions.features.lazy_loading.fix_ratio", "懒加载行为参数归语义 Feature")
  ],
  data_services: [
    migration("data_services.<service>.js", "internalize", null, "官方服务模块随主题发布"),
    migration("data_services.siteinfo.api", "rename", "extensions.services.site_info.endpoint", "服务 ID 使用 snake_case，业务地址统一称 endpoint"),
    migration("data_services.rating.api", "rename", "extensions.services.rating.endpoint", "业务地址统一称 endpoint"),
    migration("data_services.vote.api", "rename", "extensions.services.vote.endpoint", "业务地址统一称 endpoint"),
    migration("data_services.contributors.edit_this_page.*", "rename", "extensions.services.contributors.edit_page.*", "去掉父级已表达的重复代词")
  ],
  data_cache: [
    migration("data_cache.enable", "internalize", null, "缓存策略由内部 request/cache 常量拥有"),
    migration("data_cache.default_ttl", "internalize", null, "缓存策略由内部 request/cache 常量拥有"),
    migration("data_cache.ttl.<service>", "internalize", null, "服务 TTL 由内部 request/cache 常量拥有"),
    migration("data_cache.max_entries", "internalize", null, "容量策略由内部 request/cache 常量拥有")
  ],
  plugins: [
    migration("plugins.swiper.enable", "internalize", null, "Swiper 是主题内置轮播实现，不再作为公开 Feature"),
    migration("plugins.katex.enable", "merge", "extensions.features.math", "数学实现合并为 provider 驱动的 Feature"),
    migration("plugins.mathjax.enable", "merge", "extensions.features.math", "数学实现合并为 provider 驱动的 Feature"),
    migration("plugins.<extension>.enable", "rename", "extensions.features.<feature>.enabled", "布尔状态统一使用 enabled"),
    migration("plugins.<extension>.js", "internalize", null, "官方模块随主题发布"),
    migration("plugins.<extension>.css", "internalize", null, "官方样式随主题发布"),
    migration("plugins.<extension>.inject", "internalize", null, "官方注入资源随主题发布"),
    migration("plugins.<extension>.*", "move", "extensions.features.<feature>.*", "用户可感知参数归语义 Feature")
  ],
  style: [
    migration("style.prefers_theme", "rename", "appearance.color_scheme", "字段描述最终颜色方案"),
    migration("style.page_transition.enable", "rename", "appearance.motion.page_transition", "动效开关归 motion"),
    migration("style.font-size.root", "rename", "appearance.typography.font_size.root", "排版参数归 typography 并使用 snake_case"),
    migration("style.font-size.code", "rename", "appearance.typography.font_size.inline_code", "字段明确行内代码作用域"),
    migration("style.font-size.codeblock", "rename", "appearance.typography.font_size.code_block", "字段明确代码块作用域并使用 snake_case"),
    migration("style.font-family.body", "rename", "appearance.typography.font_family.body", "排版参数归 typography 并使用 snake_case"),
    migration("style.font-family.code", "rename", "appearance.typography.font_family.inline_code", "字段明确行内代码作用域"),
    migration("style.font-family.codeblock", "rename", "appearance.typography.font_family.code_block", "字段明确代码块作用域并使用 snake_case"),
    migration("style.text-align", "rename", "appearance.typography.text_align", "排版参数归 typography 并使用 snake_case"),
    migration("style.prefix.*", "remove", null, "字段已无运行时消费方"),
    migration("style.border-radius.card-l", "rename", "appearance.shape.radius.card_large", "圆角参数使用完整尺寸名"),
    migration("style.border-radius.card", "move", "appearance.shape.radius.card", "圆角参数归 shape"),
    migration("style.border-radius.card-s", "rename", "appearance.shape.radius.card_small", "圆角参数使用完整尺寸名"),
    migration("style.border-radius.bar", "move", "appearance.shape.radius.bar", "圆角参数归 shape"),
    migration("style.border-radius.image-l", "rename", "appearance.shape.radius.image_large", "圆角参数使用完整尺寸名"),
    migration("style.border-radius.image", "move", "appearance.shape.radius.image", "圆角参数归 shape"),
    migration("style.border-radius.image-s", "rename", "appearance.shape.radius.image_small", "圆角参数使用完整尺寸名"),
    migration("style.corner-shape", "rename", "appearance.shape.corner", "连续曲率归 shape 并使用 snake_case"),
    migration("style.color.theme", "rename", "appearance.colors.theme", "颜色集合使用复数域名"),
    migration("style.color.accent", "rename", "appearance.colors.accent", "颜色集合使用复数域名"),
    migration("style.color.link", "rename", "appearance.colors.link", "颜色集合使用复数域名"),
    migration("style.animated_avatar.animate", "rename", "appearance.motion.avatar", "头像动画归 motion"),
    migration("style.codeblock.scrollbar", "rename", "appearance.code_block.scrollbar_width", "字段明确控制滚动条宽度"),
    migration("style.codeblock.highlightjs_theme", "rename", "appearance.code_block.highlight_theme", "去掉实现库名称"),
    migration("style.loading.*", "internalize", null, "用户界面文本由语言文件提供"),
    migration("style.gradient.start", "rename", "appearance.gradients.primary_action", "使用实际用途命名渐变"),
    migration("style.gradient.searchbar", "rename", "appearance.gradients.search_bar", "使用 snake_case 和组件语义"),
    migration("style.gradient.avatar", "rename", "appearance.gradients.avatar_ring", "字段明确控制头像光环"),
    migration("style.gradient.angle", "move", "appearance.gradients.angle", "渐变参数归 appearance"),
    migration("style.leftbar.ui-style", "rename", "appearance.backgrounds.sidebar.surface", "使用语义 surface 取代 UI style"),
    migration("style.leftbar.background-color-light", "rename", "appearance.backgrounds.sidebar.color.light", "背景颜色按色彩方案分组"),
    migration("style.leftbar.background-color-dark", "rename", "appearance.backgrounds.sidebar.color.dark", "背景颜色按色彩方案分组"),
    migration("style.leftbar.background-image", "rename", "appearance.backgrounds.sidebar.image", "视觉背景不依赖物理 leftbar 名称"),
    migration("style.leftbar.blur-px", "rename", "appearance.backgrounds.sidebar.blur.radius", "字段名不携带物理单位"),
    migration("style.leftbar.blur-bg", "rename", "appearance.backgrounds.sidebar.blur.overlay", "字段描述模糊覆盖层"),
    migration("style.leftbar.background-opacity", "rename", "appearance.backgrounds.sidebar.opacity", "父级已表达背景语义"),
    migration("style.error_page", "move", "resources.fallbacks.error_page", "错误页插图属于资源兜底"),
    migration("style.site.background-image", "rename", "appearance.backgrounds.page.image", "站点背景归 page background"),
    migration("style.site.blur-px", "rename", "appearance.backgrounds.page.blur.radius", "字段名不携带物理单位"),
    migration("style.site.blur-bg", "rename", "appearance.backgrounds.page.blur.overlay", "字段描述模糊覆盖层"),
    migration("style.site.blur-sat", "rename", "appearance.backgrounds.page.blur.saturation", "使用完整语义名"),
    migration("style.header_prefix.h2", "rename", "appearance.typography.heading_prefixes.h2", "标题前缀归 typography"),
    migration("style.header_prefix.h3", "rename", "appearance.typography.heading_prefixes.h3", "标题前缀归 typography"),
    migration("style.header_prefix.h4", "rename", "appearance.typography.heading_prefixes.h4", "标题前缀归 typography"),
    migration("style.header_prefix.h5", "rename", "appearance.typography.heading_prefixes.h5", "标题前缀归 typography")
  ],
  default: [
    migration("default.avatar", "move", "resources.fallbacks.avatar", "默认资源归 resources.fallbacks"),
    migration("default.link", "rename", "resources.fallbacks.link_card", "字段明确卡片用途"),
    migration("default.cover", "move", "resources.fallbacks.cover", "默认资源归 resources.fallbacks"),
    migration("default.image", "rename", "resources.fallbacks.image.content", "区分内容图片与标签插件图片"),
    migration("default.project", "rename", "resources.fallbacks.project_icon", "字段明确图标用途"),
    migration("default.banner", "move", "resources.fallbacks.banner", "默认资源归 resources.fallbacks"),
    migration("default.topic", "rename", "resources.fallbacks.topic_cover", "字段明确封面用途"),
    migration("default.image_onerror", "rename", "resources.fallbacks.image.tag_plugin", "区分标签插件图片兜底")
  ],
  api_host: [
    migration("api_host.ghapi", "rename", "extensions.services.github.api_url", "使用完整 URL 并归 GitHub 服务"),
    migration("api_host.ghraw", "rename", "extensions.services.github.raw_url", "使用完整 URL 并归 GitHub 服务"),
    migration("api_host.gist", "rename", "extensions.services.github.gist_url", "使用完整 URL 并归 GitHub 服务"),
    migration("api_host.ghcard", "rename", "extensions.services.github.card_url", "使用完整 URL 并归 GitHub 服务")
  ],
  system: [migration("system.override_pretty_urls", "internalize", null, "Hexo 集成策略不属于公开主题配置")],
  inject: [
    migration("inject.head[]", "merge", "inject.head", "数组收敛为保留原文的多行字符串"),
    migration("inject.script[]", "merge", "inject.script", "数组收敛为保留原文的多行字符串")
  ],
  cache: [migration("cache.enable", "remove", null, "遗留站点兼容字段不进入 v2")],
  language_switcher: [migration("language_switcher.enable", "remove", null, "不属于已交付 v2 站内多语言契约"), migration("language_switcher.items[]", "remove", null, "不属于已交付 v2 站内多语言契约")],
  collection: [
    migration("name", "move", "name", "Collection 身份字段保持顶层可读性"),
    migration("headline", "move", "headline", "Collection 身份字段保持顶层可读性"),
    migration("tagline", "move", "tagline", "Collection 身份字段保持顶层可读性"),
    migration("description", "move", "description", "Collection 身份字段保持顶层可读性"),
    migration("tags[]", "move", "tags[]", "Collection 分类字段保持不变"),
    migration("audience", "move", "audience", "Collection 受众字段保持不变"),
    migration("identity.icon", "move", "identity.icon", "Collection 身份字段保持不变"),
    migration("card.*", "move", "card.*", "Presentation 子域保持不变"),
    migration("hero.*", "move", "hero.*", "Presentation 子域保持不变"),
    migration("sidebar.*", "move", "sidebar.*", "布局覆盖保持不变"),
    migration("navigation.*", "move", "navigation.*", "导航覆盖保持不变"),
    migration("article.*", "move", "article.*", "文章覆盖保持不变"),
    migration("footer.*", "move", "footer.*", "Footer 覆盖保持不变"),
    migration("comments.enabled", "move", "comments.enabled", "评论覆盖开关保持显式"),
    migration("comments.title", "move", "comments.title", "评论标题保持显式"),
    migration("comments.id", "move", "comments.id", "评论页面 ID 保持显式"),
    migration("comments.service", "rename", "comments.provider", "第三方实现统一称 provider"),
    migration("comments.<service>.*", "move", "comments.options.*", "第三方页面参数收敛到选中 provider 的 options 参数袋"),
    migration("source.*", "move", "source.*", "来源元数据保持不变"),
    migration("routing.base_dir", "rename", "route.path", "路由目录统一表达为最终 path"),
    migration("routing.path", "move", "route.path", "与 CollectionModel.route 术语对齐"),
    migration("routing.start", "move", "route.start", "Topic 起始文章保持 route 子域"),
    migration("listing.*", "move", "listing.*", "列表覆盖保持不变"),
    migration("note.sidebar", "rename", "note_defaults.sidebar", "字段表达 Note 默认值"),
    migration("tree[]", "move", "navigation.tree", "Wiki 扁平 tree 属于导航"),
    migration("tree.<section>[]", "move", "navigation.tree.<section>[]", "Wiki 分组 tree 属于导航")
  ],
  front_matter: [
    migration("collection.type", "rename", "collection.profile", "type 与产品 Profile 术语对齐"),
    migration("collection.id", "move", "collection.id", "Collection ID 保持显式"),
    migration("card.*", "move", "card.*", "Presentation 覆盖保持不变"),
    migration("banner.*", "move", "banner.*", "Presentation 覆盖保持不变"),
    migration("sidebar.*", "move", "sidebar.*", "布局覆盖保持不变"),
    migration("navigation.*", "move", "navigation.*", "导航覆盖保持不变"),
    migration("article.*", "move", "article.*", "文章覆盖保持不变"),
    migration("footer.*", "move", "footer.*", "Footer 覆盖保持不变"),
    migration("comments.enabled", "move", "comments.enabled", "评论覆盖开关保持显式"),
    migration("comments.title", "move", "comments.title", "评论标题保持显式"),
    migration("comments.id", "move", "comments.id", "评论页面 ID 保持显式"),
    migration("comments.service", "rename", "comments.provider", "第三方实现统一称 provider"),
    migration("comments.<service>.*", "move", "comments.options.*", "第三方页面参数收敛到选中 provider 的 options 参数袋"),
    migration("visibility.*", "move", "visibility.*", "可见性覆盖保持不变"),
    migration("listing.*", "move", "listing.*", "列表覆盖保持不变"),
    migration("source.*", "move", "source.*", "来源元数据保持不变"),
    migration("robots", "move", "robots", "Hexo SEO Front Matter 保持原路径与外部所有权"),
    migration("open_graph.*", "rename", "seo.open_graph.*", "Stellar SEO 覆盖归 seo"),
    migration("katex", "merge", "render.math", "数学渲染统一由 provider 选择"),
    migration("mathjax", "merge", "render.math", "数学渲染统一由 provider 选择"),
    migration("mermaid", "rename", "render.diagrams", "按能力命名而非实现库"),
    migration("inject.head[]", "merge", "inject.head", "注入数组或标量收敛为保留原文的多行字符串"),
    migration("inject.script[]", "merge", "inject.script", "注入数组或标量收敛为保留原文的多行字符串")
  ],
  hexo: [
    ...["title", "subtitle", "description", "keywords", "author", "email", "avatar", "url", "root", "language", "date_format", "per_page", "relative_link", "pretty_urls.*", "index_generator.path", "category_dir", "tag_dir", "archive_dir", "feed.path", "favicon", "highlight.*", "prismjs.*"].map(path => migration(path, "move", path, "Hexo 自有配置保持原路径与外部所有权")),
    migration("inject.head[]", "remove", null, "v2 仅消费 _config.stellar.yml inject"),
    migration("inject.script[]", "remove", null, "v2 仅消费 _config.stellar.yml inject")
  ],
  hexo_front_matter: [
    ...["date", "updated", "title", "layout", "permalink", "published", "tags[]", "categories[]", "description", "excerpt", "photos[]", "sitemap", "keywords[]", "lang", "language", "abbrlink", "disableNunjucks"].map(path => migration(path, "move", path, "Hexo Front Matter 保持原路径与外部所有权"))
  ],
  theme_data: [
    ...["icons.<id>", "widgets.<id>.*", "authors.<id>.*", "links.<group>[].*", "chat_users.<id>.*", "wiki[]", "topic.publish_list[]"].map(path => migration(path, "move", path, "独立数据文件保持自身注册边界"))
  ],
  derived_runtime: [
    ...["theme.config.icons", "theme.config.widgets", "theme.config.authors", "theme.config.default_author", "theme.config.links", "theme.config.chat_users", "theme.config.wiki", "theme.config.topic", "theme.config.notebooks"].map(path => migration(path, "internalize", null, "派生对象不属于公开 YAML"))
  ]
});

function migrationPatternRegex(pattern) {
  const wildcard = "__WILDCARD__";
  const record = "__RECORD__";
  const optionalArray = "__OPTIONAL_ARRAY__";
  const normalized = pattern.endsWith("[]") ? `${pattern.slice(0, -2)}${optionalArray}` : pattern;
  const source = normalized
    .replace(/<[^>]+>/g, record)
    .replace(/\*/g, wildcard)
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replaceAll(record, "[^.\\[\\]]*")
    .replaceAll(wildcard, ".*")
    .replaceAll(optionalArray, "(?:\\[\\])?");
  return new RegExp(`^${source}$`);
}

function resolveConfigMigration(domainId, currentPath) {
  const migrations = CONFIG_DOMAIN_MIGRATIONS[domainId];
  if (!migrations) throw new Error(`Unknown config domain: ${domainId}`);
  const result = migrations.find(entry => migrationPatternRegex(entry.from).test(currentPath));
  if (!result) throw new Error(`No migration result for ${currentPath}`);
  return result;
}

module.exports = {
  CONFIG_DOMAIN_MIGRATIONS,
  CONFIG_DOMAIN_TARGETS,
  CONFIG_INTERNALIZED_RESOURCES,
  CONFIG_TARGET_FIELDS,
  CONFIG_TARGET_ROOTS,
  FEATURE_EXTENSION_IDS,
  FEATURE_ID_MIGRATIONS,
  PROFILE_ID_MIGRATIONS,
  PROFILE_IDS,
  SERVICE_ID_MIGRATIONS,
  TAG_EXTENSION_IDS,
  resolveConfigMigration
};
