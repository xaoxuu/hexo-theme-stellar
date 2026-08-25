/* global hexo */
"use strict";

const { deepFreeze } = require("./schema-utils");
const { contributionSchemaIds } = require("../lib/contribution-registry");

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

const CONTENT_CONSUMERS = Object.freeze(["CollectionModel", "PageViewModel", "article renderer", "listing renderer"]);

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
  ["inject.head_end", "string", literal("")],
  ["inject.body_end", "string", literal("")]
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

const TAG_EXTENSION_IDS = deepFreeze([
  "note", "checkbox", "quot", "emoji", "icon", "button", "mark", "hashtag", "gallery"
]);

const FEATURE_EXTENSION_IDS = deepFreeze(contributionSchemaIds("extensions.features"));

const FEATURE_ID_MIGRATIONS = deepFreeze({
  preload: "link_prefetch",
  fancybox: "lightbox",
  swiper: null,
  scrollreveal: "reveal",
  tianli_gpt: null,
  katex: "math",
  mathjax: "math",
  mermaid: "diagrams",
  copycode: null,
  adaptive_text: null,
  card_hover: "card_hover",
  heti: "heti"
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
  "extensions.features.{link_prefetch,lightbox,reveal}.provider",
  "extensions.features.{code_copy,adaptive_text}",
  "extensions.features.ai_summary",
  "extensions.tags.{image,timeline,okr,chat}",
  "extensions.cache.*",
  "appearance.gradients.angle",
  "resources.fallbacks.{project_icon,banner,topic_cover,image}",
  "style.loading.*",
  "system.override_pretty_urls"
]);

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
    migration("notebook.listing.order_by", "rename", "content.notebook.listing.sort", "字符串规则改为 field/direction 结构"),
    migration("notebook.tag_icons.<tag>", "move", "content.notebook.tag_icons.<tag>", "内容默认值归 content 所有"),
    migration("notebook.footer.license", "move", "content.notebook.footer.license", "内容默认值归 content 所有"),
    migration("notebook.footer.share", "move", "content.notebook.footer.share", "内容默认值归 content 所有")
  ],
  article: [
    migration("article.pin_style", "rename", "content.article.listing.pinned_layout", "字段控制置顶列表布局"),
    migration("article.type", "rename", "content.article.style", "字段描述文章呈现风格"),
    migration("article.indent", "rename", "content.article.paragraph_indent", "布尔覆盖改为 auto/always/never 语义"),
    migration("article.cover_ratio", "move", "content.article.listing.cover_ratio", "比例作用于文章列表封面"),
    migration("article.card_style", "rename", "content.article.listing.card_layout", "字段控制卡片布局"),
    migration("article.banner_ratio", "move", "content.article.banner.ratio", "横幅参数归 banner 子域"),
    migration("article.auto_excerpt", "rename", "content.article.listing.excerpt_length", "字段表示摘要字符数"),
    migration("article.category_color.<category>", "rename", "content.article.category_colors.<category>", "动态颜色表使用复数名词"),
    migration("article.ai_label", "internalize", null, "AI 等级样式与文案由主题内部固定"),
    migration("article.license", "move", "content.article.footer.license", "许可协议属于文章 Footer"),
    migration("article.share[]", "move", "content.article.footer.share[]", "分享入口属于文章 Footer"),
    migration("article.related_posts.enable", "rename", "content.article.related_posts_limit", "0 表示关闭，正整数表示结果上限"),
    migration("article.related_posts.max_count", "rename", "content.article.related_posts_limit", "字段表达结果上限"),
    migration("article.reading_time", "rename", "content.article.show_reading_time", "布尔字段明确表示显示行为"),
    migration("article.card_tags", "rename", "content.article.listing.show_tags", "布尔字段明确列表作用域与显示行为"),
    migration("article.tags", "rename", "content.article.footer.show_tags", "文章末标签归 Footer 所有")
  ],
  search: [
    migration("search.service", "rename", "extensions.search.provider", "第三方实现统一称 provider"),
    migration("search.local_search.field", "rename", "extensions.search.providers.local.scope", "字段描述索引范围"),
    migration("search.local_search.path", "internalize", null, "本地索引固定为 /search.json"),
    migration("search.local_search.content", "rename", "extensions.search.providers.local.include_content", "布尔字段明确包含行为"),
    migration("search.local_search.lazy_load", "internalize", null, "本地搜索固定按需加载"),
    migration("search.local_search.cache_ttl", "rename", "extensions.search.providers.local.cache_ttl_seconds", "字段名显式声明秒单位"),
    migration("search.local_search.skip_search[]", "remove", null, "可搜索性由 visibility.searchable 唯一控制"),
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
    migration("footer.social.<id>.onclick", "rename", "site.footer.actions[].onclick", "脚本操作改为显式 button Action"),
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
    migration("tag_plugins.emoji.default", "rename", "extensions.tags.emoji.default_source", "默认值改为 source ID"),
    migration("tag_plugins.emoji.<source>", "move", "extensions.tags.emoji.sources.<source>", "模板按 source 分组"),
    migration("tag_plugins.gallery.ratio", "rename", "extensions.tags.gallery.aspect_ratio", "字段使用完整比例语义"),
    migration("tag_plugins.gallery.layout", "remove", null, "布局只由单次标签参数决定"),
    migration("tag_plugins.{image,timeline,okr,chat}.*", "internalize", null, "无效或固定标签策略不再公开"),
    migration("tag_plugins.<extension>.*", "move", "extensions.tags.<tag_id>.*", "标签能力进入注册式 Extension 注册 Schema")
  ],
  dependencies: [
    migration("dependencies.marked", "internalize", null, "Markdown 解析器由内部 Extension runtime 提供"),
    migration("dependencies.<dependency>.js", "internalize", null, "官方模块随主题发布"),
    migration("dependencies.<dependency>.css", "internalize", null, "官方样式随主题发布"),
    migration("dependencies.lazyload.transition", "move", "extensions.features.lazy_loading.transition", "懒加载行为参数归语义 Feature"),
    migration("dependencies.lazyload.fix_ratio", "rename", "extensions.features.lazy_loading.auto_aspect_ratio", "字段明确 Hexo server 自动写回图片比例")
  ],
  data_services: [
    migration("data_services.<service>.js", "internalize", null, "官方服务模块随主题发布"),
    migration("data_services.siteinfo.api", "rename", "extensions.services.site_info.providers.site_info_api.endpoint", "服务 ID 使用 snake_case，并进入选中 provider 的参数袋"),
    migration("data_services.rating.api", "rename", "extensions.services.rating.providers.star_vote.endpoint", "业务地址进入 Star Vote provider 参数袋"),
    migration("data_services.vote.api", "rename", "extensions.services.vote.providers.star_vote.endpoint", "业务地址进入 Star Vote provider 参数袋"),
    migration("data_services.contributors.edit_this_page.*", "rename", "extensions.services.contributors.providers.github.repositories[]", "仓库映射进入 GitHub provider，并按最长 source_prefix 匹配")
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
    migration("plugins.preload.enable", "rename", "extensions.features.link_prefetch.enabled", "按用户可感知行为命名"),
    migration("plugins.scrollreveal.duration", "rename", "extensions.features.reveal.duration_ms", "字段名显式声明毫秒单位"),
    migration("plugins.scrollreveal.interval", "rename", "extensions.features.reveal.interval_ms", "字段名显式声明毫秒单位"),
    migration("plugins.tianli_gpt.*", "remove", null, "AI Summary 整体退出 v2"),
    migration("plugins.copycode.*", "internalize", null, "代码复制固定开启且策略内部化"),
    migration("plugins.adaptive_text.*", "internalize", null, "自适应文字固定开启且策略内部化"),
    migration("plugins.heti.enable", "rename", "extensions.features.heti.enabled", "使用产品名称并保留开关"),
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
    migration("style.font-family.code", "rename", "appearance.typography.font_family.code", "行内代码与代码块共享代码字体"),
    migration("style.font-family.codeblock", "merge", "appearance.typography.font_family.code", "行内代码与代码块共享代码字体"),
    migration("style.text-align", "rename", "appearance.typography.content_align", "字段明确控制正文对齐"),
    migration("style.prefix.*", "remove", null, "字段已无运行时消费方"),
    migration("style.border-radius.card-l", "rename", "appearance.shape.radius.card_large", "圆角参数使用完整尺寸名"),
    migration("style.border-radius.card", "move", "appearance.shape.radius.card", "圆角参数归 shape"),
    migration("style.border-radius.card-s", "rename", "appearance.shape.radius.card_small", "圆角参数使用完整尺寸名"),
    migration("style.border-radius.bar", "move", "appearance.shape.radius.bar", "圆角参数归 shape"),
    migration("style.border-radius.image-l", "rename", "appearance.shape.radius.image_large", "圆角参数使用完整尺寸名"),
    migration("style.border-radius.image", "move", "appearance.shape.radius.image", "圆角参数归 shape"),
    migration("style.border-radius.image-s", "rename", "appearance.shape.radius.image_small", "圆角参数使用完整尺寸名"),
    migration("style.corner-shape", "rename", "appearance.shape.corner", "连续曲率归 shape 并使用 snake_case"),
    migration("style.color.theme", "rename", "appearance.colors.primary", "主题主色使用准确命名"),
    migration("style.color.accent", "rename", "appearance.colors.accent", "颜色集合使用复数域名"),
    migration("style.color.link", "rename", "appearance.colors.link", "颜色集合使用复数域名"),
    migration("style.animated_avatar.animate", "rename", "appearance.motion.avatar", "头像动画归 motion"),
    migration("style.codeblock.scrollbar", "rename", "appearance.code_block.scrollbar_width", "字段明确控制滚动条宽度"),
    migration("style.codeblock.highlightjs_theme", "rename", "appearance.code_block.highlight_stylesheet", "字段明确接受样式表资源"),
    migration("style.loading.*", "internalize", null, "用户界面文本由语言文件提供"),
    migration("style.gradient.start", "rename", "appearance.gradients.primary_action", "使用实际用途命名渐变"),
    migration("style.gradient.searchbar", "rename", "appearance.gradients.search_bar", "使用 snake_case 和组件语义"),
    migration("style.gradient.avatar", "rename", "appearance.gradients.avatar_ring", "字段明确控制头像光环"),
    migration("style.gradient.angle", "internalize", null, "主题渐变角度固定为 210deg"),
    migration("style.leftbar.ui-style", "rename", "appearance.backgrounds.sidebar.surface", "使用语义 surface 取代 UI style"),
    migration("style.leftbar.background-color-light", "rename", "appearance.backgrounds.sidebar.color.light", "背景颜色按色彩方案分组"),
    migration("style.leftbar.background-color-dark", "rename", "appearance.backgrounds.sidebar.color.dark", "背景颜色按色彩方案分组"),
    migration("style.leftbar.background-image", "rename", "appearance.backgrounds.sidebar.image", "视觉背景不依赖物理 leftbar 名称"),
    migration("style.leftbar.blur-px", "rename", "appearance.backgrounds.sidebar.backdrop.radius", "字段名不携带物理单位"),
    migration("style.leftbar.blur-bg", "rename", "appearance.backgrounds.sidebar.backdrop.overlay", "字段描述背景滤镜层"),
    migration("style.leftbar.background-opacity", "rename", "appearance.backgrounds.sidebar.opacity", "父级已表达背景语义"),
    migration("style.error_page", "move", "resources.error_page.image", "错误页插图是可空页面资源"),
    migration("style.site.background-image", "rename", "appearance.backgrounds.page.image", "站点背景归 page background"),
    migration("style.site.blur-px", "rename", "appearance.backgrounds.page.backdrop.radius", "字段名不携带物理单位"),
    migration("style.site.blur-bg", "rename", "appearance.backgrounds.page.backdrop.overlay", "字段描述背景滤镜层"),
    migration("style.site.blur-sat", "rename", "appearance.backgrounds.page.backdrop.saturation", "使用完整语义名"),
    migration("style.header_prefix.h2", "rename", "appearance.typography.heading_prefixes.h2", "标题前缀归 typography"),
    migration("style.header_prefix.h3", "rename", "appearance.typography.heading_prefixes.h3", "标题前缀归 typography"),
    migration("style.header_prefix.h4", "rename", "appearance.typography.heading_prefixes.h4", "标题前缀归 typography"),
    migration("style.header_prefix.h5", "rename", "appearance.typography.heading_prefixes.h5", "标题前缀归 typography")
  ],
  default: [
    migration("default.avatar", "move", "resources.fallbacks.avatar", "默认资源归 resources.fallbacks"),
    migration("default.link", "rename", "resources.fallbacks.link_card", "字段明确卡片用途"),
    migration("default.cover", "move", "resources.fallbacks.cover", "默认资源归 resources.fallbacks"),
    migration("default.image", "internalize", null, "内容图片缺失资源由主题固定"),
    migration("default.project", "internalize", null, "项目图标缺失资源由主题固定"),
    migration("default.banner", "internalize", null, "Banner 缺失资源由主题固定"),
    migration("default.topic", "internalize", null, "Topic 封面缺失资源由主题固定"),
    migration("default.image_onerror", "internalize", null, "标签图片错误资源由主题固定")
  ],
  api_host: [
    migration("api_host.ghapi", "rename", "extensions.services.github.api_url", "使用完整 URL 并归 GitHub 服务"),
    migration("api_host.ghraw", "rename", "extensions.services.github.raw_url", "使用完整 URL 并归 GitHub 服务"),
    migration("api_host.gist", "rename", "extensions.services.github.gist_url", "使用完整 URL 并归 GitHub 服务"),
    migration("api_host.ghcard", "rename", "extensions.services.github_card.providers.github_readme_stats.endpoint", "GitHub Card 地址进入 GitHub Readme Stats provider")
  ],
  system: [migration("system.override_pretty_urls", "internalize", null, "Hexo 集成策略不属于公开主题配置")],
  inject: [
    migration("inject.head[]", "merge", "inject.head_end", "插入位置命名准确并收敛为保留原文的字符串"),
    migration("inject.script[]", "merge", "inject.body_end", "插入位置命名准确并收敛为保留原文的字符串")
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
    migration("inject.head[]", "merge", "inject.head_end", "注入数组或标量迁往准确位置命名"),
    migration("inject.script[]", "merge", "inject.body_end", "注入数组或标量迁往准确位置命名")
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
