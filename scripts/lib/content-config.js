'use strict';

const GALAXY_OPTION_TYPES = Object.freeze({
  focal: 'number_array',
  rotation: 'number_array',
  starSpeed: 'number',
  density: 'number',
  hueShift: 'number',
  disableAnimation: 'boolean',
  speed: 'number',
  mouseInteraction: 'boolean',
  glowIntensity: 'number',
  saturation: 'number',
  mouseRepulsion: 'boolean',
  repulsionStrength: 'number',
  twinkleIntensity: 'number',
  rotationSpeed: 'number',
  autoCenterRepulsion: 'number',
  transparent: 'boolean'
});

const LEGACY_COLLECTION_FIELDS = Object.freeze([
  'title', 'subtitle', 'icon', 'cover', 'coverpage', 'background', 'animation',
  'banner', 'leftbar', 'rightbar', 'menu_id', 'header', 'wiki_home', 'search',
  'menu', 'type', 'indent', 'author', 'ai_label', 'references', 'license', 'share',
  'comment_title', 'repo', 'branch', 'available', 'start', 'base_dir', 'preview',
  'actions'
]);

const LEGACY_PAGE_FIELDS = Object.freeze([
  'wiki', 'topic', 'notebook', 'cover', 'h1', 'subtitle', 'banner_info', 'leftbar',
  'rightbar', 'menu_id', 'header', 'wiki_home', 'search', 'menu', 'logo', 'type',
  'indent', 'author', 'ai_label', 'references', 'license', 'share', 'comment_title',
  'comment_id', 'comments_service', 'indexing', 'pin', 'sticky', 'repo', 'branch',
  'breadcrumb', 'nav_tabs', 'poster'
]);

const COLLECTION_FIELDS = Object.freeze([
  'name', 'headline', 'tagline', 'description', 'tags', 'audience', 'identity',
  'card', 'hero', 'sidebar', 'navigation', 'article', 'footer', 'comments',
  'source', 'routing', 'listing', 'note', 'tree'
]);

const PAGE_FIELDS = Object.freeze([
  '_content', 'date', 'updated', 'title', 'layout', 'permalink', 'published',
  'tags', 'categories', 'description', 'excerpt', 'photos', 'robots', 'sitemap',
  'keywords', 'open_graph', 'lang', 'language', 'abbrlink', 'collection', 'card',
  'banner', 'sidebar', 'navigation', 'article', 'footer', 'comments', 'visibility',
  'listing', 'source', 'katex', 'mathjax', 'mermaid', 'inject', 'disableNunjucks'
]);

const COMMENT_SERVICE_FIELDS = Object.freeze([
  'enabled', 'title', 'id', 'service', 'beaudar', 'utterances', 'giscus',
  'twikoo', 'waline', 'artalk'
]);

const CONTENT_MODEL_FIELDS = Object.freeze({
  article: Object.freeze(["type", "indent", "author", "ai_label"]),
  banner: Object.freeze(["enabled", "image", "avatar", "headline", "tagline"]),
  brand: Object.freeze(["image", "name", "tagline", "url"]),
  brandImage: Object.freeze(["src", "style", "url", "background"]),
  card: Object.freeze(["cover", "tagline"]),
  comments: COMMENT_SERVICE_FIELDS,
  footer: Object.freeze(["references", "license", "share"]),
  navigation: Object.freeze(["menu", "breadcrumb"]),
  sidebar: Object.freeze(["left", "right"]),
  sidebarLeft: Object.freeze(["widgets", "search", "menu", "brand", "wiki_home"]),
  sidebarRight: Object.freeze(["widgets"]),
  source: Object.freeze(["repository", "branch"]),
  visibility: Object.freeze(["listed", "searchable"])
});

const POST_PROFILE_FIELDS = Object.freeze({
  article: Object.freeze([
    "pin_style", "type", "indent", "cover_ratio", "card_style", "banner_ratio",
    "auto_excerpt", "category_color", "ai_label", "license", "share",
    "related_posts", "reading_time", "card_tags", "tags"
  ]),
  articleListing: Object.freeze(["pin_style", "card_style", "auto_excerpt"]),
  articlePresentation: Object.freeze(["type", "indent"]),
  comments: Object.freeze([...COMMENT_SERVICE_FIELDS, "comment_title", "custom_css"]),
  indexBlog: Object.freeze(["base_dir", "navigation", "sidebar"]),
  post: Object.freeze(["navigation", "sidebar"])
});

const BRAND_IMAGE_STYLES = Object.freeze(['avatar', 'icon', 'plain']);

class ContentConfigError extends Error {
  constructor(issues) {
    super(`Stellar v2 内容配置校验失败：\n${issues.map(issue => `- ${issue}`).join('\n')}`);
    this.name = 'ContentConfigError';
    this.issues = issues;
  }
}

function isPlainObject(value) {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function valueType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  if (typeof value === "object" && !isPlainObject(value)) {
    return value.constructor?.name || "non-plain object";
  }
  return typeof value;
}

function addTypeIssue(issues, source, fieldPath, expected, value) {
  issues.push(`${source}: ${fieldPath} 应为 ${expected}，实际为 ${valueType(value)}`);
}

function validateObject(value, source, fieldPath, issues) {
  if (!isPlainObject(value)) {
    addTypeIssue(issues, source, fieldPath, 'object', value);
    return false;
  }
  return true;
}

function validateBoolean(value, source, fieldPath, issues) {
  if (typeof value !== 'boolean') {
    addTypeIssue(issues, source, fieldPath, 'boolean', value);
  }
}

function validateString(value, source, fieldPath, issues) {
  if (typeof value !== 'string') {
    addTypeIssue(issues, source, fieldPath, 'string', value);
  }
}

function validateNumber(value, source, fieldPath, issues) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    addTypeIssue(issues, source, fieldPath, 'finite number', value);
  }
}

function validateWidgetArray(value, source, fieldPath, issues) {
  if (!Array.isArray(value)) {
    addTypeIssue(issues, source, fieldPath, 'widget[]', value);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== 'string' && !isPlainObject(item)) {
      addTypeIssue(issues, source, `${fieldPath}[${index}]`, 'string | object', item);
    }
  });
}

function validateStringArray(value, source, fieldPath, issues) {
  if (!Array.isArray(value)) {
    addTypeIssue(issues, source, fieldPath, 'string[]', value);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== 'string') {
      addTypeIssue(issues, source, `${fieldPath}[${index}]`, 'string', item);
    }
  });
}

function validateStringRecord(value, source, fieldPath, issues) {
  if (!validateObject(value, source, fieldPath, issues)) return;
  for (const [key, child] of Object.entries(value)) {
    if (child != null) validateString(child, source, `${fieldPath}.${key}`, issues);
  }
}

function validateIndexBlogNavigation(value, source, fieldPath, issues) {
  if (!validateObject(value, source, fieldPath, issues)) return;
  validateKnownKeys(value, ["menu", "breadcrumb", "tabs"], source, fieldPath, issues);
  if (value.menu != null) validateString(value.menu, source, `${fieldPath}.menu`, issues);
  if (value.breadcrumb != null) validateBoolean(value.breadcrumb, source, `${fieldPath}.breadcrumb`, issues);
  if (value.tabs != null) validateStringRecord(value.tabs, source, `${fieldPath}.tabs`, issues);
}

function validateAiLabelConfig(value, source, fieldPath, issues) {
  if (!validateObject(value, source, fieldPath, issues)) return;
  const keys = ["default", "manual", "reviewed", "polished", "generated"];
  validateKnownKeys(value, keys, source, fieldPath, issues);
  if (value.default != null) validateString(value.default, source, `${fieldPath}.default`, issues);
  for (const key of keys.slice(1)) {
    const item = value[key];
    if (item == null || !validateObject(item, source, `${fieldPath}.${key}`, issues)) continue;
    validateKnownKeys(item, ["color", "icon"], source, `${fieldPath}.${key}`, issues);
    if (item.color != null) validateString(item.color, source, `${fieldPath}.${key}.color`, issues);
    if (item.icon != null) validateString(item.icon, source, `${fieldPath}.${key}.icon`, issues);
  }
}

function validateRelatedPostsConfig(value, source, fieldPath, issues) {
  if (!validateObject(value, source, fieldPath, issues)) return;
  validateKnownKeys(value, ["enable", "max_count"], source, fieldPath, issues);
  if (value.enable != null) validateBoolean(value.enable, source, `${fieldPath}.enable`, issues);
  if (value.max_count != null) validateNumber(value.max_count, source, `${fieldPath}.max_count`, issues);
}

function validateKnownKeys(value, allowedKeys, source, fieldPath, issues) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      issues.push(`${source}: 未知字段 ${fieldPath}.${key}`);
    }
  }
}

function isMarkdownLink(value) {
  return typeof value === 'string' && /^\[[\s\S]*\]\([\s\S]*\)$/.test(value.trim());
}

function validateBrand(brand, source, fieldPath, issues) {
  if (!validateObject(brand, source, fieldPath, issues)) return;
  validateKnownKeys(brand, [...CONTENT_MODEL_FIELDS.brand, "avatar", "icon"], source, fieldPath, issues);

  for (const removedField of ['avatar', 'icon']) {
    if (Object.prototype.hasOwnProperty.call(brand, removedField)) {
      issues.push(`${source}: ${fieldPath}.${removedField} 已移除，请使用 ${fieldPath}.image.src 和 ${fieldPath}.image.style`);
    }
  }

  for (const key of ['name', 'tagline', 'url']) {
    if (brand[key] != null) validateString(brand[key], source, `${fieldPath}.${key}`, issues);
  }
  if (isMarkdownLink(brand.name)) {
    issues.push(`${source}: ${fieldPath}.name 不再解析 Markdown 链接，请将链接写入 ${fieldPath}.url`);
  }

  if (brand.image == null || !validateObject(brand.image, source, `${fieldPath}.image`, issues)) return;
  validateKnownKeys(brand.image, CONTENT_MODEL_FIELDS.brandImage, source, `${fieldPath}.image`, issues);
  if (brand.image.src == null) issues.push(`${source}: 缺少必填字段 ${fieldPath}.image.src`);
  if (brand.image.style == null) issues.push(`${source}: 缺少必填字段 ${fieldPath}.image.style`);
  for (const key of ['src', 'style', 'url', 'background']) {
    if (brand.image[key] != null) validateString(brand.image[key], source, `${fieldPath}.image.${key}`, issues);
  }
  if (brand.image.style != null && !BRAND_IMAGE_STYLES.includes(brand.image.style)) {
    issues.push(`${source}: ${fieldPath}.image.style 必须是 avatar、icon 或 plain`);
  }
  if (brand.image.style === 'plain' && brand.image.background != null) {
    issues.push(`${source}: ${fieldPath}.image.style 为 plain 时不能配置 background`);
  }
  if (isMarkdownLink(brand.image.src)) {
    issues.push(`${source}: ${fieldPath}.image.src 不再解析 Markdown 链接，请将链接写入 ${fieldPath}.image.url`);
  }
}

function validateGalaxyOptions(options, source, fieldPath, issues = []) {
  if (!validateObject(options, source, fieldPath, issues)) return issues;

  for (const [key, value] of Object.entries(options)) {
    const expected = GALAXY_OPTION_TYPES[key];
    if (expected == null) {
      issues.push(`${source}: 未知 React Bits Galaxy 参数 ${fieldPath}.${key}`);
      continue;
    }
    if (expected === 'number') validateNumber(value, source, `${fieldPath}.${key}`, issues);
    if (expected === 'boolean') validateBoolean(value, source, `${fieldPath}.${key}`, issues);
    if (expected === 'number_array') {
      if (!Array.isArray(value) || value.some(item => typeof item !== 'number' || !Number.isFinite(item))) {
        addTypeIssue(issues, source, `${fieldPath}.${key}`, 'number[]', value);
      }
    }
  }
  return issues;
}

function validateEffect(effect, source, fieldPath, issues) {
  if (!validateObject(effect, source, fieldPath, issues)) return;
  validateKnownKeys(effect, ['type', 'options', 'runtime'], source, fieldPath, issues);
  if (effect.type == null) {
    issues.push(`${source}: 缺少必填字段 ${fieldPath}.type`);
    return;
  }
  validateString(effect.type, source, `${fieldPath}.type`, issues);
  if (effect.type === 'galaxy') {
    validateGalaxyOptions(effect.options || {}, source, `${fieldPath}.options`, issues);
  } else if (effect.options != null && !isPlainObject(effect.options)) {
    addTypeIssue(issues, source, `${fieldPath}.options`, 'object', effect.options);
  }
  if (effect.runtime != null) {
    if (validateObject(effect.runtime, source, `${fieldPath}.runtime`, issues)) {
      validateKnownKeys(effect.runtime, ['pause_when_hidden', 'respect_reduced_motion'], source, `${fieldPath}.runtime`, issues);
      if (effect.runtime.pause_when_hidden != null) {
        validateBoolean(effect.runtime.pause_when_hidden, source, `${fieldPath}.runtime.pause_when_hidden`, issues);
      }
      if (effect.runtime.respect_reduced_motion != null) {
        validateBoolean(effect.runtime.respect_reduced_motion, source, `${fieldPath}.runtime.respect_reduced_motion`, issues);
      }
    }
  }
}

function validateHero(hero, source, fieldPath, issues) {
  if (!validateObject(hero, source, fieldPath, issues)) return;
  validateKnownKeys(hero, ['enabled', 'background', 'preview', 'actions'], source, fieldPath, issues);
  if (hero.enabled != null) validateBoolean(hero.enabled, source, `${fieldPath}.enabled`, issues);
  if (hero.background != null && validateObject(hero.background, source, `${fieldPath}.background`, issues)) {
    validateKnownKeys(hero.background, ['image', 'effect'], source, `${fieldPath}.background`, issues);
    if (hero.background.image != null) validateString(hero.background.image, source, `${fieldPath}.background.image`, issues);
    if (hero.background.effect != null) validateEffect(hero.background.effect, source, `${fieldPath}.background.effect`, issues);
  }
  if (hero.preview != null && validateObject(hero.preview, source, `${fieldPath}.preview`, issues)) {
    validateKnownKeys(hero.preview, ['type', 'src', 'alt', 'commands'], source, `${fieldPath}.preview`, issues);
    if (hero.preview.type != null && !['terminal', 'image'].includes(hero.preview.type)) {
      issues.push(`${source}: ${fieldPath}.preview.type 必须是 terminal 或 image`);
    }
    for (const key of ['src', 'alt']) {
      if (hero.preview[key] != null) validateString(hero.preview[key], source, `${fieldPath}.preview.${key}`, issues);
    }
    if (hero.preview.commands != null) {
      if (!Array.isArray(hero.preview.commands)) {
        addTypeIssue(issues, source, `${fieldPath}.preview.commands`, 'array', hero.preview.commands);
      } else {
        hero.preview.commands.forEach((command, index) => {
          const commandPath = `${fieldPath}.preview.commands[${index}]`;
          if (!validateObject(command, source, commandPath, issues)) return;
          validateKnownKeys(command, ['label', 'codes'], source, commandPath, issues);
          for (const key of ['label', 'codes']) {
            if (command[key] != null) validateString(command[key], source, `${commandPath}.${key}`, issues);
          }
        });
      }
    }
  }
  if (hero.actions != null) {
    if (!Array.isArray(hero.actions)) {
      addTypeIssue(issues, source, `${fieldPath}.actions`, 'array', hero.actions);
    } else {
      hero.actions.forEach((action, index) => {
        const actionPath = `${fieldPath}.actions[${index}]`;
        if (!validateObject(action, source, actionPath, issues)) return;
        validateKnownKeys(action, ['title', 'url', 'icon'], source, actionPath, issues);
        for (const key of ['title', 'url', 'icon']) {
          if (action[key] != null) validateString(action[key], source, `${actionPath}.${key}`, issues);
        }
      });
    }
  }
}

function validateSidebarSide(side, source, fieldPath, issues, isLeft) {
  if (!validateObject(side, source, fieldPath, issues)) return;
  const allowedKeys = isLeft ? [...CONTENT_MODEL_FIELDS.sidebarLeft, "logo"] : CONTENT_MODEL_FIELDS.sidebarRight;
  validateKnownKeys(side, allowedKeys, source, fieldPath, issues);
  if (side.widgets != null) validateWidgetArray(side.widgets, source, `${fieldPath}.widgets`, issues);
  if (isLeft) {
    if (side.search != null && typeof side.search !== 'boolean' && !isPlainObject(side.search)) {
      addTypeIssue(issues, source, `${fieldPath}.search`, 'boolean | object', side.search);
    } else if (isPlainObject(side.search)) {
      validateKnownKeys(side.search, ['filter', 'placeholder'], source, `${fieldPath}.search`, issues);
      for (const key of ['filter', 'placeholder']) {
        if (side.search[key] != null) validateString(side.search[key], source, `${fieldPath}.search.${key}`, issues);
      }
    }
    if (side.menu != null) validateBoolean(side.menu, source, `${fieldPath}.menu`, issues);
    if (Object.prototype.hasOwnProperty.call(side, 'logo')) {
      issues.push(`${source}: ${fieldPath}.logo 已移除，请使用 ${fieldPath}.brand`);
    }
    if (side.brand != null) validateBrand(side.brand, source, `${fieldPath}.brand`, issues);
    if (side.wiki_home != null) validateBoolean(side.wiki_home, source, `${fieldPath}.wiki_home`, issues);
  }
}

function validateSidebar(sidebar, source, fieldPath, issues) {
  if (!validateObject(sidebar, source, fieldPath, issues)) return;
  validateKnownKeys(sidebar, CONTENT_MODEL_FIELDS.sidebar, source, fieldPath, issues);
  if (sidebar.left != null) validateSidebarSide(sidebar.left, source, `${fieldPath}.left`, issues, true);
  if (sidebar.right != null) validateSidebarSide(sidebar.right, source, `${fieldPath}.right`, issues, false);
}

function validateCard(card, source, fieldPath, issues) {
  if (!validateObject(card, source, fieldPath, issues)) return;
  validateKnownKeys(card, CONTENT_MODEL_FIELDS.card, source, fieldPath, issues);
  if (card.cover != null) validateString(card.cover, source, `${fieldPath}.cover`, issues);
  if (card.tagline != null) validateString(card.tagline, source, `${fieldPath}.tagline`, issues);
}

function validateBanner(banner, source, fieldPath, issues) {
  if (!validateObject(banner, source, fieldPath, issues)) return;
  validateKnownKeys(banner, CONTENT_MODEL_FIELDS.banner, source, fieldPath, issues);
  if (banner.enabled != null) validateBoolean(banner.enabled, source, `${fieldPath}.enabled`, issues);
  for (const key of ['image', 'avatar', 'headline', 'tagline']) {
    if (banner[key] != null) validateString(banner[key], source, `${fieldPath}.${key}`, issues);
  }
}

function validateNavigation(navigation, source, fieldPath, issues) {
  if (!validateObject(navigation, source, fieldPath, issues)) return;
  validateKnownKeys(navigation, [...CONTENT_MODEL_FIELDS.navigation, "mobile_header"], source, fieldPath, issues);
  if (navigation.menu != null) validateString(navigation.menu, source, `${fieldPath}.menu`, issues);
  if (navigation.breadcrumb != null) validateBoolean(navigation.breadcrumb, source, `${fieldPath}.breadcrumb`, issues);
  if (Object.prototype.hasOwnProperty.call(navigation, 'mobile_header')) {
    issues.push(`${source}: ${fieldPath}.mobile_header 已移除，手机端 Brand 由页面类型自动决定`);
  }
}

function validateArticle(article, source, fieldPath, issues) {
  if (!validateObject(article, source, fieldPath, issues)) return;
  validateKnownKeys(article, CONTENT_MODEL_FIELDS.article, source, fieldPath, issues);
  if (article.type != null && !['tech', 'story'].includes(article.type)) {
    issues.push(`${source}: ${fieldPath}.type 必须是 tech 或 story`);
  }
  if (article.indent != null) validateBoolean(article.indent, source, `${fieldPath}.indent`, issues);
  if (article.author != null) validateString(article.author, source, `${fieldPath}.author`, issues);
  if (article.ai_label != null) validateString(article.ai_label, source, `${fieldPath}.ai_label`, issues);
}

function validateFooter(footer, source, fieldPath, issues) {
  if (!validateObject(footer, source, fieldPath, issues)) return;
  validateKnownKeys(footer, CONTENT_MODEL_FIELDS.footer, source, fieldPath, issues);
  if (footer.references != null && !Array.isArray(footer.references)) {
    addTypeIssue(issues, source, `${fieldPath}.references`, 'array', footer.references);
  }
  if (footer.license != null && typeof footer.license !== 'boolean' && typeof footer.license !== 'string') {
    addTypeIssue(issues, source, `${fieldPath}.license`, 'boolean | string', footer.license);
  }
  if (footer.share != null) validateBoolean(footer.share, source, `${fieldPath}.share`, issues);
}

function validateComments(comments, source, fieldPath, issues) {
  if (!validateObject(comments, source, fieldPath, issues)) return;
  validateKnownKeys(comments, COMMENT_SERVICE_FIELDS, source, fieldPath, issues);
  if (comments.enabled != null) validateBoolean(comments.enabled, source, `${fieldPath}.enabled`, issues);
  for (const key of ['title', 'id', 'service']) {
    if (comments[key] != null) validateString(comments[key], source, `${fieldPath}.${key}`, issues);
  }
  for (const key of COMMENT_SERVICE_FIELDS.slice(4)) {
    if (comments[key] != null) validateObject(comments[key], source, `${fieldPath}.${key}`, issues);
  }
}

function validateSource(sourceConfig, source, fieldPath, issues) {
  if (!validateObject(sourceConfig, source, fieldPath, issues)) return;
  validateKnownKeys(sourceConfig, CONTENT_MODEL_FIELDS.source, source, fieldPath, issues);
  if (sourceConfig.repository != null) validateString(sourceConfig.repository, source, `${fieldPath}.repository`, issues);
  if (sourceConfig.branch != null) validateString(sourceConfig.branch, source, `${fieldPath}.branch`, issues);
}

function validateRouting(routing, source, fieldPath, issues) {
  if (!validateObject(routing, source, fieldPath, issues)) return;
  validateKnownKeys(routing, ['base_dir', 'start', 'path'], source, fieldPath, issues);
  for (const key of ['base_dir', 'start', 'path']) {
    if (routing[key] != null) validateString(routing[key], source, `${fieldPath}.${key}`, issues);
  }
}

function validateCollectionListing(listing, source, fieldPath, issues) {
  if (!validateObject(listing, source, fieldPath, issues)) return;
  validateKnownKeys(listing, ['priority', 'sort', 'excerpt_length', 'per_page', 'order_by'], source, fieldPath, issues);
  for (const key of ['priority', 'sort', 'excerpt_length', 'per_page']) {
    if (listing[key] != null) validateNumber(listing[key], source, `${fieldPath}.${key}`, issues);
  }
  if (typeof listing.priority === 'number' && listing.priority < 0) {
    issues.push(`${source}: ${fieldPath}.priority 不能小于 0`);
  }
  if (listing.order_by != null) validateString(listing.order_by, source, `${fieldPath}.order_by`, issues);
}

function validateTree(tree, source, fieldPath, issues) {
  if (Array.isArray(tree)) {
    validateStringArray(tree, source, fieldPath, issues);
    return;
  }
  if (!validateObject(tree, source, fieldPath, issues)) return;
  for (const [section, pages] of Object.entries(tree)) {
    validateStringArray(pages, source, `${fieldPath}.${section}`, issues);
  }
}

function validateLegacyFields(config, legacyFields, source, issues) {
  for (const field of legacyFields) {
    if (Object.prototype.hasOwnProperty.call(config, field)) {
      issues.push(`${source}: v1 字段 ${field} 已移除`);
    }
  }
}

function validateThemeConfig(config, source = '<theme>') {
  const issues = [];
  if (!validateObject(config, source, 'root', issues)) throw new ContentConfigError(issues);
  if (Object.prototype.hasOwnProperty.call(config, 'logo')) {
    issues.push(`${source}: 根字段 logo 已移除，请使用 brand`);
  }
  if (config.brand != null) validateBrand(config.brand, source, 'brand', issues);
  if (issues.length > 0) throw new ContentConfigError(issues);
  return config;
}

function validatePostProfileConfig(config, source = "<theme>") {
  const issues = [];
  if (!validateObject(config, source, "root", issues)) throw new ContentConfigError(issues);

  if (config.site_tree != null && validateObject(config.site_tree, source, "site_tree", issues)) {
    const post = config.site_tree.post;
    if (post != null && validateObject(post, source, "site_tree.post", issues)) {
      validateKnownKeys(post, POST_PROFILE_FIELDS.post, source, "site_tree.post", issues);
      if (post.navigation != null) {
        validateNavigation(post.navigation, source, "site_tree.post.navigation", issues);
      }
      if (post.sidebar != null) validateSidebar(post.sidebar, source, "site_tree.post.sidebar", issues);
    }

    const indexBlog = config.site_tree.index_blog;
    if (indexBlog != null && validateObject(indexBlog, source, "site_tree.index_blog", issues)) {
      validateKnownKeys(indexBlog, POST_PROFILE_FIELDS.indexBlog, source, "site_tree.index_blog", issues);
      if (indexBlog.base_dir != null) {
        validateString(indexBlog.base_dir, source, "site_tree.index_blog.base_dir", issues);
      }
      if (indexBlog.navigation != null) {
        validateIndexBlogNavigation(indexBlog.navigation, source, "site_tree.index_blog.navigation", issues);
      }
      if (indexBlog.sidebar != null) {
        validateSidebar(indexBlog.sidebar, source, "site_tree.index_blog.sidebar", issues);
      }
    }
  }

  if (config.article != null && validateObject(config.article, source, "article", issues)) {
    validateKnownKeys(config.article, POST_PROFILE_FIELDS.article, source, "article", issues);
    for (const field of POST_PROFILE_FIELDS.articleListing.slice(0, 2)) {
      if (config.article[field] != null) validateString(config.article[field], source, `article.${field}`, issues);
    }
    if (config.article.auto_excerpt != null) {
      validateNumber(config.article.auto_excerpt, source, "article.auto_excerpt", issues);
    }
    for (const field of ["cover_ratio", "banner_ratio"]) {
      if (config.article[field] != null) validateNumber(config.article[field], source, `article.${field}`, issues);
    }
    if (config.article.pin_style != null && !["carousel", "flat"].includes(config.article.pin_style)) {
      issues.push(`${source}: article.pin_style 必须是 carousel 或 flat`);
    }
    if (config.article.card_style != null && !["hero", "classic"].includes(config.article.card_style)) {
      issues.push(`${source}: article.card_style 必须是 hero 或 classic`);
    }
    if (config.article.type != null && !["tech", "story"].includes(config.article.type)) {
      issues.push(`${source}: article.type 必须是 tech 或 story`);
    }
    if (config.article.indent != null) validateBoolean(config.article.indent, source, "article.indent", issues);
    if (config.article.category_color != null) {
      validateStringRecord(config.article.category_color, source, "article.category_color", issues);
    }
    if (config.article.ai_label != null) {
      validateAiLabelConfig(config.article.ai_label, source, "article.ai_label", issues);
    }
    if (config.article.related_posts != null) {
      validateRelatedPostsConfig(config.article.related_posts, source, "article.related_posts", issues);
    }
    for (const field of ["reading_time", "card_tags", "tags"]) {
      if (config.article[field] != null) validateBoolean(config.article[field], source, `article.${field}`, issues);
    }
    if (config.article.license != null && typeof config.article.license !== "boolean" && typeof config.article.license !== "string") {
      addTypeIssue(issues, source, "article.license", "boolean | string", config.article.license);
    }
    if (config.article.share != null && typeof config.article.share !== "boolean") {
      if (!Array.isArray(config.article.share)) {
        addTypeIssue(issues, source, "article.share", "boolean | string[]", config.article.share);
      } else {
        validateStringArray(config.article.share, source, "article.share", issues);
      }
    }
  }

  if (config.comments != null && validateObject(config.comments, source, "comments", issues)) {
    validateKnownKeys(config.comments, POST_PROFILE_FIELDS.comments, source, "comments", issues);
    if (config.comments.enabled != null) validateBoolean(config.comments.enabled, source, "comments.enabled", issues);
    for (const field of ["title", "id", "service", "comment_title"]) {
      if (config.comments[field] != null) validateString(config.comments[field], source, `comments.${field}`, issues);
    }
    for (const field of COMMENT_SERVICE_FIELDS.slice(4)) {
      if (config.comments[field] != null) validateObject(config.comments[field], source, `comments.${field}`, issues);
    }
    if (config.comments.custom_css != null) {
      if (typeof config.comments.custom_css !== "string" && !Array.isArray(config.comments.custom_css)) {
        addTypeIssue(issues, source, "comments.custom_css", "string | string[]", config.comments.custom_css);
      } else if (Array.isArray(config.comments.custom_css)) {
        validateStringArray(config.comments.custom_css, source, "comments.custom_css", issues);
      }
    }
  }

  if (issues.length > 0) throw new ContentConfigError(issues);
  return config;
}

function validateCollectionConfig(config, source = '<collection>') {
  const issues = [];
  if (!validateObject(config, source, 'root', issues)) throw new ContentConfigError(issues);
  validateKnownKeys(config, COLLECTION_FIELDS, source, 'root', issues);
  validateLegacyFields(config, LEGACY_COLLECTION_FIELDS, source, issues);
  if (config.name == null) issues.push(`${source}: 缺少必填字段 name`);
  if (config.name != null) validateString(config.name, source, 'name', issues);
  if (config.headline != null) validateString(config.headline, source, 'headline', issues);
  if (config.tagline != null) validateString(config.tagline, source, 'tagline', issues);
  if (config.description != null) validateString(config.description, source, 'description', issues);
  if (config.audience != null) validateString(config.audience, source, 'audience', issues);
  if (config.identity != null && validateObject(config.identity, source, 'identity', issues)) {
    validateKnownKeys(config.identity, ['icon'], source, 'identity', issues);
    if (config.identity.icon != null) validateString(config.identity.icon, source, 'identity.icon', issues);
  }
  if (config.card != null) validateCard(config.card, source, 'card', issues);
  if (config.hero != null) validateHero(config.hero, source, 'hero', issues);
  if (config.sidebar != null) validateSidebar(config.sidebar, source, 'sidebar', issues);
  if (config.navigation != null) validateNavigation(config.navigation, source, 'navigation', issues);
  if (config.article != null) validateArticle(config.article, source, 'article', issues);
  if (config.footer != null) validateFooter(config.footer, source, 'footer', issues);
  if (config.comments != null) validateComments(config.comments, source, 'comments', issues);
  if (config.source != null) validateSource(config.source, source, 'source', issues);
  if (config.routing != null) validateRouting(config.routing, source, 'routing', issues);
  if (config.listing != null) validateCollectionListing(config.listing, source, 'listing', issues);
  if (config.note != null && validateObject(config.note, source, 'note', issues)) {
    validateKnownKeys(config.note, ['sidebar'], source, 'note', issues);
    if (config.note.sidebar != null) validateSidebar(config.note.sidebar, source, 'note.sidebar', issues);
  }
  if (config.tags != null) validateStringArray(config.tags, source, 'tags', issues);
  if (config.tree != null) validateTree(config.tree, source, 'tree', issues);
  if (issues.length > 0) throw new ContentConfigError(issues);
  return config;
}

function validatePageConfig(config, source = '<page>') {
  const issues = [];
  if (!validateObject(config, source, 'root', issues)) throw new ContentConfigError(issues);
  validateKnownKeys(config, PAGE_FIELDS, source, 'root', issues);
  validateLegacyFields(config, LEGACY_PAGE_FIELDS, source, issues);
  if (config.sidebar != null) validateSidebar(config.sidebar, source, 'sidebar', issues);
  if (config.card != null) validateCard(config.card, source, 'card', issues);
  if (config.banner != null) validateBanner(config.banner, source, 'banner', issues);
  if (config.navigation != null) validateNavigation(config.navigation, source, 'navigation', issues);
  if (config.article != null) validateArticle(config.article, source, 'article', issues);
  if (config.footer != null) validateFooter(config.footer, source, 'footer', issues);
  if (config.comments != null) validateComments(config.comments, source, 'comments', issues);
  if (config.source != null) validateSource(config.source, source, 'source', issues);
  if (config.collection != null && validateObject(config.collection, source, 'collection', issues)) {
    validateKnownKeys(config.collection, ['type', 'id'], source, 'collection', issues);
    if (!['wiki', 'topic', 'notebook'].includes(config.collection.type)) {
      issues.push(`${source}: collection.type 必须是 wiki、topic 或 notebook`);
    }
    if (typeof config.collection.id !== 'string' || config.collection.id.length === 0) {
      issues.push(`${source}: collection.id 必须是非空字符串`);
    }
  }
  if (config.visibility != null && validateObject(config.visibility, source, 'visibility', issues)) {
    validateKnownKeys(config.visibility, CONTENT_MODEL_FIELDS.visibility, source, 'visibility', issues);
    if (config.visibility.listed != null) validateBoolean(config.visibility.listed, source, 'visibility.listed', issues);
    if (config.visibility.searchable != null) validateBoolean(config.visibility.searchable, source, 'visibility.searchable', issues);
  }
  if (config.listing != null && validateObject(config.listing, source, 'listing', issues)) {
    validateKnownKeys(config.listing, ['priority'], source, 'listing', issues);
    if (config.listing.priority != null) {
      validateNumber(config.listing.priority, source, 'listing.priority', issues);
      if (typeof config.listing.priority === 'number' && config.listing.priority < 0) {
        issues.push(`${source}: listing.priority 不能小于 0`);
      }
    }
  }
  if (issues.length > 0) throw new ContentConfigError(issues);
  return config;
}

function getCollectionId(page, type) {
  if (page?.collection?.type !== type) return null;
  return page.collection.id;
}

function isListed(content) {
  return content?.visibility?.listed !== false;
}

function isSearchable(content) {
  return content?.visibility?.searchable !== false;
}

module.exports = {
  BRAND_IMAGE_STYLES,
  CONTENT_MODEL_FIELDS,
  ContentConfigError,
  GALAXY_OPTION_TYPES,
  LEGACY_COLLECTION_FIELDS,
  LEGACY_PAGE_FIELDS,
  POST_PROFILE_FIELDS,
  getCollectionId,
  isPlainObject,
  isListed,
  isSearchable,
  validateBrand,
  validateCollectionConfig,
  validateGalaxyOptions,
  validatePageConfig,
  validatePostProfileConfig,
  validateThemeConfig
};
