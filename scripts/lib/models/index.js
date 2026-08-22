"use strict";

const {
  CONTENT_MODEL_FIELDS,
  ContentConfigError,
  POST_PROFILE_FIELDS,
  isPlainObject,
  validateCollectionConfig,
  validateNotebookProfileConfig,
  validatePageConfig,
  validatePostProfileConfig,
  validateThemeConfig,
  validateWikiProfileConfig
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

function normalizeCollectionPath(value) {
  return normalizePath(value).replace(/^\/+/, "");
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

function buildContentItemModel(page, frontMatter, collection, source, options = {}) {
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
      ...cloneValue(options.source || collection.source || {}),
      ...pick(frontMatter.source, CONTENT_MODEL_FIELDS.source)
    },
    route: {
      path: typeof page.path === "string" ? normalizeCollectionPath(page.path) : "",
      permalink: typeof page.permalink === "string" ? page.permalink : ""
    },
    navigation: mergeConfig(
      pick(collection.navigation, CONTENT_MODEL_FIELDS.navigation),
      pageNavigation
    ),
    listing: {
      priority: frontMatter.listing?.priority ?? 0
    },
    presentation: {
      card: mergeConfig(collection.presentation.card, pick(frontMatter.card, CONTENT_MODEL_FIELDS.card)),
      banner: pick(frontMatter.banner, CONTENT_MODEL_FIELDS.banner),
      sidebar: mergeConfig(collection.presentation.sidebar, pageSidebar, "sidebar"),
      article: mergeConfig(collection.presentation.article, pageArticle),
      footer: mergeConfig(collection.presentation.footer, pageFooter),
      comments: mergeConfig(collection.presentation.comments, pageComments)
    },
    visibility: mergeConfig(options.visibility || collection.visibility, pageVisibility)
  };
}

function normalizeCollectionIdentity(config) {
  return {
    name: String(config.name || ""),
    headline: String(config.headline ?? config.name ?? ""),
    tagline: String(config.tagline || ""),
    description: String(config.description || ""),
    audience: String(config.audience || ""),
    icon: typeof config.identity?.icon === "string" ? config.identity.icon : ""
  };
}

function normalizeWikiTree(sections) {
  if (!Array.isArray(sections)) return [];
  return sections.map(section => ({
    title: typeof section?.title === "string" ? section.title : "",
    items: Array.isArray(section?.pages) ? section.pages.map(page => ({
      id: String(page?._id || page?.id || page?.path || ""),
      title: String(page?.title || ""),
      path: typeof page?.path === "string" ? normalizeCollectionPath(page.path) : "",
      pageNumber: Number.isFinite(page?.page_number) ? page.page_number : null,
      isHomepage: page?.is_homepage === true
    })) : []
  }));
}

function normalizeCollectionComments(comments) {
  const normalized = pick(comments, CONTENT_MODEL_FIELDS.comments);
  if (normalized.title == null && typeof comments?.comment_title === "string") {
    normalized.title = comments.comment_title;
  }
  return normalized;
}

function buildWikiCollectionModel(input, collectionId) {
  const themeConfig = input.themeConfig;
  const collectionConfig = input.collectionConfig;
  const collectionState = isPlainObject(input.collectionState) ? input.collectionState : {};
  const siteTree = isPlainObject(themeConfig.site_tree) ? themeConfig.site_tree : {};
  const wikiProfile = isPlainObject(siteTree.wiki) ? siteTree.wiki : {};
  const indexWiki = isPlainObject(siteTree.index_wiki) ? siteTree.index_wiki : {};
  const article = isPlainObject(themeConfig.article) ? themeConfig.article : {};
  const collectionRouting = isPlainObject(collectionConfig.routing) ? collectionConfig.routing : {};
  const collectionListing = isPlainObject(collectionConfig.listing) ? collectionConfig.listing : {};
  const baseDir = collectionRouting.base_dir || `${indexWiki.base_dir || "wiki"}/${collectionId}`;

  const profileNavigation = pick(wikiProfile.navigation, CONTENT_MODEL_FIELDS.navigation);
  const collectionNavigation = pick(collectionConfig.navigation, CONTENT_MODEL_FIELDS.navigation);
  const profileSidebar = pick(wikiProfile.sidebar, CONTENT_MODEL_FIELDS.sidebar);
  const collectionSidebar = pick(collectionConfig.sidebar, CONTENT_MODEL_FIELDS.sidebar);
  const globalArticle = pick(article, CONTENT_MODEL_FIELDS.article);
  const globalFooter = {
    references: [],
    license: article.license ?? null,
    share: article.share ?? null
  };

  return {
    id: collectionId,
    profile: "wiki",
    identity: normalizeCollectionIdentity(collectionConfig),
    source: pick(collectionConfig.source, CONTENT_MODEL_FIELDS.source),
    route: {
      baseDir: normalizeCollectionPath(baseDir),
      homepage: typeof collectionState.homepage?.path === "string"
        ? normalizeCollectionPath(collectionState.homepage.path)
        : ""
    },
    navigation: {
      ...mergeConfig(profileNavigation, collectionNavigation),
      tree: normalizeWikiTree(collectionState.sections)
    },
    listing: {
      priority: collectionListing.priority ?? 0,
      sort: collectionListing.sort ?? 0,
      excerptLength: collectionListing.excerpt_length ?? null,
      perPage: collectionListing.per_page ?? null,
      orderBy: collectionListing.order_by ?? null
    },
    presentation: {
      card: pick(collectionConfig.card, CONTENT_MODEL_FIELDS.card),
      hero: cloneValue(collectionConfig.hero || {}),
      sidebar: mergeConfig(profileSidebar, collectionSidebar, "sidebar"),
      article: mergeConfig(globalArticle, pick(collectionConfig.article, CONTENT_MODEL_FIELDS.article)),
      footer: mergeConfig(globalFooter, pick(collectionConfig.footer, CONTENT_MODEL_FIELDS.footer)),
      comments: mergeConfig(
        normalizeCollectionComments(themeConfig.comments),
        pick(collectionConfig.comments, CONTENT_MODEL_FIELDS.comments)
      )
    },
    visibility: {
      listed: input.collectionListed !== false,
      searchable: true
    }
  };
}

function notebookBaseDir(collectionId, collectionConfig, themeConfig) {
  if (typeof collectionConfig.routing?.base_dir === "string" && collectionConfig.routing.base_dir.length > 0) {
    return normalizeCollectionPath(collectionConfig.routing.base_dir);
  }
  const root = typeof themeConfig.site_tree?.notebooks?.base_dir === "string"
    ? normalizeCollectionPath(themeConfig.site_tree.notebooks.base_dir)
    : "";
  return normalizeCollectionPath([root, collectionId].filter(Boolean).join("/"));
}

function buildNotebookTagNavigation(collectionId, baseDir, collectionItems) {
  const tags = new Map();
  const items = Array.isArray(collectionItems) ? collectionItems : [];
  for (const item of items) {
    if (item?.collection?.type !== "notebook" || item.collection.id !== collectionId) continue;
    for (const hierarchy of normalizeTerms(item.tags)) {
      const parts = hierarchy.split("/").filter(Boolean);
      for (let index = 0; index < parts.length; index += 1) {
        const name = parts.slice(0, index + 1).join("/");
        const id = name.toLowerCase();
        if (tags.has(id)) continue;
        const parentName = parts.slice(0, index).join("/");
        tags.set(id, {
          id,
          name,
          label: parts[index],
          path: normalizeCollectionPath(`${baseDir}/tags/${id}`),
          parentId: parentName.length > 0 ? parentName.toLowerCase() : null
        });
      }
    }
  }
  return Array.from(tags.values()).sort((left, right) => left.id.localeCompare(right.id));
}

function buildNotebookCollectionModel(input, collectionId) {
  const themeConfig = input.themeConfig;
  const siteConfig = input.siteConfig;
  const collectionConfig = input.collectionConfig;
  const siteTree = isPlainObject(themeConfig.site_tree) ? themeConfig.site_tree : {};
  const notebookDefaults = isPlainObject(themeConfig.notebook) ? themeConfig.notebook : {};
  const collectionListing = isPlainObject(collectionConfig.listing) ? collectionConfig.listing : {};
  const defaultListing = isPlainObject(notebookDefaults.listing) ? notebookDefaults.listing : {};
  const baseDir = notebookBaseDir(collectionId, collectionConfig, themeConfig);
  const profileNavigation = pick(siteTree.notes?.navigation, CONTENT_MODEL_FIELDS.navigation);
  const collectionNavigation = pick(collectionConfig.navigation, CONTENT_MODEL_FIELDS.navigation);
  const profileSidebar = pick(siteTree.note?.sidebar, CONTENT_MODEL_FIELDS.sidebar);
  const collectionSidebar = pick(collectionConfig.note?.sidebar, CONTENT_MODEL_FIELDS.sidebar);
  const globalArticle = pick(themeConfig.article, CONTENT_MODEL_FIELDS.article);
  const globalFooter = {
    references: [],
    ...pick(notebookDefaults.footer, CONTENT_MODEL_FIELDS.footer)
  };

  return {
    id: collectionId,
    profile: "notebook",
    identity: normalizeCollectionIdentity(collectionConfig),
    source: pick(collectionConfig.source, CONTENT_MODEL_FIELDS.source),
    route: { baseDir },
    navigation: {
      ...mergeConfig(profileNavigation, collectionNavigation),
      tags: buildNotebookTagNavigation(collectionId, baseDir, input.collectionItems)
    },
    listing: {
      priority: collectionListing.priority ?? 0,
      sort: collectionListing.sort ?? 0,
      excerptLength: collectionListing.excerpt_length ?? defaultListing.excerpt_length ?? 0,
      perPage: collectionListing.per_page ?? defaultListing.per_page ?? siteConfig.per_page ?? 10,
      orderBy: collectionListing.order_by ?? defaultListing.order_by ?? "-updated"
    },
    presentation: {
      card: pick(collectionConfig.card, CONTENT_MODEL_FIELDS.card),
      hero: cloneValue(collectionConfig.hero || {}),
      sidebar: mergeConfig(profileSidebar, collectionSidebar, "sidebar"),
      article: mergeConfig(globalArticle, pick(collectionConfig.article, CONTENT_MODEL_FIELDS.article)),
      footer: mergeConfig(globalFooter, pick(collectionConfig.footer, CONTENT_MODEL_FIELDS.footer)),
      comments: mergeConfig(
        normalizeCollectionComments(themeConfig.comments),
        pick(collectionConfig.comments, CONTENT_MODEL_FIELDS.comments)
      )
    },
    visibility: {
      listed: true,
      searchable: true
    }
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

function buildWikiPageViewModel(input) {
  const source = input.source || "<page>";
  const themeSource = input.themeSource || "<theme>";
  const collectionSource = input.collectionSource || "<collection>";
  const themeConfig = isPlainObject(input.themeConfig) ? input.themeConfig : {};
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const page = input.page || {};

  if (!isPlainObject(input.collectionConfig)) {
    const collectionId = input.collectionId || frontMatter.collection?.id || "<unknown>";
    throw new ContentConfigError([
      `${source}: collection.id ${collectionId} 未找到 Wiki 项目配置 ${collectionSource}`
    ]);
  }
  const collectionConfig = input.collectionConfig;

  validateThemeConfig(themeConfig, themeSource);
  validatePostProfileConfig(themeConfig, themeSource);
  validateWikiProfileConfig(themeConfig, themeSource);
  validateCollectionConfig(collectionConfig, collectionSource);
  validatePageConfig(frontMatter, source);

  const collectionId = input.collectionId || frontMatter.collection?.id;
  if (frontMatter.collection?.type !== "wiki") {
    throw new ContentConfigError([`${source}: collection.type 必须是 wiki`]);
  }
  if (collectionId !== frontMatter.collection.id) {
    throw new ContentConfigError([
      `${source}: collection.id ${frontMatter.collection.id} 与 Wiki 项目 ${collectionId} 不匹配`
    ]);
  }

  const collection = buildWikiCollectionModel({ ...input, themeConfig, collectionConfig }, collectionId);
  const item = buildContentItemModel(page, frontMatter, collection, source, {
    source: collection.source,
    visibility: { listed: true, searchable: true }
  });
  const heroImage = collection.presentation.hero?.background?.image;
  item.presentation.banner = mergeConfig(
    typeof heroImage === "string" ? { image: heroImage } : {},
    item.presentation.banner
  );
  return deepFreeze({ collection, item });
}

function buildNotebookPageViewModel(input) {
  const source = input.source || "<page>";
  const themeSource = input.themeSource || "<theme>";
  const collectionSource = input.collectionSource || "<notebook>";
  const siteConfig = isPlainObject(input.siteConfig) ? input.siteConfig : {};
  const themeConfig = isPlainObject(input.themeConfig) ? input.themeConfig : {};
  const collectionConfig = input.collectionConfig;
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const page = input.page || {};
  const collectionId = input.collectionId;

  validateThemeConfig(themeConfig, themeSource);
  validatePostProfileConfig(themeConfig, themeSource);
  validateNotebookProfileConfig(themeConfig, themeSource);
  if (!isPlainObject(collectionConfig)) {
    throw new ContentConfigError([`${source}: 未找到 Notebook collection ${collectionId || "<unknown>"}`]);
  }
  validateCollectionConfig(collectionConfig, collectionSource);
  validatePageConfig(frontMatter, source);
  if (frontMatter.collection?.type !== "notebook") {
    throw new ContentConfigError([`${source}: Note 必须显式声明 collection.type: notebook`]);
  }
  if (typeof collectionId !== "string" || collectionId.length === 0) {
    throw new ContentConfigError([`${source}: Notebook collection id 必须是非空字符串`]);
  }
  if (frontMatter.collection.id !== collectionId) {
    throw new ContentConfigError([
      `${source}: collection.id ${frontMatter.collection.id} 与 Notebook ${collectionId} 不匹配`
    ]);
  }

  const collection = buildNotebookCollectionModel({
    ...input,
    siteConfig,
    themeConfig,
    collectionConfig
  }, collectionId);
  const item = buildContentItemModel(page, frontMatter, collection, source, {
    source: collection.source,
    visibility: { listed: true, searchable: true }
  });
  return deepFreeze({ collection, item });
}

module.exports = {
  buildNotebookPageViewModel,
  buildPostPageViewModel,
  buildWikiPageViewModel
};
