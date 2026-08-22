"use strict";

const {
  CONTENT_MODEL_FIELDS,
  POST_PROFILE_FIELDS,
  isPlainObject,
  validatePageConfig,
  validatePostProfileConfig,
  validateThemeConfig
} = require("../content-config");
const { normalize_path: normalizePath } = require("../path_utils");

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value == null || typeof value !== "object") return value;
  const result = {};
  for (const [key, child] of Object.entries(value)) {
    result[key] = cloneValue(child);
  }
  return result;
}

function deepFreeze(value) {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function pick(source, fields) {
  const result = {};
  if (!isPlainObject(source)) return result;
  for (const field of fields) {
    if (source[field] != null) result[field] = cloneValue(source[field]);
  }
  return result;
}

function mergeConfig(base, override, path = "") {
  const result = cloneValue(isPlainObject(base) ? base : {});
  if (!isPlainObject(override)) return result;
  for (const [key, value] of Object.entries(override)) {
    if (value == null) continue;
    const fieldPath = path ? `${path}.${key}` : key;
    if (isPlainObject(value) && isPlainObject(result[key]) && fieldPath !== "sidebar.left.brand.image") {
      result[key] = mergeConfig(result[key], value, fieldPath);
    } else {
      result[key] = cloneValue(value);
    }
  }
  return result;
}

function normalizeDate(value) {
  if (value == null) return null;
  if (typeof value.toISOString === "function") return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeTerms(value) {
  let items = value;
  if (items != null && !Array.isArray(items) && typeof items.toArray === "function") {
    items = items.toArray();
  }
  if (!Array.isArray(items)) return [];
  return items.map(item => {
    if (typeof item === "string") return item;
    if (item != null && typeof item.name === "string") return item.name;
    return null;
  }).filter(item => item != null);
}

function normalizeBrand(brand, siteConfig) {
  const normalized = pick(brand, CONTENT_MODEL_FIELDS.brand);
  if (normalized.name == null) normalized.name = String(siteConfig.title || "");
  if (normalized.tagline == null) normalized.tagline = String(siteConfig.subtitle || "");
  return normalized;
}

function buildCollectionModel(themeConfig, siteConfig) {
  const siteTree = isPlainObject(themeConfig.site_tree) ? themeConfig.site_tree : {};
  const postProfile = isPlainObject(siteTree.post) ? siteTree.post : {};
  const blogIndex = isPlainObject(siteTree.index_blog) ? siteTree.index_blog : {};
  const article = isPlainObject(themeConfig.article) ? themeConfig.article : {};
  const comments = pick(themeConfig.comments, CONTENT_MODEL_FIELDS.comments);
  if (comments.title == null && typeof themeConfig.comments?.comment_title === "string") {
    comments.title = themeConfig.comments.comment_title;
  }
  const navigation = pick(postProfile.navigation, CONTENT_MODEL_FIELDS.navigation);
  const sidebar = pick(postProfile.sidebar, CONTENT_MODEL_FIELDS.sidebar);

  return {
    id: "post",
    profile: "post",
    identity: normalizeBrand(themeConfig.brand, siteConfig),
    source: {},
    route: {
      baseDir: typeof blogIndex.base_dir === "string" ? normalizePath(blogIndex.base_dir) : ""
    },
    navigation,
    listing: {
      pinStyle: article.pin_style ?? null,
      cardStyle: article.card_style ?? null,
      excerptLength: article.auto_excerpt ?? null
    },
    presentation: {
      sidebar,
      article: pick(article, POST_PROFILE_FIELDS.articlePresentation),
      footer: {
        references: [],
        license: article.license ?? null,
        share: article.share ?? null
      },
      comments
    },
    visibility: {
      listed: true,
      searchable: true
    }
  };
}

function buildContentItemModel(page, frontMatter, collection, source) {
  const pageNavigation = pick(frontMatter.navigation, CONTENT_MODEL_FIELDS.navigation);
  const pageSidebar = pick(frontMatter.sidebar, CONTENT_MODEL_FIELDS.sidebar);
  const pageArticle = pick(frontMatter.article, CONTENT_MODEL_FIELDS.article);
  const pageFooter = pick(frontMatter.footer, CONTENT_MODEL_FIELDS.footer);
  const pageComments = pick(frontMatter.comments, CONTENT_MODEL_FIELDS.comments);
  const pageVisibility = pick(frontMatter.visibility, CONTENT_MODEL_FIELDS.visibility);

  return {
    id: String(page._id || page.source || page.path || ""),
    title: String(page.title || frontMatter.title || ""),
    layout: String(page.layout || frontMatter.layout || "post"),
    content: typeof page.content === "string" ? page.content : "",
    excerpt: typeof page.excerpt === "string" ? page.excerpt : "",
    date: normalizeDate(page.date ?? frontMatter.date),
    updated: normalizeDate(page.updated ?? frontMatter.updated ?? page.date ?? frontMatter.date),
    tags: normalizeTerms(page.tags ?? frontMatter.tags),
    categories: normalizeTerms(page.categories ?? frontMatter.categories),
    source: {
      file: String(page.source || source || ""),
      ...pick(frontMatter.source, CONTENT_MODEL_FIELDS.source)
    },
    route: {
      path: typeof page.path === "string" ? normalizePath(page.path) : "",
      permalink: typeof page.permalink === "string" ? page.permalink : ""
    },
    navigation: mergeConfig(collection.navigation, pageNavigation),
    listing: {
      priority: frontMatter.listing?.priority ?? 0
    },
    presentation: {
      card: pick(frontMatter.card, CONTENT_MODEL_FIELDS.card),
      banner: pick(frontMatter.banner, CONTENT_MODEL_FIELDS.banner),
      sidebar: mergeConfig(collection.presentation.sidebar, pageSidebar, "sidebar"),
      article: mergeConfig(collection.presentation.article, pageArticle),
      footer: mergeConfig(collection.presentation.footer, pageFooter),
      comments: mergeConfig(collection.presentation.comments, pageComments)
    },
    visibility: mergeConfig(collection.visibility, pageVisibility)
  };
}

function buildPostPageViewModel(input) {
  const source = input.source || "<page>";
  const themeSource = input.themeSource || "<theme>";
  const siteConfig = isPlainObject(input.siteConfig) ? input.siteConfig : {};
  const themeConfig = isPlainObject(input.themeConfig) ? input.themeConfig : {};
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const page = input.page || {};

  validateThemeConfig(themeConfig, themeSource);
  validatePostProfileConfig(themeConfig, themeSource);
  validatePageConfig(frontMatter, source);
  const collection = buildCollectionModel(themeConfig, siteConfig);
  const item = buildContentItemModel(page, frontMatter, collection, source);
  return deepFreeze({ collection, item });
}

module.exports = {
  buildPostPageViewModel
};
