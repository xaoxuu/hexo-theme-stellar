/* global hexo */
"use strict";

const { deepFreeze } = require("./schema-utils");
const {
  PROFILE_ID_MIGRATIONS,
  PROFILE_IDS
} = require("./config-target");

function literal(value) {
  return { kind: "literal", value };
}

const ROOT_DESCRIPTIONS = Object.freeze({
  site: "站点身份、菜单与 Footer。",
  layout: "页面 Profile 的路由、导航与侧边栏默认值。",
  content: "文章与 Notebook 的内容展示默认值。",
  appearance: "颜色、排版、形状、动效与背景。",
  seo: "Canonical、Open Graph 与结构化数据。",
  resources: "预连接、资源兜底与错误页资源。",
  extensions: "搜索、评论、标签、特性与数据服务扩展。",
  inject: "可信原文注入入口。"
});

const PROFILE_LABELS = Object.freeze({
  home: "主页",
  blog_index: "博客列表页",
  topic_index: "专栏列表页",
  wiki_index: "Wiki 列表页",
  post: "博客文章页",
  topic: "专栏文章页",
  wiki: "Wiki 内容页",
  notebook_index: "Notebook 总索引",
  note_index: "Notebook 列表页",
  note: "Note 内容页",
  author: "作者页",
  error: "错误页",
  page: "独立页面"
});

const STRUCTURE_DESCRIPTIONS = Object.freeze({
  "site.brand": "左侧栏顶部的站点品牌。",
  "site.menu": "站点主导航菜单。",
  "site.footer": "左侧栏操作与主内容区页脚。",
  "layout.profiles": "各页面类型的路径、导航和侧栏默认值。",
  "content.article": "博客文章及文章列表的展示默认值。",
  "content.notebook": "Notebook 列表与页脚默认值。",
  "appearance.typography": "正文、代码与标题的排版令牌。",
  "appearance.shape": "卡片、图片和栏目的形状令牌。",
  "appearance.colors": "主题主色、强调色和链接色。",
  "appearance.gradients": "主要交互、搜索栏和头像环渐变。",
  "appearance.motion": "页面与头像动效策略。",
  "appearance.code_block": "代码块滚动条与高亮样式。",
  "appearance.backgrounds": "侧栏和页面背景。",
  "seo.canonical": "Canonical 主机与合法镜像主机。",
  "seo.open_graph": "Open Graph 与 Twitter Card 元数据。",
  "seo.structured_data": "JSON-LD 结构化数据。",
  "resources.fallbacks": "内容缺少图片时使用的兜底资源。",
  "resources.error_page": "错误页资源。",
  "extensions.search": "站内搜索及其 Provider。",
  "extensions.comments": "评论系统及其 Provider。",
  "extensions.tags": "标签插件默认行为。",
  "extensions.features": "浏览器 Feature 的启用与实现选择。",
  "extensions.services": "数据服务及其 Provider。"
});

const LEAF_DESCRIPTIONS = Object.freeze({
  "site.brand.image.src": "Brand 图片来源；null 隐藏图片且不会继承 Hexo avatar。",
  "site.brand.image.variant": "Brand 图片呈现方式。",
  "site.brand.image.href": "点击 Brand 图片后的地址；null 表示不可点击。",
  "site.brand.name": "Brand 纯文本名称；null 隐藏名称且不会继承 Hexo title。",
  "site.brand.wordmark": "替代纯文本名称的图片字标；null 不显示字标。",
  "site.brand.tagline.text": "Brand 标语正文；null 隐藏标语且不会继承 Hexo subtitle。",
  "site.brand.tagline.hover": "鼠标悬停 Brand 时显示的替代标语；null 不切换。",
  "site.brand.href": "点击 Brand 名称或字标后的地址；null 表示不可点击。",
  "site.menu.items": "主导航菜单项；空数组不显示主菜单。",
  "site.footer.actions": "左侧栏底部操作；空数组不显示操作区。",
  "site.footer.sections": "主内容区页脚导航分栏；空数组不显示分栏。",
  "site.footer.content": "页脚正文；支持 Markdown 与主题模板变量，空字符串不显示。",

  "content.article.style": "文章默认排版风格。",
  "content.article.paragraph_indent": "正文段落首行缩进策略。",
  "content.article.listing.pinned_layout": "置顶文章列表布局。",
  "content.article.listing.card_layout": "普通文章卡片布局。",
  "content.article.listing.cover_ratio": "文章列表封面的宽高比。",
  "content.article.listing.excerpt_length": "自动摘要的最大字符数；0 不生成自动摘要。",
  "content.article.listing.show_tags": "是否在文章卡片中显示标签。",
  "content.article.banner.ratio": "文章 Banner 的宽高比。",
  "content.article.category_colors": "分类名称到 CSS 颜色的映射。",
  "content.article.footer.license": "文章许可声明；false 隐藏，字符串作为自定义声明。",
  "content.article.footer.share": "文章分享入口；空数组不显示。",
  "content.article.footer.show_tags": "是否在文章页脚显示标签。",
  "content.article.related_posts_limit": "相关文章数量上限；0 关闭相关文章。",
  "content.article.show_reading_time": "是否显示预计阅读时间。",
  "content.notebook.listing.excerpt_length": "Notebook 列表摘要的最大字符数；0 不生成自动摘要。",
  "content.notebook.listing.per_page": "Notebook 每页条目数；null 使用站点分页设置。",
  "content.notebook.listing.sort.field": "Notebook 条目的默认排序字段。",
  "content.notebook.listing.sort.direction": "Notebook 条目的默认排序方向。",
  "content.notebook.tag_icons": "Notebook 标签名称到图标 ID 的映射。",
  "content.notebook.footer.license": "Notebook 页脚许可声明；null 继承文章默认值，false 隐藏。",
  "content.notebook.footer.share": "Notebook 分享入口；null 继承文章默认值，空数组不显示。",

  "appearance.color_scheme": "站点默认配色方案。",
  "appearance.typography.font_size.root": "页面根字号。",
  "appearance.typography.font_size.inline_code": "行内代码字号。",
  "appearance.typography.font_size.code_block": "代码块字号。",
  "appearance.typography.font_family.body": "正文与界面字体栈。",
  "appearance.typography.font_family.code": "代码字体栈。",
  "appearance.typography.content_align": "文章正文对齐方式。",
  "appearance.typography.heading_prefixes.h2": "二级标题前缀字符。",
  "appearance.typography.heading_prefixes.h3": "三级标题前缀字符。",
  "appearance.typography.heading_prefixes.h4": "四级标题前缀字符。",
  "appearance.typography.heading_prefixes.h5": "五级标题前缀字符。",
  "appearance.shape.corner": "支持的 CSS corner-shape 值。",
  "appearance.shape.radius.card_large": "大型卡片圆角。",
  "appearance.shape.radius.card": "普通卡片圆角。",
  "appearance.shape.radius.card_small": "小型卡片圆角。",
  "appearance.shape.radius.bar": "栏、按钮和输入框圆角。",
  "appearance.shape.radius.image_large": "大型图片圆角。",
  "appearance.shape.radius.image": "普通图片圆角。",
  "appearance.shape.radius.image_small": "小型图片圆角。",
  "appearance.colors.primary": "主题主色。",
  "appearance.colors.accent": "强调色。",
  "appearance.colors.link": "正文链接颜色。",
  "appearance.gradients.primary_action": "主要操作按钮渐变。",
  "appearance.gradients.search_bar": "搜索栏边框渐变。",
  "appearance.gradients.avatar_ring": "头像装饰环渐变。",
  "appearance.motion.page_transition": "是否启用页面进入动效。",
  "appearance.motion.avatar": "头像动效策略。",
  "appearance.code_block.scrollbar_width": "代码块滚动条宽度。",
  "appearance.code_block.highlight_stylesheet": "代码高亮样式表资源；null 不加载额外样式。",
  "appearance.backgrounds.sidebar.surface": "侧栏背景表面样式。",
  "appearance.backgrounds.sidebar.color.light": "浅色模式侧栏背景色。",
  "appearance.backgrounds.sidebar.color.dark": "深色模式侧栏背景色。",
  "appearance.backgrounds.sidebar.image": "侧栏背景图片；null 不显示背景图。",
  "appearance.backgrounds.sidebar.opacity": "侧栏背景不透明度。",
  "appearance.backgrounds.sidebar.backdrop.radius": "侧栏背景模糊半径。",
  "appearance.backgrounds.sidebar.backdrop.overlay": "侧栏背景遮罩颜色。",
  "appearance.backgrounds.page.image": "页面背景图片；null 不显示背景图。",
  "appearance.backgrounds.page.backdrop.radius": "页面背景模糊半径。",
  "appearance.backgrounds.page.backdrop.overlay": "页面背景遮罩颜色。",
  "appearance.backgrounds.page.backdrop.saturation": "页面背景饱和度。",

  "seo.canonical.host": "生成 canonical URL 的主机名；null 关闭 canonical 输出。",
  "seo.canonical.allowed_hosts": "允许访问但不作为 canonical 的镜像主机；站点配置完整替换默认数组。",
  "seo.open_graph.enabled": "是否生成 Open Graph 与 Twitter Card 标签。",
  "seo.open_graph.twitter_id": "Twitter/X 用户名，不含 @；null 不输出账号标签。",
  "seo.structured_data.same_as": "作者或组织的公开身份页面；空数组不输出 sameAs。",
  "resources.preconnect": "需要预连接的绝对 HTTP(S) origin；站点配置完整替换默认数组。",
  "resources.fallbacks.avatar": "用户或作者缺少头像时使用的兜底图。",
  "resources.fallbacks.link_card": "链接卡片缺少图片时使用的兜底图。",
  "resources.fallbacks.cover": "封面与 Open Graph 缺少图片时使用的兜底图。",
  "resources.error_page.image": "错误页插图；null 不显示插图。",

  "extensions.search.provider": "站内搜索 Provider；null 关闭搜索。",
  "extensions.search.providers.local.scope": "本地搜索索引范围。",
  "extensions.search.providers.local.include_content": "本地搜索索引是否包含正文。",
  "extensions.search.providers.local.cache_ttl_seconds": "本地搜索索引缓存有效期，单位为秒。",
  "extensions.search.providers.algolia": "Algolia Provider 参数。",
  "extensions.comments.provider": "默认评论 Provider；null 关闭评论。",
  "extensions.comments.title": "默认评论区标题；null 使用语言文件文案。",
  "extensions.comments.providers.beaudar": "Beaudar Provider 参数。",
  "extensions.comments.providers.utterances": "Utterances Provider 参数。",
  "extensions.comments.providers.giscus": "Giscus Provider 参数。",
  "extensions.comments.providers.twikoo": "Twikoo Provider 参数。",
  "extensions.comments.providers.waline": "Waline Provider 参数。",
  "extensions.comments.providers.artalk": "Artalk Provider 参数。",
  "extensions.tags.note.default_color": "Note 标签的默认颜色；空字符串使用组件默认色。",
  "extensions.tags.note.border": "Note 标签是否显示边框。",
  "extensions.tags.checkbox.interactive": "Checkbox 标签是否允许用户交互。",
  "extensions.tags.quot": "Quot 标签各变体的前后图标映射。",
  "extensions.tags.emoji.default_source": "Emoji 标签默认使用的图片源。",
  "extensions.tags.emoji.sources": "Emoji 图片源名称到 URL 模板的映射。",
  "extensions.tags.icon.default_color": "Icon 标签默认颜色；null 不注入颜色。",
  "extensions.tags.button.default_color": "Button 标签默认颜色；null 不注入颜色。",
  "extensions.tags.mark.default_color": "Mark 标签默认颜色。",
  "extensions.tags.hashtag.default_color": "Hashtag 标签默认颜色；null 不注入颜色。",
  "extensions.tags.gallery.size": "Gallery 标签默认图片尺寸。",
  "extensions.tags.gallery.aspect_ratio": "Gallery 标签默认图片比例。",
  "extensions.features.lazy_loading.transition": "图片懒加载完成时的过渡效果。",
  "extensions.features.lazy_loading.auto_aspect_ratio": "懒加载是否自动保留图片宽高比。",
  "extensions.features.link_prefetch.enabled": "是否在用户可能导航前预取站内页面。",
  "extensions.features.color_scheme_switch.enabled": "是否启用浏览器配色切换功能。",
  "extensions.features.lightbox.enabled": "是否启用图片灯箱。",
  "extensions.features.lightbox.selector": "进入灯箱的图片 CSS 选择器。",
  "extensions.features.reveal.enabled": "是否启用滚动进入动效。",
  "extensions.features.reveal.distance": "滚动进入动效的位移距离。",
  "extensions.features.reveal.duration_ms": "滚动进入动效持续时间，单位为毫秒。",
  "extensions.features.reveal.interval_ms": "同组元素进入动效的间隔，单位为毫秒。",
  "extensions.features.reveal.scale": "滚动进入动效的初始缩放比例。",
  "extensions.features.math.provider": "数学公式 Provider；null 关闭公式渲染。",
  "extensions.features.math.providers.katex": "KaTeX Provider 参数。",
  "extensions.features.math.providers.mathjax": "MathJax Provider 参数。",
  "extensions.features.diagrams.provider": "图表 Provider；null 关闭图表渲染。",
  "extensions.features.diagrams.providers.mermaid.theme": "Mermaid 图表主题。",
  "extensions.features.card_hover.enabled": "是否启用卡片悬停聚光与倾斜效果。",
  "extensions.features.heti.enabled": "是否启用 Heti 中文排版增强。",
  "extensions.services.site_info.provider": "站点信息服务 Provider；null 关闭自动补全。",
  "extensions.services.site_info.providers.site_info_api.endpoint": "Site Info API 请求模板，使用 {href} 代入目标地址。",
  "extensions.services.rating.provider": "评分服务 Provider；null 关闭评分服务。",
  "extensions.services.rating.providers.star_vote.endpoint": "Star Vote 评分接口地址。",
  "extensions.services.vote.provider": "投票服务 Provider；null 关闭投票服务。",
  "extensions.services.vote.providers.star_vote.endpoint": "Star Vote 投票接口地址。",
  "extensions.services.contributors.provider": "贡献者数据 Provider。",
  "extensions.services.contributors.providers.github.repositories": "源码目录到 GitHub 仓库的映射；空数组不加载贡献者。",
  "extensions.services.github.api_url": "GitHub REST API 基础地址。",
  "extensions.services.github.raw_url": "GitHub Raw 内容基础地址。",
  "extensions.services.github.gist_url": "GitHub Gist 基础地址。",
  "extensions.services.github_card.provider": "GitHub 卡片 Provider。",
  "extensions.services.github_card.providers.github_readme_stats.endpoint": "GitHub Readme Stats 服务地址。",
  "inject.head_end": "插入 </head> 前的可信 HTML；空字符串不注入。",
  "inject.body_end": "插入 </body> 前的可信 HTML 或脚本；空字符串不注入。"
});

const YAML_EXAMPLES = Object.freeze({
  "site.brand.image.src": "/avatar.webp",
  "site.brand.image.href": "/about/",
  "site.brand.wordmark": "/wordmark.svg",
  "site.menu.items": [{ id: "post", title: "博客", icon: "default:documents", url: "/", accent: "#1BCDFC" }],
  "site.footer.actions": [{ type: "link", icon: "default:github", title: "GitHub", url: "https://github.com/" }],
  "site.footer.sections": [{ title: "博客", items: [{ title: "归档", url: "/blog/archives/" }] }],
  "content.article.category_colors": { "探索号": "#f44336" },
  "seo.canonical.host": "example.com",
  "seo.structured_data.same_as": ["https://github.com/xaoxuu"],
  "resources.preconnect": ["https://cdn.jsdelivr.net"],
  "extensions.services.contributors.providers.github.repositories": [{ source_prefix: "wiki/stellar/", repository: "xaoxuu/hexo-theme-stellar-docs", branch: "main" }],
  "inject.head_end": "<meta name=\"example\" content=\"stellar\">"
});

function profileDescription(path) {
  const match = /^layout\.profiles\.([^.]+)\.(.+)$/.exec(path);
  if (!match) return null;
  const label = PROFILE_LABELS[match[1]];
  if (!label) return null;
  const descriptions = {
    "navigation.active_menu": `${label}高亮的主菜单项；null 表示不高亮。`,
    "navigation.tabs": `${label}顶部附加导航标签；空数组不添加。`,
    "sidebar.left": `${label}左侧栏 Widget，按数组顺序显示；空数组隐藏左侧栏。`,
    "sidebar.right": `${label}右侧栏 Widget，按数组顺序显示；空数组隐藏右侧栏。`,
    path: `${label}的自动生成路径。`,
    "comments.enabled": "是否显示主页评论区。",
    "comments.title": "主页评论区标题；null 使用默认评论标题。",
    "comments.id": "主页评论线程的稳定标识；null 由页面上下文决定。",
    "comments.provider": "主页专用评论 Provider；null 使用全局评论 Provider。",
    "comments.options": "主页专用评论 Provider 参数。"
  };
  return descriptions[match[2]] || null;
}

function structureDescription(path) {
  const profileMatch = /^layout\.profiles\.([^.]+)$/.exec(path);
  if (profileMatch && PROFILE_LABELS[profileMatch[1]]) {
    return `${PROFILE_LABELS[profileMatch[1]]}的布局默认值。`;
  }
  return STRUCTURE_DESCRIPTIONS[path] || ROOT_DESCRIPTIONS[path] || null;
}

function annotateSchema(node, path = "", order = 0, yamlVisible = true) {
  const hasProperties = Object.keys(node.properties || {}).length > 0;
  const description = node.description
    || (path ? (hasProperties ? structureDescription(path) : (LEAF_DESCRIPTIONS[path] || profileDescription(path))) : "Stellar v2 Theme 配置。");
  if (yamlVisible && !hasProperties && !description) {
    throw new Error(`Theme Schema 活动叶子缺少语义描述：${path}`);
  }
  if (description) node.description = description;
  node.yaml = {
    ...node.yaml,
    order,
    ...(Object.prototype.hasOwnProperty.call(YAML_EXAMPLES, path) ? { example: YAML_EXAMPLES[path] } : {})
  };
  Object.entries(node.properties || {}).forEach(([key, child], index) => {
    annotateSchema(child, path ? `${path}.${key}` : key, index, yamlVisible);
  });
  if (node.items) annotateSchema(node.items, `${path}[]`, 0, false);
  if (node.additionalProperties) {
    annotateSchema(node.additionalProperties, `${path}.${node.additionalPropertyKey || "<key>"}`, 0, false);
  }
  return node;
}

function structuralOptions(options) {
  const result = {};
  for (const key of [
    "items",
    "values",
    "properties",
    "additionalProperties",
    "additionalPropertyKey",
    "allowedPropertyKeys",
    "minimum",
    "maximum",
    "exclusiveMinimum",
    "externalProperties",
    "removedProperties",
    "removedNullProperties",
    "requiredProperties",
    "sealed"
  ]) {
    if (options[key] !== undefined) result[key] = options[key];
  }
  return result;
}

function field(type, options) {
  return {
    type: Array.isArray(type) ? type : [type],
    default: options.default,
    description: options.description,
    yaml: options.yaml,
    scope: options.scope,
    cascade: options.cascade,
    normalizer: options.normalizer,
    normalization: options.normalization,
    consumers: options.consumers,
    example: options.example,
    migration: options.migration,
    runtimeKey: options.runtimeKey,
    validator: options.validator,
    ...structuralOptions(options)
  };
}

function deliveredField(path, options) {
  if (!options.type || options.default?.kind !== "literal") {
    throw new Error(`Theme Schema 字段 ${path} 必须直接声明类型和字面量默认值`);
  }
  const root = path.split(".")[0];
  const consumers = options.consumers || {
    site: SITE_CONSUMERS,
    layout: LAYOUT_CONSUMERS,
    content: CONTENT_CONSUMERS,
    appearance: APPEARANCE_CONSUMERS,
    seo: SEO_CONSUMERS,
    resources: RESOURCE_CONSUMERS,
    extensions: EXTENSION_CONSUMERS,
    inject: INJECT_CONSUMERS
  }[root];
  return field(options.type, {
    ...options,
    scope: "theme",
    cascade: ["schema default", "_config.stellar.yml"],
    normalization: options.normalization || "validate the declared type; preserve the value; deep-freeze the result",
    consumers,
    migration: options.migration || `configuration/${root}`,
    runtimeKey: options.runtimeKey || path.split(".").pop().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  });
}

function object(options) {
  return {
    type: ["object"],
    default: literal({}),
    scope: "theme",
    cascade: ["schema default", "_config.stellar.yml"],
    normalizer: "object",
    normalization: "merge declared child fields; deep-freeze the normalized JavaScript object",
    sealed: true,
    ...options
  };
}

const SEO_CONSUMERS = Object.freeze([
  "Post PageViewModel",
  "head renderer",
  "JSON-LD helper",
  "browser canonical check",
  "Reference generator"
]);
const SITE_CONSUMERS = Object.freeze([
  "PageViewModel",
  "Shell renderer",
  "menu renderer",
  "footer renderer",
  "Reference generator"
]);
const LAYOUT_CONSUMERS = Object.freeze([
  "CollectionModel",
  "PageViewModel",
  "page generators",
  "navigation renderer",
  "sidebar renderer",
  "Reference generator"
]);
const PRECONNECT_CONSUMERS = Object.freeze(["head renderer", "Reference generator"]);
const INJECT_CONSUMERS = Object.freeze(["head renderer", "script renderer", "Reference generator"]);
const CONTENT_CONSUMERS = Object.freeze([
  "CollectionModel",
  "PageViewModel",
  "article renderer",
  "listing renderer",
  "Reference generator"
]);
const APPEARANCE_CONSUMERS = Object.freeze([
  "PageViewModel",
  "layout renderer",
  "Stylus compiler",
  "browser theme state",
  "Reference generator"
]);
const RESOURCE_CONSUMERS = Object.freeze([
  "PageViewModel",
  "tag renderers",
  "image fallback filters",
  "error renderer",
  "Reference generator"
]);
const EXTENSION_CONSUMERS = Object.freeze([
  "Extension registry",
  "Extension renderer",
  "browser Extension runtime",
  "Reference generator"
]);

const LAYOUT_PROFILE_DEFAULTS = deepFreeze({
  home: { path: null, activeMenu: "post", tabs: [], leftWidgets: ["welcome", "recent"], rightWidgets: [] },
  blog_index: { path: "/blog/", activeMenu: "post", tabs: [], leftWidgets: ["welcome", "recent"], rightWidgets: [] },
  topic_index: { path: "/topic/", activeMenu: "post", tabs: [], leftWidgets: ["welcome", "recent"], rightWidgets: [] },
  wiki_index: { path: "/wiki/", activeMenu: "wiki", tabs: [], leftWidgets: ["related", "recent"], rightWidgets: [] },
  post: { path: null, activeMenu: "post", tabs: [], leftWidgets: ["related", "recent"], rightWidgets: ["ghrepo", "toc"] },
  topic: { path: null, activeMenu: "post", tabs: [], leftWidgets: ["related", "recent"], rightWidgets: ["ghrepo", "toc"] },
  wiki: { path: null, activeMenu: "wiki", tabs: [], leftWidgets: ["tree", "related", "recent"], rightWidgets: ["ghrepo", "toc"] },
  notebook_index: { path: "/notebooks/", activeMenu: "notebooks", tabs: [], leftWidgets: ["recent"], rightWidgets: [] },
  note_index: { path: null, activeMenu: "notebooks", tabs: [], leftWidgets: ["tagtree", "recent"], rightWidgets: [] },
  note: { path: null, activeMenu: "notebooks", tabs: [], leftWidgets: ["tagtree", "recent"], rightWidgets: ["toc"] },
  author: { path: "/author/", activeMenu: "post", tabs: [], leftWidgets: ["recent"], rightWidgets: [] },
  error: { path: "/404.html", activeMenu: "post", tabs: [], leftWidgets: ["recent"], rightWidgets: [] },
  page: { path: null, activeMenu: "post", tabs: [], leftWidgets: ["recent"], rightWidgets: ["toc"] }
});

function extensionValue(type, defaultValue, options = {}) {
  const types = Array.isArray(type) ? type : [type];
  const normalizer = options.normalizer || (types.includes("array") ? "array" : (types.includes("object") ? "object" : "identity"));
  return field(type, {
    default: literal(defaultValue),
    scope: "theme",
    cascade: ["schema default", "_config.stellar.yml"],
    normalizer,
    normalization: options.normalization || "validate the declared type; preserve the value; deep-freeze the result",
    consumers: EXTENSION_CONSUMERS,
    example: options.example ?? defaultValue,
    migration: options.migration || "configuration/extensions",
    runtimeKey: options.runtimeKey,
    ...options
  });
}

function extensionObject(properties, defaultValue = {}, options = {}) {
  const runtimeProperties = Object.fromEntries(Object.entries(properties).map(([key, definition]) => [
    key,
    definition.runtimeKey ? definition : {
      ...definition,
      runtimeKey: key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    }
  ]));
  return object({
    default: literal(defaultValue),
    consumers: EXTENSION_CONSUMERS,
    example: options.example ?? defaultValue,
    migration: options.migration || "configuration/extensions",
    runtimeKey: options.runtimeKey,
    properties: runtimeProperties,
    ...options
  });
}

function parameterBag(defaultValue = {}, options = {}) {
  return extensionValue("object", defaultValue, {
    normalizer: "parameter_bag",
    sealed: false,
    ...options
  });
}

function tagExtensionSchemas() {
  const quotVariant = extensionObject({
    prefix: extensionValue(["string", "null"], null),
    suffix: extensionValue(["string", "null"], null)
  });
  return {
    note: extensionObject({
      default_color: extensionValue("string", ""),
      border: extensionValue("boolean", true)
    }, { default_color: "", border: true }),
    checkbox: extensionObject({ interactive: extensionValue("boolean", false) }, { interactive: false }),
    quot: extensionObject({}, {
      default: { prefix: "quot:quote-left", suffix: "quot:quote-right" },
      hashtag: { prefix: "quot:hashtag", suffix: null },
      question: { prefix: "quot:question", suffix: null }
    }, {
      sealed: false,
      additionalPropertyKey: "<variant>",
      additionalProperties: quotVariant
    }),
    emoji: extensionObject({
      default_source: extensionValue("string", "blobcat", { validator: "non_empty_string" }),
      sources: extensionObject({}, {
        twemoji: "https://gcore.jsdelivr.net/gh/twitter/twemoji/assets/svg/{name}.svg",
        qq: "https://gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/qq/{name}.gif",
        aru: "https://gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/aru/{name}.gif",
        tieba: "https://gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/tieba/{name}.png",
        blobcat: "https://gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/blobcat/{name}.gif"
      }, {
        sealed: false,
        additionalPropertyKey: "<source>",
        additionalProperties: extensionValue("string", "", { validator: "emoji_template" })
      })
    }, {
      default_source: "blobcat",
      sources: {
        twemoji: "https://gcore.jsdelivr.net/gh/twitter/twemoji/assets/svg/{name}.svg",
        qq: "https://gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/qq/{name}.gif",
        aru: "https://gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/aru/{name}.gif",
        tieba: "https://gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/tieba/{name}.png",
        blobcat: "https://gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/blobcat/{name}.gif"
      }
    }, { validator: "emoji_sources", removedProperties: { default: "default_source" } }),
    icon: extensionObject({ default_color: extensionValue(["string", "null"], "accent") }, { default_color: "accent" }),
    button: extensionObject({ default_color: extensionValue(["string", "null"], "theme") }, { default_color: "theme" }),
    mark: extensionObject({ default_color: extensionValue("string", "yellow") }, { default_color: "yellow" }),
    hashtag: extensionObject({ default_color: extensionValue(["string", "null"], null) }, { default_color: null }),
    gallery: extensionObject({
      size: extensionValue("string", "mix", { values: ["s", "m", "l", "xl", "mix"] }),
      aspect_ratio: extensionValue("string", "square", { values: ["original", "square", "portrait"] })
    }, { size: "mix", aspect_ratio: "square" }, { removedProperties: { layout: null, ratio: "aspect_ratio" } })
  };
}

function featureExtensionSchemas() {
  return {
    lazy_loading: extensionObject({
      transition: extensionValue("string", "fade", { values: ["blur", "fade"] }),
      auto_aspect_ratio: extensionValue("boolean", true)
    }, { transition: "fade", auto_aspect_ratio: true }, { removedProperties: { fix_ratio: "auto_aspect_ratio" } }),
    link_prefetch: extensionObject({
      enabled: extensionValue("boolean", true)
    }, { enabled: true }, { removedProperties: { enable: "enabled", provider: "internalized", service: "internalized", flying_pages: "internalized" } }),
    color_scheme_switch: extensionObject({
      enabled: extensionValue("boolean", false)
    }, { enabled: false }),
    lightbox: extensionObject({
      enabled: extensionValue("boolean", true),
      selector: extensionValue("string", ".timenode p>img", { validator: "css_selector" })
    }, { enabled: true, selector: ".timenode p>img" }, { removedProperties: { enable: "enabled", mode: null, provider: "internalized", js: "internalized", css: "internalized" } }),
    reveal: extensionObject({
      enabled: extensionValue("boolean", true),
      distance: extensionValue("string", "8px", { validator: "css_length" }),
      duration_ms: extensionValue("number", 1000, { minimum: 0 }),
      interval_ms: extensionValue("number", 100, { minimum: 0 }),
      scale: extensionValue("number", 1, { minimum: 0, maximum: 1 })
    }, { enabled: true, distance: "8px", duration_ms: 1000, interval_ms: 100, scale: 1 }, { removedProperties: { enable: "enabled", duration: "duration_ms", interval: "interval_ms", provider: "internalized", js: "internalized" } }),
    math: extensionObject({
      provider: deliveredField("extensions.features.math.provider", { values: [null,"katex","mathjax"], type: ["string","null"], default: literal(null), normalizer: "identity", example: null }),
      providers: extensionObject({
        katex: parameterBag({}, { removedProperties: { js: "internalized", css: "internalized", inject: "internalized" } }),
        mathjax: parameterBag({}, { removedProperties: { v3: "internalized", js: "internalized", css: "internalized", inject: "internalized" } })
      }, { katex: {}, mathjax: {} })
    }, { provider: null, providers: { katex: {}, mathjax: {} } }, { removedProperties: { katex: "provider", mathjax: "provider" } }),
    diagrams: extensionObject({
      provider: extensionValue(["string", "null"], null, { values: [null, "mermaid"] }),
      providers: extensionObject({
        mermaid: extensionObject({
          theme: extensionValue("string", "neutral", { values: ["default", "dark", "forest", "neutral"] })
        }, { theme: "neutral" })
      }, { mermaid: { theme: "neutral" } })
    }, { provider: null, providers: { mermaid: { theme: "neutral" } } }, { removedProperties: { enable: "provider", enabled: "provider", style_optimization: null, theme: "providers.mermaid.theme", js: "internalized" } }),
    card_hover: extensionObject({
      enabled: extensionValue("boolean", false)
    }, { enabled: false }, { removedProperties: { enable: "enabled", spotlight_color: null, max_tilt: null } }),
    heti: extensionObject({ enabled: extensionValue("boolean", false) }, { enabled: false }, { removedProperties: { enable: "enabled", css: "internalized", js: "internalized" } })
  };
}

function extensionsSchema() {
  const internalAssetKeys = {
    js: "internalized",
    css: "internalized",
    meta_css: "internalized",
    src: "internalized",
    inject: "internalized"
  };
  const providerBag = defaultValue => parameterBag(defaultValue, { removedProperties: internalAssetKeys });
  const commentProvider = deliveredField("extensions.comments.providers.<provider>", { type: ["object"], default: literal({}),
    normalizer: "parameter_bag",
    example: {},
    sealed: false,
    removedProperties: internalAssetKeys
  });
  const contributorRepository = extensionObject({
    source_prefix: deliveredField("extensions.services.contributors.providers.github.repositories[].source_prefix", { type: ["string"], default: literal(""), normalizer: "identity", validator: "safe_relative_path", example: "wiki/stellar/" }),
    repository: deliveredField("extensions.services.contributors.providers.github.repositories[].repository", { type: ["string"], default: literal(""), normalizer: "identity", validator: "github_repository", example: "xaoxuu/hexo-theme-stellar-docs" }),
    branch: deliveredField("extensions.services.contributors.providers.github.repositories[].branch", { type: ["string"], default: literal("main"), normalizer: "identity", validator: "non_empty_string", example: "main" })
  }, { branch: "main" }, { requiredProperties: ["source_prefix", "repository"] });
  return object({
    consumers: EXTENSION_CONSUMERS,
    example: { search: { provider: "local" }, comments: { provider: "giscus" } },
    migration: "configuration/extensions",
    runtimeKey: "extensions",
    properties: {
      search: extensionObject({
        provider: deliveredField("extensions.search.provider", { values: [null,"local","algolia"], normalization: "require a registered provider ID; preserve null as disabled", type: ["string","null"], default: literal("local"), normalizer: "identity", example: "local" }),
        providers: extensionObject({
          local: extensionObject({
            scope: deliveredField("extensions.search.providers.local.scope", { type: ["string"], default: literal("all"), normalizer: "identity", example: "all" }),
            include_content: deliveredField("extensions.search.providers.local.include_content", { type: ["boolean"], default: literal(true), normalizer: "identity", example: true }),
            cache_ttl_seconds: deliveredField("extensions.search.providers.local.cache_ttl_seconds", { minimum: 0, type: ["number"], default: literal(86400), normalizer: "identity", example: 86400, validator: "non_negative_integer" })
          }, { scope: "all", include_content: true, cache_ttl_seconds: 86400 }, {
            removedProperties: { field: "scope", path: null, index_path: null, content: "include_content", lazy: null, lazy_load: null, cache_ttl: "cache_ttl_seconds", exclude: null, skip_search: null }
          }),
          algolia: deliveredField("extensions.search.providers.algolia", { type: ["object"], default: literal({"appId":null,"apiKey":null,"indexName":null}),
            normalizer: "parameter_bag",
            example: { appId: "", apiKey: "", indexName: "" },
            sealed: false,
            removedProperties: internalAssetKeys
          })
        }, { local: { scope: "all", include_content: true, cache_ttl_seconds: 86400 }, algolia: { appId: null, apiKey: null, indexName: null } })
      }, {}, { removedProperties: { service: "provider", local_search: "providers.local", algolia_search: "providers.algolia" } }),
      comments: extensionObject({
        provider: deliveredField("extensions.comments.provider", { values: [null,"beaudar","utterances","giscus","twikoo","waline","artalk"], type: ["string","null"], default: literal(null), normalizer: "identity", example: null }),
        title: deliveredField("extensions.comments.title", { type: ["string","null"], default: literal(null), normalizer: "identity", example: "Join discussion" }),
        providers: extensionObject({
          beaudar: providerBag({ repo: "xxx/xxx", "issue-term": "pathname", "issue-number": null, theme: "preferred-color-scheme", label: null, "input-position": "top", "comment-order": "desc", "keep-theme": null, loading: false, branch: "main" }),
          utterances: providerBag({ repo: "xxx/xxx", "issue-term": "pathname", "issue-number": null, theme: "preferred-color-scheme", label: null }),
          giscus: providerBag({ "data-repo": "xxx/xxx", "data-repo-id": null, "data-category": null, "data-category-id": null, "data-mapping": "pathname", "data-strict": 0, "data-reactions-enabled": 1, "data-emit-metadata": 0, "data-input-position": "top", "data-theme": "preferred_color_scheme", "data-lang": "zh-CN", "data-loading": null, crossorigin: "anonymous" }),
          twikoo: providerBag({ envId: "https://xxx" }),
          waline: providerBag({ serverURL: "https://waline.vercel.app", commentCount: true, pageview: false }),
          artalk: providerBag({ server: null, site: "", darkMode: "auto", imageUploader: null })
        }, {}, {
          sealed: false,
          allowedPropertyKeys: ["beaudar", "utterances", "giscus", "twikoo", "waline", "artalk"],
          additionalPropertyKey: "<provider>",
          additionalProperties: commentProvider
        })
      }, {}, { removedProperties: { service: "provider", comment_title: "title", custom_css: "removed" } }),
      tags: extensionObject(tagExtensionSchemas(), {}, { removedProperties: { copy: "localized", image: null, timeline: null, okr: null, chat: null } }),
      features: extensionObject(featureExtensionSchemas(), {}, { removedProperties: { preload: "link_prefetch", ai_summary: null, code_copy: null, adaptive_text: null, cjk_typography: "heti" } }),
      services: extensionObject({
        site_info: extensionObject({
          provider: deliveredField("extensions.services.site_info.provider", { values: [null,"site_info_api"], type: ["string","null"], default: literal("site_info_api"), normalizer: "identity", example: "site_info_api" }),
          providers: extensionObject({
            site_info_api: extensionObject({
              endpoint: deliveredField("extensions.services.site_info.providers.site_info_api.endpoint", { type: ["string"], default: literal("https://api.xaox.cc/site_info/v1?url={href}"), normalizer: "identity", validator: "absolute_http_url", example: "https://api.xaox.cc/site_info/v1?url={href}" })
            }, { endpoint: "https://api.xaox.cc/site_info/v1?url={href}" }, { runtimeKey: "site_info_api" })
          }, { site_info_api: { endpoint: "https://api.xaox.cc/site_info/v1?url={href}" } })
        }, { provider: "site_info_api", providers: { site_info_api: { endpoint: "https://api.xaox.cc/site_info/v1?url={href}" } } }, {
          removedProperties: { api: "providers.site_info_api.endpoint", endpoint: "providers.site_info_api.endpoint" },
          removedNullProperties: { endpoint: "provider" }
        }),
        rating: extensionObject({
          provider: deliveredField("extensions.services.rating.provider", { values: [null,"star_vote"], type: ["string","null"], default: literal("star_vote"), normalizer: "identity", example: "star_vote" }),
          providers: extensionObject({
            star_vote: extensionObject({
              endpoint: deliveredField("extensions.services.rating.providers.star_vote.endpoint", { type: ["string"], default: literal("https://star-vote.xaox.cc/api/rating"), normalizer: "identity", validator: "absolute_http_url", example: "https://star-vote.xaox.cc/api/rating" })
            }, { endpoint: "https://star-vote.xaox.cc/api/rating" }, { runtimeKey: "star_vote" })
          }, { star_vote: { endpoint: "https://star-vote.xaox.cc/api/rating" } })
        }, { provider: "star_vote", providers: { star_vote: { endpoint: "https://star-vote.xaox.cc/api/rating" } } }, {
          removedProperties: { api: "providers.star_vote.endpoint", endpoint: "providers.star_vote.endpoint" },
          removedNullProperties: { endpoint: "provider" }
        }),
        vote: extensionObject({
          provider: deliveredField("extensions.services.vote.provider", { values: [null,"star_vote"], type: ["string","null"], default: literal("star_vote"), normalizer: "identity", example: "star_vote" }),
          providers: extensionObject({
            star_vote: extensionObject({
              endpoint: deliveredField("extensions.services.vote.providers.star_vote.endpoint", { type: ["string"], default: literal("https://star-vote.xaox.cc/api/vote"), normalizer: "identity", validator: "absolute_http_url", example: "https://star-vote.xaox.cc/api/vote" })
            }, { endpoint: "https://star-vote.xaox.cc/api/vote" }, { runtimeKey: "star_vote" })
          }, { star_vote: { endpoint: "https://star-vote.xaox.cc/api/vote" } })
        }, { provider: "star_vote", providers: { star_vote: { endpoint: "https://star-vote.xaox.cc/api/vote" } } }, {
          removedProperties: { api: "providers.star_vote.endpoint", endpoint: "providers.star_vote.endpoint" },
          removedNullProperties: { endpoint: "provider" }
        }),
        contributors: extensionObject({
          provider: deliveredField("extensions.services.contributors.provider", { values: ["github"], type: ["string"], default: literal("github"), normalizer: "identity", example: "github" }),
          providers: extensionObject({
            github: extensionObject({
              repositories: deliveredField("extensions.services.contributors.providers.github.repositories", { type: ["array"], default: literal([]),
                normalizer: "array",
                validator: "contributor_repositories",
                example: [{ source_prefix: "wiki/stellar/", repository: "xaoxuu/hexo-theme-stellar-docs", branch: "main" }],
                items: contributorRepository
              })
            }, { repositories: [] })
          }, { github: { repositories: [] } })
        }, { provider: "github", providers: { github: { repositories: [] } } }, { removedProperties: { edit_page: "providers.github.repositories", edit_this_page: "providers.github.repositories", repositories: "providers.github.repositories", js: "internalized" } }),
        github: extensionObject({
          api_url: deliveredField("extensions.services.github.api_url", { normalization: "require an absolute HTTP(S) URL; preserve the URL", type: ["string"], default: literal("https://api.github.com"), normalizer: "identity", validator: "absolute_http_url", example: "https://api.github.com" }),
          raw_url: deliveredField("extensions.services.github.raw_url", { normalization: "require an absolute HTTP(S) URL; preserve the URL", type: ["string"], default: literal("https://raw.githubusercontent.com"), normalizer: "identity", validator: "absolute_http_url", example: "https://raw.githubusercontent.com" }),
          gist_url: deliveredField("extensions.services.github.gist_url", { normalization: "require an absolute HTTP(S) URL; preserve the URL", type: ["string"], default: literal("https://gist.github.com"), normalizer: "identity", validator: "absolute_http_url", example: "https://gist.github.com" })
        }, { api_url: "https://api.github.com", raw_url: "https://raw.githubusercontent.com", gist_url: "https://gist.github.com" }, { removedProperties: { card_url: "extensions.services.github_card.providers.github_readme_stats.endpoint" } }),
        github_card: extensionObject({
          provider: deliveredField("extensions.services.github_card.provider", { values: ["github_readme_stats"], type: ["string"], default: literal("github_readme_stats"), normalizer: "identity", example: "github_readme_stats" }),
          providers: extensionObject({
            github_readme_stats: extensionObject({
              endpoint: deliveredField("extensions.services.github_card.providers.github_readme_stats.endpoint", { normalization: "require an absolute HTTP(S) URL; preserve the URL", type: ["string"], default: literal("https://github-readme-stats.vercel.app"), normalizer: "identity", validator: "absolute_http_url", example: "https://github-readme-stats.vercel.app" })
            }, { endpoint: "https://github-readme-stats.vercel.app" }, { runtimeKey: "github_readme_stats" })
          }, { github_readme_stats: { endpoint: "https://github-readme-stats.vercel.app" } })
        }, { provider: "github_readme_stats", providers: { github_readme_stats: { endpoint: "https://github-readme-stats.vercel.app" } } }, { removedProperties: { endpoint: "providers.github_readme_stats.endpoint" } })
      }, {})
    },
    removedProperties: { cache: "internalized" }
  });
}

function runtimeProfileKey(profile) {
  return profile.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function layoutProfileSchema(profile) {
  const base = `layout.profiles.${profile}`;
  const removedProperties = { base_dir: "path" };
  if (profile === "error") removedProperties["404"] = "path";
  const hasPath = ["blog_index", "topic_index", "wiki_index", "notebook_index", "author", "error"].includes(profile);
  const hasTabs = ["blog_index", "wiki_index"].includes(profile);

  const properties = {
    navigation: object({
      consumers: LAYOUT_CONSUMERS,
      example: { active_menu: "post" },
      migration: "configuration/layout",
      runtimeKey: "navigation",
      removedProperties: { menu: "active_menu" },
      properties: {
        active_menu: deliveredField(`${base}.navigation.active_menu`, {
          type: ["string", "null"],
          default: literal(LAYOUT_PROFILE_DEFAULTS[profile].activeMenu),
          normalizer: "identity",
          validator: "nullable_kebab_id",
          example: "post"
        })
      }
    }),
    sidebar: object({
      consumers: LAYOUT_CONSUMERS,
      example: { left: ["recent"], right: ["toc"] },
      migration: "configuration/layout",
      runtimeKey: "sidebar",
      removedProperties: { leftbar: "left", rightbar: "right" },
      properties: {
        left: deliveredField(`${base}.sidebar.left`, {
          type: ["array"],
          default: literal(LAYOUT_PROFILE_DEFAULTS[profile].leftWidgets),
          items: { type: ["string", "object"] },
          normalizer: "array",
          example: ["recent"],
          removedProperties: { widgets: "left" }
        }),
        right: deliveredField(`${base}.sidebar.right`, {
          type: ["array"],
          default: literal(LAYOUT_PROFILE_DEFAULTS[profile].rightWidgets),
          items: { type: ["string", "object"] },
          normalizer: "array",
          example: ["toc"],
          removedProperties: { widgets: "right" }
        })
      }
    })
  };

  if (hasPath) {
    properties.path = deliveredField(`${base}.path`, {
      type: ["string"],
      default: literal(LAYOUT_PROFILE_DEFAULTS[profile].path),
      normalizer: "root_relative_path",
      validator: "non_empty_string",
      example: profile === "error" ? "/404.html" : "/blog/"
    });
  } else {
    removedProperties.path = null;
  }

  if (hasTabs) {
    properties.navigation.properties.tabs = deliveredField(`${base}.navigation.tabs`, {
      type: ["array"],
      default: literal(LAYOUT_PROFILE_DEFAULTS[profile].tabs),
      normalizer: "array",
      validator: "navigation_tabs",
      example: [{ title: "朋友文章", url: "/friends/rss/" }],
      items: object({
        consumers: LAYOUT_CONSUMERS,
        example: { title: "朋友文章", url: "/friends/rss/" },
        migration: "configuration/layout",
        requiredProperties: ["title", "url"],
        properties: {
          title: deliveredField(`${base}.navigation.tabs[].title`, {
            type: ["string"],
            default: literal(""),
            normalizer: "identity",
            validator: "non_empty_string",
            example: "朋友文章"
          }),
          url: deliveredField(`${base}.navigation.tabs[].url`, {
            type: ["string"],
            default: literal(""),
            normalizer: "identity",
            validator: "safe_navigation_url",
            example: "/friends/rss/"
          })
        }
      })
    });
  } else {
    properties.navigation.removedProperties.tabs = null;
  }

  if (profile === "home") {
    properties.comments = object({
      default: literal({ enabled: false, title: null, id: null, provider: null, options: {} }),
      consumers: LAYOUT_CONSUMERS,
      example: { enabled: true, provider: "giscus", options: {} },
      migration: "configuration/layout",
      runtimeKey: "comments",
      properties: {
        enabled: deliveredField("layout.profiles.home.comments.enabled", { type: ["boolean"], default: literal(false),
          normalizer: "identity",
          example: true
        }),
        title: deliveredField("layout.profiles.home.comments.title", { type: ["string","null"], default: literal(null),
          normalizer: "identity",
          example: "留言"
        }),
        id: deliveredField("layout.profiles.home.comments.id", { type: ["string","null"], default: literal(null),
          normalizer: "nullable_trimmed_string",
          validator: "nullable_non_empty_string",
          example: "home"
        }),
        provider: deliveredField("layout.profiles.home.comments.provider", { values: [null,"beaudar","utterances","giscus","twikoo","waline","artalk"], type: ["string","null"], default: literal(null),
          normalizer: "identity",
          example: "giscus"
        }),
        options: deliveredField("layout.profiles.home.comments.options", { type: ["object"], default: literal({}),
          normalizer: "parameter_bag",
          example: { "data-repo": "owner/repo" },
          sealed: false
        })
      }
    });
  }

  return object({
    consumers: LAYOUT_CONSUMERS,
    example: {},
    migration: "configuration/layout",
    runtimeKey: runtimeProfileKey(profile),
    removedProperties,
    properties
  });
}

function layoutProfilesSchema() {
  const properties = Object.fromEntries(PROFILE_IDS.map(profile => [profile, layoutProfileSchema(profile)]));
  const removedProperties = Object.fromEntries(
    Object.entries(PROFILE_ID_MIGRATIONS).filter(([legacy, target]) => legacy !== target)
  );
  return deliveredField("layout.profiles", { type: ["object"], default: literal({}),
    normalizer: "object",
    example: { blog_index: { path: "/blog/" } },
    sealed: true,
    removedProperties,
    properties
  });
}

const CONFIG_SCHEMA = deepFreeze(annotateSchema({
  type: ["object"],
  scope: "theme",
  sealed: true,
  migration: "configuration/v2",
  removedProperties: {
    brand: "site.brand",
    menubar: "site.menu",
    footer: "site.footer",
    site_tree: "layout.profiles",
    preconnect: "resources.preconnect",
    canonical: "seo.canonical",
    open_graph: "seo.open_graph",
    structured_data: "seo.structured_data",
    article: "content.article",
    notebook: "content.notebook",
    style: "appearance",
    default: "resources.fallbacks",
    search: "extensions.search",
    comments: "extensions.comments",
    tag_plugins: "extensions.tags",
    dependencies: "extensions.features",
    data_services: "extensions.services",
    data_cache: "internalized",
    plugins: "extensions.features",
    api_host: "extensions.services.github"
  },
  properties: {
    site: object({
      consumers: SITE_CONSUMERS,
      example: {
        brand: { name: "Stellar", tagline: { text: "每个人的独立博客", hover: null }, href: "/" },
        menu: { items: [{ id: "post", title: "博客", icon: "default:documents", url: "/", accent: "#1BCDFC" }] },
        footer: {
          actions: [],
          sections: [],
          content: "本站由 [{author.name}](/) 使用 [{theme.name} {theme.version}]({theme.tree}) 主题创建。"
        }
      },
      migration: "configuration/site",
      runtimeKey: "site",
      properties: {
        brand: object({
          consumers: SITE_CONSUMERS,
          example: {
            image: { src: "/avatar.webp", variant: "avatar", href: "/about/" },
            name: "Stellar",
            wordmark: null,
            tagline: { text: "每个人的独立博客", hover: null },
            href: "/"
          },
          migration: "configuration/site",
          runtimeKey: "brand",
          validator: "brand",
          removedProperties: { url: "href" },
          properties: {
            image: object({
              consumers: SITE_CONSUMERS,
              example: { src: "/avatar.webp", variant: "avatar", href: "/about/" },
              migration: "configuration/site",
              runtimeKey: "image",
              removedProperties: { style: "variant", url: "href", background: null },
              properties: {
                src: deliveredField("site.brand.image.src", { type: ["string","null"], default: literal(null),
                  normalizer: "identity",
                  validator: "nullable_non_empty_string",
                  example: "/avatar.webp"
                }),
                variant: deliveredField("site.brand.image.variant", { values: ["avatar","icon","plain"], type: ["string"], default: literal("avatar"), normalizer: "identity", example: "avatar" }),
                href: deliveredField("site.brand.image.href", { type: ["string","null"], default: literal(null), normalizer: "identity", validator: "nullable_safe_navigation_url", example: "/about/" })
              }
            }),
            name: deliveredField("site.brand.name", { type: ["string","null"], default: literal(null),
              normalizer: "identity",
              example: "Stellar"
            }),
            wordmark: deliveredField("site.brand.wordmark", { type: ["string","null"], default: literal(null), normalizer: "identity", validator: "nullable_non_empty_string", example: "/wordmark.svg" }),
            tagline: object({
              consumers: SITE_CONSUMERS,
              example: { text: "每个人的独立博客", hover: "example.com" },
              migration: "configuration/site",
              runtimeKey: "tagline",
              properties: {
                text: deliveredField("site.brand.tagline.text", { type: ["string","null"], default: literal(null),
                  normalizer: "identity",
                  example: "每个人的独立博客"
                }),
                hover: deliveredField("site.brand.tagline.hover", { type: ["string","null"], default: literal(null), normalizer: "identity", example: "example.com" })
              }
            }),
            href: deliveredField("site.brand.href", { type: ["string","null"], default: literal("/"), normalizer: "identity", validator: "nullable_safe_navigation_url", example: "/" })
          }
        }),
        menu: object({
          consumers: SITE_CONSUMERS,
          example: { items: [{ id: "post", title: "博客", icon: "default:documents", url: "/", accent: "#1BCDFC" }] },
          migration: "configuration/site",
          runtimeKey: "menu",
          properties: {
            items: deliveredField("site.menu.items", { type: ["array"], default: literal([]),
              normalizer: "array",
              validator: "menu_items",
              example: [{ id: "post", title: "博客", icon: "default:documents", url: "/", accent: "#1BCDFC" }],
              items: object({
                consumers: SITE_CONSUMERS,
                example: { id: "post", title: "博客", icon: "default:documents", url: "/", accent: "#1BCDFC" },
                migration: "configuration/site",
                removedProperties: { theme: "accent" },
                requiredProperties: ["id", "url"],
                properties: {
                  id: deliveredField("site.menu.items[].id", { type: ["string"], default: literal(""), normalizer: "identity", validator: "kebab_id", example: "post" }),
                  title: deliveredField("site.menu.items[].title", { type: ["string"], default: literal(""), normalizer: "identity", example: "博客" }),
                  icon: deliveredField("site.menu.items[].icon", { type: ["string","null"], default: literal(null), normalizer: "identity", validator: "nullable_non_empty_string", example: "default:documents" }),
                  url: deliveredField("site.menu.items[].url", { type: ["string"], default: literal(""), normalizer: "identity", validator: "safe_navigation_url", example: "/" }),
                  accent: deliveredField("site.menu.items[].accent", { type: ["string","null"], default: literal(null), normalizer: "identity", validator: "nullable_css_color", example: "#1BCDFC" })
                }
              })
            })
          }
        }),
        footer: object({
          consumers: SITE_CONSUMERS,
          example: { actions: [], sections: [], content: "" },
          migration: "configuration/site",
          runtimeKey: "footer",
          removedProperties: { social: "actions", sitemap: "sections" },
          properties: {
            actions: deliveredField("site.footer.actions", { type: ["array"], default: literal([]),
              normalizer: "array",
              validator: "footer_actions",
              example: [{ type: "link", icon: "default:github", title: "GitHub", url: "https://github.com/" }],
              items: object({
                consumers: SITE_CONSUMERS,
                normalizer: "footer_action",
                example: { type: "link", icon: "default:github", title: "GitHub", url: "https://github.com/" },
                migration: "configuration/site",
                sealed: true,
                requiredProperties: ["type"],
                properties: {
                  type: deliveredField("site.footer.actions[].type", { values: ["link","button","dropdown","spacer"], type: ["string"], default: literal("link"), normalizer: "identity", example: "link" }),
                  icon: deliveredField("site.footer.actions[].icon", { type: ["string","null"], default: literal(null), normalizer: "identity", validator: "nullable_non_empty_string", example: "default:github" }),
                  title: deliveredField("site.footer.actions[].title", { type: ["string"], default: literal(""), normalizer: "identity", example: "GitHub" }),
                  url: deliveredField("site.footer.actions[].url", { type: ["string","null"], default: literal(null), normalizer: "identity", validator: "nullable_safe_navigation_url", example: "https://github.com/" }),
                  onclick: deliveredField("site.footer.actions[].onclick", { type: ["string","null"], default: literal(null), normalizer: "identity", validator: "nullable_non_empty_string", example: "window.setColorScheme?.('light')" }),
                  items: deliveredField("site.footer.actions[].items", { type: ["array"], default: literal([]),
                    normalizer: "array",
                    example: [{ type: "link", icon: "default:github", title: "GitHub", url: "https://github.com/" }],
                    items: object({
                      consumers: SITE_CONSUMERS,
                      normalizer: "footer_action_item",
                      example: { type: "link", icon: "default:github", title: "GitHub", url: "https://github.com/" },
                      migration: "configuration/site",
                      requiredProperties: ["type", "title"],
                      properties: {
                        type: deliveredField("site.footer.actions[].items[].type", { values: ["link","button"], type: ["string"], default: literal("link"), normalizer: "identity", example: "link" }),
                        icon: deliveredField("site.footer.actions[].items[].icon", { type: ["string","null"], default: literal(null), normalizer: "identity", validator: "nullable_non_empty_string", example: "default:github" }),
                        title: deliveredField("site.footer.actions[].items[].title", { type: ["string"], default: literal(""), normalizer: "identity", validator: "non_empty_string", example: "GitHub" }),
                        url: deliveredField("site.footer.actions[].items[].url", { type: ["string","null"], default: literal(null), normalizer: "identity", validator: "nullable_safe_navigation_url", example: "https://github.com/" }),
                        onclick: deliveredField("site.footer.actions[].items[].onclick", { type: ["string","null"], default: literal(null), normalizer: "identity", validator: "nullable_non_empty_string", example: "window.setColorScheme?.('light')" })
                      }
                    })
                  })
                },
                removedProperties: { variant: "type", action: null }
              })
            }),
            sections: deliveredField("site.footer.sections", { type: ["array"], default: literal([]),
              normalizer: "array",
              example: [{ title: "博客", items: [{ title: "归档", url: "/blog/archives/" }] }],
              items: object({
                consumers: SITE_CONSUMERS,
                example: { title: "博客", items: [{ title: "归档", url: "/blog/archives/" }] },
                migration: "configuration/site",
                requiredProperties: ["title", "items"],
                properties: {
                  title: deliveredField("site.footer.sections[].title", { type: ["string"], default: literal(""), normalizer: "identity", validator: "non_empty_string", example: "博客" }),
                  items: deliveredField("site.footer.sections[].items", { type: ["array"], default: literal([]),
                    normalizer: "array",
                    example: [{ title: "归档", url: "/blog/archives/" }],
                    items: object({
                      consumers: SITE_CONSUMERS,
                      example: { title: "归档", url: "/blog/archives/" },
                      migration: "configuration/site",
                      requiredProperties: ["title", "url"],
                      properties: {
                        title: deliveredField("site.footer.sections[].items[].title", { type: ["string"], default: literal(""), normalizer: "identity", validator: "non_empty_string", example: "归档" }),
                        url: deliveredField("site.footer.sections[].items[].url", { type: ["string"], default: literal(""), normalizer: "identity", validator: "safe_navigation_url", example: "/blog/archives/" })
                      }
                    })
                  })
                }
              })
            }),
            content: deliveredField("site.footer.content", { type: ["string"], default: literal("本站由 [{author.name}](/) 使用 [{theme.name} {theme.version}]({theme.tree}) 主题创建。"),
              normalizer: "trusted_text",
              example: "本站由 [{author.name}](/) 使用 [{theme.name} {theme.version}]({theme.tree}) 主题创建。"
            })
          }
        })
      }
    }),
    layout: object({
      consumers: LAYOUT_CONSUMERS,
      example: { profiles: { blog_index: { path: "/blog/" } } },
      migration: "configuration/layout",
      runtimeKey: "layout",
      properties: {
        profiles: layoutProfilesSchema()
      }
    }),
    content: object({
      consumers: CONTENT_CONSUMERS,
      example: { article: { listing: { card_layout: "hero" } }, notebook: { listing: { sort: { field: "updated", direction: "desc" } } } },
      migration: "configuration/content",
      runtimeKey: "content",
      properties: {
        article: object({
          consumers: CONTENT_CONSUMERS,
          example: { style: "tech", paragraph_indent: "auto", listing: { pinned_layout: "carousel", card_layout: "hero" } },
          migration: "configuration/content",
          runtimeKey: "article",
          removedProperties: {
            pin_style: "listing.pinned_layout",
            cover_ratio: "listing.cover_ratio",
            card_style: "listing.card_layout",
            banner_ratio: "banner.ratio",
            auto_excerpt: "listing.excerpt_length",
            category_color: "category_colors",
            license: "footer.license",
            share: "footer.share",
            reading_time: "show_reading_time",
            card_tags: "listing.show_tags",
            tags: "footer.show_tags",
            type: "style",
            indent: "paragraph_indent",
            ai_label: null,
            related_posts: "related_posts_limit",
            show_tags: "footer.show_tags"
          },
          properties: {
            style: deliveredField("content.article.style", { values: ["tech","story"], type: ["string"], default: literal("tech"), normalizer: "identity", example: "tech" }),
            paragraph_indent: deliveredField("content.article.paragraph_indent", { values: ["auto","always","never"], type: ["string"], default: literal("auto"), normalizer: "identity", example: "auto" }),
            listing: object({
              consumers: CONTENT_CONSUMERS,
              example: { pinned_layout: "carousel", card_layout: "hero", cover_ratio: 2, excerpt_length: 128, show_tags: false },
              migration: "configuration/content",
              runtimeKey: "listing",
              removedProperties: { pin_style: "pinned_layout", card_style: "card_layout", auto_excerpt: "excerpt_length", card_tags: "show_tags" },
              properties: {
                pinned_layout: deliveredField("content.article.listing.pinned_layout", { values: ["carousel","flat"], type: ["string"], default: literal("carousel"), normalizer: "identity", example: "carousel" }),
                card_layout: deliveredField("content.article.listing.card_layout", { values: ["hero","classic"], type: ["string"], default: literal("hero"), normalizer: "identity", example: "hero" }),
                cover_ratio: deliveredField("content.article.listing.cover_ratio", { exclusiveMinimum: 0, type: ["number"], default: literal(2), normalizer: "identity", example: 2 }),
                excerpt_length: deliveredField("content.article.listing.excerpt_length", { minimum: 0, type: ["number"], default: literal(128), normalizer: "identity", validator: "non_negative_integer", example: 128 }),
                show_tags: deliveredField("content.article.listing.show_tags", { type: ["boolean"], default: literal(false), normalizer: "identity", example: false })
              }
            }),
            banner: object({
              consumers: CONTENT_CONSUMERS,
              example: { ratio: 2.5 },
              migration: "configuration/content",
              runtimeKey: "banner",
              properties: {
                ratio: deliveredField("content.article.banner.ratio", { exclusiveMinimum: 0, type: ["number"], default: literal(2.5), normalizer: "identity", example: 2.5 })
              }
            }),
            category_colors: deliveredField("content.article.category_colors", { type: ["object"], default: literal({"探索号":"#f44336"}),
              normalizer: "object",
              example: { "探索号": "#f44336" },
              sealed: false,
              additionalPropertyKey: "<category>",
              additionalProperties: deliveredField("content.article.category_colors.<category>", { type: ["string"], default: literal(""),
                normalizer: "identity",
                validator: "css_color",
                example: "#f44336"
              })
            }),
            footer: object({
              consumers: CONTENT_CONSUMERS,
              example: { license: true, share: ["wechat", "link"], show_tags: true },
              migration: "configuration/content",
              runtimeKey: "footer",
              properties: {
                license: deliveredField("content.article.footer.license", { type: ["boolean","string"], default: literal("本文采用 [署名-非商业性使用-相同方式共享 4.0 国际](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可协议，转载请注明出处。"), normalizer: "identity", validator: "license_value", example: false }),
                share: deliveredField("content.article.footer.share", { items: {"type":["string"],"values":["wechat","weibo","email","link"],"description":"content.article.footer.share[] 配置。","yaml":{"order":0}}, normalization: "trim; stable-deduplicate; empty array disables sharing", type: ["array"], default: literal([]), normalizer: "trimmed_string_list", example: ["wechat", "link"] }),
                show_tags: deliveredField("content.article.footer.show_tags", { type: ["boolean"], default: literal(true), normalizer: "identity", example: true })
              }
            }),
            related_posts_limit: deliveredField("content.article.related_posts_limit", { minimum: 0, normalization: "non-negative integer; 0 disables related posts", type: ["number"], default: literal(0), normalizer: "identity", validator: "non_negative_integer", example: 0 }),
            show_reading_time: deliveredField("content.article.show_reading_time", { type: ["boolean"], default: literal(false), normalizer: "identity", example: false })
          }
        }),
        notebook: object({
          consumers: CONTENT_CONSUMERS,
          example: { listing: { excerpt_length: 128, per_page: null, sort: { field: "updated", direction: "desc" } }, tag_icons: {} },
          migration: "configuration/content",
          runtimeKey: "notebook",
          properties: {
            listing: object({
              consumers: CONTENT_CONSUMERS,
              example: { excerpt_length: 128, per_page: null, sort: { field: "updated", direction: "desc" } },
              migration: "configuration/content",
              runtimeKey: "listing",
              removedProperties: { order_by: "sort" },
              properties: {
                excerpt_length: deliveredField("content.notebook.listing.excerpt_length", { minimum: 0, type: ["number"], default: literal(128), normalizer: "identity", validator: "non_negative_integer", example: 128 }),
                per_page: deliveredField("content.notebook.listing.per_page", { minimum: 0, type: ["number","null"], default: literal(null), normalizer: "identity", validator: "nullable_non_negative_integer", example: null }),
                sort: object({
                  consumers: CONTENT_CONSUMERS,
                  example: { field: "updated", direction: "desc" },
                  migration: "configuration/content",
                  runtimeKey: "sort",
                  properties: {
                    field: deliveredField("content.notebook.listing.sort.field", { values: ["date","updated","title"], type: ["string"], default: literal("updated"), normalizer: "identity", example: "updated" }),
                    direction: deliveredField("content.notebook.listing.sort.direction", { values: ["asc","desc"], type: ["string"], default: literal("desc"), normalizer: "identity", example: "desc" })
                  }
                })
              }
            }),
            tag_icons: deliveredField("content.notebook.tag_icons", { type: ["object"], default: literal({}),
              normalizer: "object",
              validator: "non_empty_record_keys",
              example: { tools: "quot:hashtag" },
              sealed: false,
              additionalPropertyKey: "<tag>",
              additionalProperties: deliveredField("content.notebook.tag_icons.<tag>", { type: ["string"], default: literal(""),
                normalizer: "identity",
                validator: "non_empty_string",
                example: "quot:hashtag"
              })
            }),
            footer: object({
              consumers: CONTENT_CONSUMERS,
              example: { license: null, share: null },
              migration: "configuration/content",
              runtimeKey: "footer",
              properties: {
                license: deliveredField("content.notebook.footer.license", { type: ["string","boolean","null"], default: literal(null), normalizer: "identity", validator: "license_override", example: null }),
                share: deliveredField("content.notebook.footer.share", { items: {"type":["string"],"values":["wechat","weibo","email","link"],"description":"content.notebook.footer.share[] 配置。","yaml":{"order":0}}, normalization: "trim; stable-deduplicate; null inherits article share; [] disables", type: ["array","null"], default: literal(null), normalizer: "nullable_trimmed_string_list", example: null })
              }
            })
          }
        })
      }
    }),
    appearance: object({
      consumers: APPEARANCE_CONSUMERS,
      example: { color_scheme: "auto", shape: { radius: { card: "16px" } } },
      migration: "configuration/appearance",
      runtimeKey: "appearance",
      removedProperties: {
        prefers_theme: "color_scheme",
        "font-size": "typography.font_size",
        "font-family": "typography.font_family",
        "text-align": "typography.content_align",
        prefix: "removed",
        "border-radius": "shape.radius",
        "corner-shape": "shape.corner",
        color: "colors",
        animated_avatar: "motion.avatar",
        codeblock: "code_block",
        loading: "language files",
        gradient: "gradients",
        leftbar: "backgrounds.sidebar",
        site: "backgrounds.page",
        header_prefix: "typography.heading_prefixes",
        error_page: "resources.error_page.image"
      },
      properties: {
        color_scheme: deliveredField("appearance.color_scheme", { values: ["auto","light","dark"], type: ["string"], default: literal("auto"), normalizer: "identity", example: "auto" }),
        typography: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { font_size: { root: "16px" }, content_align: "left", heading_prefixes: { h2: "#" } },
          migration: "configuration/appearance#typography",
          runtimeKey: "typography",
          removedProperties: { "font-size": "font_size", "font-family": "font_family", "text-align": "content_align", text_align: "content_align", header_prefix: "heading_prefixes" },
          properties: {
            font_size: object({
              consumers: APPEARANCE_CONSUMERS,
              example: { root: "16px", inline_code: "85%", code_block: "0.8125rem" },
              migration: "configuration/appearance#typography",
              runtimeKey: "fontSize",
              removedProperties: { code: "inline_code", codeblock: "code_block" },
              properties: {
                root: deliveredField("appearance.typography.font_size.root", { type: ["string"], default: literal("16px"), normalizer: "identity", validator: "css_length", example: "16px" }),
                inline_code: deliveredField("appearance.typography.font_size.inline_code", { type: ["string"], default: literal("85%"), normalizer: "identity", validator: "css_length", example: "85%" }),
                code_block: deliveredField("appearance.typography.font_size.code_block", { type: ["string"], default: literal("0.8125rem"), normalizer: "identity", validator: "css_length", example: "0.8125rem" })
              }
            }),
            font_family: object({
              consumers: APPEARANCE_CONSUMERS,
              example: { body: "system-ui, sans-serif", code: "Menlo, monospace" },
              migration: "configuration/appearance#typography",
              runtimeKey: "fontFamily",
              removedProperties: { inline_code: "code", code_block: "code", codeblock: "code" },
              properties: {
                body: deliveredField("appearance.typography.font_family.body", { type: ["string"], default: literal("system-ui, \"Microsoft Yahei\", \"Segoe UI\", Arial, sans-serif"), normalizer: "identity", validator: "css_font_family", example: "system-ui, sans-serif" }),
                code: deliveredField("appearance.typography.font_family.code", { type: ["string"], default: literal("Menlo, Monaco, Consolas, system-ui, monospace, sans-serif"), normalizer: "identity", validator: "css_font_family", example: "Menlo, monospace" })
              }
            }),
            content_align: deliveredField("appearance.typography.content_align", { values: ["left","center","right","justify"], type: ["string"], default: literal("left"), normalizer: "identity", example: "left" }),
            heading_prefixes: deliveredField("appearance.typography.heading_prefixes", { type: ["object"], default: literal({"h2":"#","h3":"=","h4":"|","h5":":"}),
              normalizer: "object",
              example: { h2: "#", h3: "=", h4: "|", h5: ":" },
              sealed: true,
              properties: {
                h2: deliveredField("appearance.typography.heading_prefixes.h2", { type: ["string"], default: literal("#"), normalizer: "identity", example: "#" }),
                h3: deliveredField("appearance.typography.heading_prefixes.h3", { type: ["string"], default: literal("="), normalizer: "identity", example: "=" }),
                h4: deliveredField("appearance.typography.heading_prefixes.h4", { type: ["string"], default: literal("|"), normalizer: "identity", example: "|" }),
                h5: deliveredField("appearance.typography.heading_prefixes.h5", { type: ["string"], default: literal(":"), normalizer: "identity", example: ":" })
              }
            })
          }
        }),
        shape: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { corner: "superellipse(1.25)", radius: { card: "16px" } },
          migration: "configuration/appearance#shape",
          runtimeKey: "shape",
          removedProperties: { "corner-shape": "corner", "border-radius": "radius" },
          properties: {
            corner: deliveredField("appearance.shape.corner", { type: ["string"], default: literal("superellipse(1.25)"), normalizer: "identity", validator: "corner_shape", example: "superellipse(1.25)" }),
            radius: object({
              consumers: APPEARANCE_CONSUMERS,
              example: { card_large: "24px", card: "16px", card_small: "12px" },
              migration: "configuration/appearance#shape",
              runtimeKey: "radius",
              removedProperties: { "card-l": "card_large", "card-s": "card_small", "image-l": "image_large", "image-s": "image_small" },
              properties: {
                card_large: deliveredField("appearance.shape.radius.card_large", { type: ["string"], default: literal("24px"), normalizer: "identity", validator: "css_length", example: "24px" }),
                card: deliveredField("appearance.shape.radius.card", { type: ["string"], default: literal("16px"), normalizer: "identity", validator: "css_length", example: "16px" }),
                card_small: deliveredField("appearance.shape.radius.card_small", { type: ["string"], default: literal("12px"), normalizer: "identity", validator: "css_length", example: "12px" }),
                bar: deliveredField("appearance.shape.radius.bar", { type: ["string"], default: literal("12px"), normalizer: "identity", validator: "css_length", example: "12px" }),
                image_large: deliveredField("appearance.shape.radius.image_large", { type: ["string"], default: literal("24px"), normalizer: "identity", validator: "css_length", example: "24px" }),
                image: deliveredField("appearance.shape.radius.image", { type: ["string"], default: literal("16px"), normalizer: "identity", validator: "css_length", example: "16px" }),
                image_small: deliveredField("appearance.shape.radius.image_small", { type: ["string"], default: literal("8px"), normalizer: "identity", validator: "css_length", example: "8px" })
              }
            })
          }
        }),
        colors: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { primary: "hsl(192 98% 55%)", accent: "hsl(14 100% 57%)", link: "hsl(207 90% 54%)" },
          migration: "configuration/appearance#colors",
          runtimeKey: "colors",
          removedProperties: { theme: "primary" },
          properties: {
            primary: deliveredField("appearance.colors.primary", { type: ["string"], default: literal("hsl(192 98% 55%)"), normalizer: "identity", validator: "css_color", example: "hsl(192 98% 55%)" }),
            accent: deliveredField("appearance.colors.accent", { type: ["string"], default: literal("hsl(14 100% 57%)"), normalizer: "identity", validator: "css_color", example: "hsl(14 100% 57%)" }),
            link: deliveredField("appearance.colors.link", { type: ["string"], default: literal("hsl(207 90% 54%)"), normalizer: "identity", validator: "css_color", example: "hsl(207 90% 54%)" })
          }
        }),
        gradients: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { primary_action: "linear-gradient(to right, #00f, #0ff)" },
          migration: "configuration/appearance#gradients",
          runtimeKey: "gradients",
          removedProperties: { start: "primary_action", searchbar: "search_bar", avatar: "avatar_ring", angle: null },
          properties: {
            primary_action: deliveredField("appearance.gradients.primary_action", { type: ["string"], default: literal("linear-gradient(to right, hsl(215, 95%, 64%), hsl(195, 95%, 60%), hsl(165, 95%, 56%), hsl(165, 95%, 56%), hsl(195 95% 60%), hsl(215, 95%, 64%))"), normalizer: "identity", validator: "css_gradient", example: "linear-gradient(to right, #00f, #0ff)" }),
            search_bar: deliveredField("appearance.gradients.search_bar", { type: ["string"], default: literal("linear-gradient(to right, #04f3ff, #08ffc6, #ddf730, #ffbd19, #ff1fe0, #c418ff, #3b5bff, #04f3ff)"), normalizer: "identity", validator: "css_gradient", example: "linear-gradient(to right, #0ff, #f0f)" }),
            avatar_ring: deliveredField("appearance.gradients.avatar_ring", { type: ["string"], default: literal("conic-gradient(from 0deg, #04f3ff, #08ffc6, #ddf730, #ffbd19, #ff1fe0, #c418ff, #3b5bff, #04f3ff)"), normalizer: "identity", validator: "css_gradient", example: "conic-gradient(from 0deg, #0ff, #f0f, #0ff)" })
          }
        }),
        motion: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { page_transition: true, avatar: "auto" },
          migration: "configuration/appearance#motion",
          runtimeKey: "motion",
          removedProperties: { animated_avatar: "avatar" },
          properties: {
            page_transition: deliveredField("appearance.motion.page_transition", { type: ["boolean"], default: literal(true), normalizer: "identity", example: true }),
            avatar: deliveredField("appearance.motion.avatar", { values: ["auto","always","never"], type: ["string"], default: literal("auto"), normalizer: "identity", example: "auto" })
          }
        }),
        code_block: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { scrollbar_width: "4px", highlight_stylesheet: "https://example.com/highlight.css" },
          migration: "configuration/appearance#code-block",
          runtimeKey: "codeBlock",
          removedProperties: { scrollbar: "scrollbar_width", highlightjs_theme: "highlight_stylesheet", highlight_theme: "highlight_stylesheet" },
          properties: {
            scrollbar_width: deliveredField("appearance.code_block.scrollbar_width", { type: ["string"], default: literal("4px"), normalizer: "identity", validator: "css_length", example: "4px" }),
            highlight_stylesheet: deliveredField("appearance.code_block.highlight_stylesheet", { type: ["string","null"], default: literal("https://gcore.jsdelivr.net/gh/highlightjs/cdn-release@11.9/build/styles/atom-one-dark.min.css"), normalizer: "identity", validator: "nullable_resource", example: "https://example.com/highlight.css" })
          }
        }),
        backgrounds: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { sidebar: { surface: "card", opacity: 0.8 }, page: { image: null } },
          migration: "configuration/appearance#backgrounds",
          runtimeKey: "backgrounds",
          removedProperties: { leftbar: "sidebar", site: "page" },
          properties: {
            sidebar: object({
              consumers: APPEARANCE_CONSUMERS,
              example: { surface: "card", color: { light: "var(--card)", dark: "var(--card)" }, opacity: 0.8 },
              migration: "configuration/appearance#backgrounds",
              runtimeKey: "sidebar",
              removedProperties: {
                "ui-style": "surface",
                "background-color-light": "color.light",
                "background-color-dark": "color.dark",
                "background-image": "image",
                "background-opacity": "opacity",
                "blur-px": "backdrop.radius",
                "blur-bg": "backdrop.overlay",
                blur: "backdrop"
              },
              properties: {
                surface: deliveredField("appearance.backgrounds.sidebar.surface", { values: ["glass","card"], type: ["string"], default: literal("card"), normalizer: "identity", example: "card" }),
                color: object({
                  consumers: APPEARANCE_CONSUMERS,
                  example: { light: "var(--card)", dark: "var(--card)" },
                  migration: "configuration/appearance#backgrounds",
                  runtimeKey: "color",
                  properties: {
                    light: deliveredField("appearance.backgrounds.sidebar.color.light", { type: ["string"], default: literal("var(--card)"), normalizer: "identity", validator: "css_color", example: "var(--card)" }),
                    dark: deliveredField("appearance.backgrounds.sidebar.color.dark", { type: ["string"], default: literal("var(--card)"), normalizer: "identity", validator: "css_color", example: "var(--card)" })
                  }
                }),
                image: deliveredField("appearance.backgrounds.sidebar.image", { type: ["string","null"], default: literal("https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.13/image/sidebar-bg1@small.jpg"), normalizer: "identity", validator: "nullable_resource", example: "/sidebar.webp" }),
                opacity: deliveredField("appearance.backgrounds.sidebar.opacity", { minimum: 0, maximum: 1, type: ["number"], default: literal(0.8), normalizer: "identity", example: 0.8 }),
                backdrop: object({
                  consumers: APPEARANCE_CONSUMERS,
                  example: { radius: "100px", overlay: "var(--bg-a60)" },
                  migration: "configuration/appearance#backgrounds",
                  runtimeKey: "backdrop",
                  properties: {
                    radius: deliveredField("appearance.backgrounds.sidebar.backdrop.radius", { type: ["string"], default: literal("100px"), normalizer: "identity", validator: "css_length", example: "100px" }),
                    overlay: deliveredField("appearance.backgrounds.sidebar.backdrop.overlay", { type: ["string"], default: literal("var(--bg-a60)"), normalizer: "identity", validator: "css_color", example: "var(--bg-a60)" })
                  }
                })
              }
            }),
            page: object({
              consumers: APPEARANCE_CONSUMERS,
              example: { image: null, backdrop: { radius: "100px", overlay: "var(--bg-a75)", saturation: "300%" } },
              migration: "configuration/appearance#backgrounds",
              runtimeKey: "page",
              removedProperties: { "background-image": "image", "blur-px": "backdrop.radius", "blur-bg": "backdrop.overlay", "blur-sat": "backdrop.saturation", blur: "backdrop" },
              properties: {
                image: deliveredField("appearance.backgrounds.page.image", { type: ["string","null"], default: literal(null), normalizer: "identity", validator: "nullable_resource", example: null }),
                backdrop: object({
                  consumers: APPEARANCE_CONSUMERS,
                  example: { radius: "100px", overlay: "var(--bg-a75)", saturation: "300%" },
                  migration: "configuration/appearance#backgrounds",
                  runtimeKey: "backdrop",
                  properties: {
                    radius: deliveredField("appearance.backgrounds.page.backdrop.radius", { type: ["string"], default: literal("100px"), normalizer: "identity", validator: "css_length", example: "100px" }),
                    overlay: deliveredField("appearance.backgrounds.page.backdrop.overlay", { type: ["string"], default: literal("var(--bg-a75)"), normalizer: "identity", validator: "css_color", example: "var(--bg-a75)" }),
                    saturation: deliveredField("appearance.backgrounds.page.backdrop.saturation", { type: ["string"], default: literal("300%"), normalizer: "identity", validator: "css_percentage", example: "300%" })
                  }
                })
              }
            })
          }
        })
      }
    }),
    seo: object({
      consumers: SEO_CONSUMERS,
      example: {
        canonical: { host: "example.com", allowed_hosts: ["mirror.example.com"] },
        open_graph: { enabled: true, twitter_id: "stellar" },
        structured_data: { same_as: ["https://github.com/xaoxuu"] }
      },
      migration: "configuration/seo",
      runtimeKey: "seo",
      properties: {
        canonical: object({
          consumers: SEO_CONSUMERS,
          example: { host: "example.com", allowed_hosts: ["mirror.example.com"] },
          migration: "configuration/seo#canonical",
          runtimeKey: "canonical",
          removedProperties: {
            original_host: "host",
            official_hosts: "allowed_hosts",
            originalHost: "host",
            officialHosts: "allowed_hosts"
          },
          properties: {
            host: deliveredField("seo.canonical.host", { normalization: "trim; remove scheme and trailing slash; null disables canonical output", type: ["string","null"], default: literal(null),
              normalizer: "nullable_host",
              example: "example.com"
            }),
            allowed_hosts: deliveredField("seo.canonical.allowed_hosts", { items: {"type":["string"],"description":"seo.canonical.allowed_hosts[] 配置。","yaml":{"order":0}}, normalization: "trim hosts; remove empty values; stable-deduplicate; replace on site override", type: ["array"], default: literal(["localhost"]),
              normalizer: "host_list",
              example: ["mirror.example.com", "localhost"]
            })
          }
        }),
        open_graph: object({
          consumers: SEO_CONSUMERS,
          example: { enabled: true, twitter_id: "stellar" },
          migration: "configuration/seo#open-graph",
          runtimeKey: "openGraph",
          removedProperties: { enable: "enabled", twitterId: "twitter_id" },
          properties: {
            enabled: deliveredField("seo.open_graph.enabled", { type: ["boolean"], default: literal(true),
              normalizer: "identity",
              example: true
            }),
            twitter_id: deliveredField("seo.open_graph.twitter_id", { type: ["string","null"], default: literal(null),
              normalizer: "identity",
              example: "stellar"
            })
          }
        }),
        structured_data: object({
          consumers: SEO_CONSUMERS,
          example: { same_as: ["https://github.com/xaoxuu"] },
          migration: "configuration/seo#structured-data",
          runtimeKey: "structuredData",
          removedProperties: { links: "same_as", sameAs: "same_as" },
          properties: {
            same_as: deliveredField("seo.structured_data.same_as", { items: {"type":["string"],"description":"seo.structured_data.same_as[] 配置。","yaml":{"order":0}}, normalization: "trim URLs; remove empty values; stable-deduplicate; replace on site override", type: ["array"], default: literal([]),
              normalizer: "trimmed_string_list",
              example: ["https://github.com/xaoxuu"]
            })
          }
        })
      }
    }),
    resources: object({
      consumers: [...PRECONNECT_CONSUMERS, ...RESOURCE_CONSUMERS],
      example: { preconnect: ["https://cdn.jsdelivr.net"], fallbacks: { cover: "/cover.svg" }, error_page: { image: "/404.svg" } },
      migration: "configuration/resources",
      runtimeKey: "resources",
      properties: {
        preconnect: deliveredField("resources.preconnect", { items: {"type":["string"],"description":"resources.preconnect[] 配置。","yaml":{"order":0}}, normalization: "normalize origins; stable-deduplicate; replace on site override", type: ["array"], default: literal([]),
          normalizer: "origin_list",
          example: ["https://cdn.jsdelivr.net"]
        }),
        fallbacks: object({
          consumers: RESOURCE_CONSUMERS,
          example: { avatar: "/avatar.svg", link_card: "/link.svg", cover: "/cover.svg" },
          migration: "configuration/resources#fallbacks",
          runtimeKey: "fallbacks",
          removedProperties: {
            link: "link_card",
            project: null,
            topic: null,
            image_onerror: null,
            project_icon: null,
            banner: null,
            topic_cover: null,
            image: null,
            error_page: "resources.error_page.image"
          },
          properties: {
            avatar: deliveredField("resources.fallbacks.avatar", { type: ["string"], default: literal("https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/avatar/round/3442075.svg"), normalizer: "identity", validator: "resource", example: "/avatar.svg" }),
            link_card: deliveredField("resources.fallbacks.link_card", { type: ["string"], default: literal("https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/link/8f277b4ee0ecd.svg"), normalizer: "identity", validator: "resource", example: "/link.svg" }),
            cover: deliveredField("resources.fallbacks.cover", { type: ["string"], default: literal("https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/cover/76b86c0226ffd.svg"), normalizer: "identity", validator: "resource", example: "/cover.svg" })
          }
        }),
        error_page: object({
          consumers: RESOURCE_CONSUMERS,
          example: { image: "/404.svg" },
          migration: "configuration/resources#error-page",
          runtimeKey: "errorPage",
          properties: {
            image: deliveredField("resources.error_page.image", { type: ["string","null"], default: literal("https://gcore.jsdelivr.net/gh/cdn-x/placeholder@1.0.12/404/1c830bfcd517d.svg"), normalizer: "identity", validator: "nullable_resource", example: "/404.svg" })
          }
        })
      }
    }),
    extensions: extensionsSchema(),
    inject: object({
      consumers: INJECT_CONSUMERS,
      example: { head_end: "<meta name=\"example\" content=\"stellar\">", body_end: "<script>console.log('stellar')</script>" },
      migration: "configuration/inject",
      runtimeKey: "inject",
      removedProperties: { head: "head_end", script: "body_end" },
      properties: {
        head_end: deliveredField("inject.head_end", { normalization: "preserve trusted source text exactly; append page text after site text with one newline", type: ["string"], default: literal(""),
          normalizer: "trusted_text",
          example: "<meta name=\"example\" content=\"stellar\">"
        }),
        body_end: deliveredField("inject.body_end", { normalization: "preserve trusted source text exactly; append page text after site text with one newline", type: ["string"], default: literal(""),
          normalizer: "trusted_text",
          example: "<script>console.log('stellar')</script>"
        })
      }
    })
  }
}));

module.exports = {
  CONFIG_SCHEMA,
  literal
};
