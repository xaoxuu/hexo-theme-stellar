"use strict";

const { gravatar, stripHTML, truncate } = require("hexo-util");
const {
  CONTENT_MODEL_FIELDS,
  ContentConfigError,
  isPlainObject,
  validateThemeConfig
} = require("../content-config");
const { assertPageViewModel } = require("../model-schema");
const {
  ConfigSchemaError,
  isPlainObject: isPlainConfigObject,
  valueType: configValueType
} = require("../config-schema");
const { normalize_path: normalizePath } = require("../path_utils");
const {
  profilePath,
  requireLayoutProfiles,
  toRenderNavigation
} = require("../layout-config");
const { mergeBrand, normalizeBrand } = require("../brand");
const { firstContentImage, postDescription, postImages } = require("../seo");
const { caption } = require("../caption");
const {
  articleFooterDefaults,
  articlePresentationDefaults,
  requireContentConfig
} = require("../content-defaults");

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

function normalizeSidebarBrand(sidebar) {
  const normalized = cloneValue(isPlainObject(sidebar) ? sidebar : {});
  if (isPlainObject(normalized.left?.brand)) {
    normalized.left.brand = normalizeBrand(normalized.left.brand);
  }
  return normalized;
}

function assertNormalizedConfig(stellarConfig, source, requirements) {
  const issues = [];
  for (const requirement of requirements) {
    const value = requirement.read(stellarConfig);
    if (isPlainConfigObject(value)) continue;
    issues.push(Object.freeze({
      code: "invalid_type",
      source,
      path: requirement.path,
      actualType: configValueType(value),
      expected: requirement.expected,
      migration: requirement.migration
    }));
  }
  if (issues.length > 0) throw new ConfigSchemaError(issues);
}

function layoutConfigRequirement() {
  return {
    path: "stellarConfig.layout.profiles",
    read: config => config?.layout?.profiles,
    expected: "normalized Layout Profile object",
    migration: "configuration/layout"
  };
}

function normalizeDate(value) {
  if (value == null) return null;
  if (typeof value.format === "function") return value.format();
  if (typeof value.toISOString === "function") return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeLanguage(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const language = value.find(item => typeof item === "string" && item.length > 0);
      if (language) return language;
    } else if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return "";
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

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item)).filter(Boolean);
  }
  if (typeof value === "string" && value.length > 0) {
    return value.split(",").map(item => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeHeadInject(value) {
  return typeof value === "string" ? value : "";
}

function normalizeCategoryLinks(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => ({
    name: typeof item?.name === "string" ? item.name : "",
    path: typeof item?.path === "string" ? normalizeCollectionPath(item.path) : ""
  })).filter(item => item.name.length > 0 && item.path.length > 0);
}

function normalizeLinks(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => ({
    name: typeof item?.name === "string" ? item.name : "",
    path: typeof item?.path === "string" ? normalizeCollectionPath(item.path) : ""
  })).filter(item => item.name.length > 0 && item.path.length > 0);
}

function normalizePostLink(value) {
  if (value == null || typeof value !== "object") return null;
  const path = typeof value.path === "string" ? normalizeCollectionPath(value.path) : "";
  if (path.length === 0) return null;
  return {
    title: typeof value.title === "string" ? value.title : "",
    path,
    date: normalizeDate(value.date)
  };
}

function normalizeRelatedItems(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => ({
    title: typeof item?.title === "string" ? item.title : "",
    path: typeof item?.path === "string" ? item.path : "",
    excerpt: typeof item?.excerpt === "string" ? item.excerpt : ""
  })).filter(item => item.title.length > 0 && item.path.length > 0);
}

function categoryStyle(category, categoryColors) {
  if (typeof category !== "string" || category.length === 0 || !isPlainObject(categoryColors)) return "";
  const raw = categoryColors[category];
  if (typeof raw !== "string" || raw.length === 0) return "";
  const color = raw.startsWith("#") ? raw : `#${raw}`;
  const background = color.length === 4 ? `${color}2` : color.length === 7 ? `${color}20` : color;
  return `--text-p2:${color};--theme-block:${background}`;
}

function resolveLicense(license, item, themeConfig) {
  if (typeof license !== "string" || license.length === 0) return "";
  const authors = isPlainObject(themeConfig.authors) ? themeConfig.authors : null;
  if (!authors) return license;
  const authorId = item.presentation.article?.author;
  const author = typeof authorId === "string" && isPlainObject(authors[authorId])
    ? authors[authorId]
    : isPlainObject(themeConfig.default_author) ? themeConfig.default_author : null;
  if (!author) return license;
  return license
    .replace("{author.name}", String(author.name || ""))
    .replace("{author.url}", String(author.url || ""));
}

function buildContributor(item, themeConfig) {
  const map = themeConfig.data_services?.contributors?.edit_this_page;
  if (!isPlainObject(map)) return null;
  const source = item.source.file || "";
  for (const [prefix, replacement] of Object.entries(map)) {
    if (!source.startsWith(prefix) || typeof replacement !== "string" || replacement.length === 0) continue;
    const editUrl = source.replace(prefix, replacement);
    const apiHost = String(themeConfig.api_host?.ghapi || "api.github.com");
    return {
      editUrl,
      commitsUrl: editUrl
        .replace("/github.com/", `/${apiHost}/repos/`)
        .replace("/blob/main/", "/commits?path=")
    };
  }
  return null;
}

function buildPostArticleRender(input, item) {
  const themeConfig = input.themeConfig;
  const articleConfig = requireContentConfig(input.stellarConfig, input.themeSource).article;
  const frontMatter = input.frontMatter;
  const footer = item.presentation.footer || {};
  const comments = item.presentation.comments || {};
  const service = typeof comments.provider === "string" ? comments.provider : "";
  const commentOptions = mergeConfig(
    service && isPlainObject(themeConfig.comments?.[service]) ? themeConfig.comments[service] : {},
    isPlainObject(comments.options) ? comments.options : {}
  );
  const preferredTheme = themeConfig.style?.prefers_theme;
  if (service === "giscus" && preferredTheme !== "auto" && commentOptions["data-theme"] === "preferred_color_scheme") {
    commentOptions["data-theme"] = preferredTheme;
  }
  const configuredShare = Array.isArray(footer.share) ? footer.share : articleConfig.footer.share;
  const shareServices = footer.share !== false && Array.isArray(configuredShare)
    ? configuredShare.filter(name => ["wechat", "weibo", "email", "link"].includes(name))
    : [];
  const summarySource = typeof frontMatter.description === "string" && frontMatter.description.length > 0
    ? frontMatter.description
    : item.excerpt || item.content;
  const relatedConfig = articleConfig.relatedPosts;

  return {
    heti: themeConfig.plugins?.heti?.enable === true,
    tags: articleConfig.showTags === true ? normalizeLinks(input.page.tagLinks) : [],
    footer: {
      references: Array.isArray(footer.references) ? cloneValue(footer.references) : [],
      license: resolveLicense(footer.license, item, themeConfig),
      share: shareServices.length > 0 ? {
        services: shareServices,
        permalink: item.route.permalink,
        title: `${item.title} - ${String(input.siteConfig.title || "")}`,
        image: item.presentation.card?.cover || "",
        summary: truncate(stripHTML(summarySource), { length: 120 })
      } : null,
      contributor: buildContributor(item, themeConfig)
    },
    previous: normalizePostLink(input.page.previous),
    next: normalizePostLink(input.page.next),
    related: {
      enabled: relatedConfig.enabled === true,
      title: "",
      maxCount: relatedConfig.limit,
      items: normalizeRelatedItems(input.relatedItems)
    },
    comments: {
      enabled: comments.enabled !== false && service.length > 0,
      title: typeof comments.title === "string" && comments.title.length > 0
        ? comments.title
        : String(themeConfig.comments?.comment_title || ""),
      id: typeof comments.id === "string" ? comments.id : "",
      service,
      options: commentOptions,
      pageTitle: item.title
    }
  };
}

function buildPostListingRender(input, collection, item) {
  const articleConfig = requireContentConfig(input.stellarConfig, input.themeSource).article;
  const categories = normalizeCategoryLinks(input.page.categoryLinks);
  const tagLinks = normalizeLinks(input.page.tagLinks);
  const description = typeof input.frontMatter.description === "string" ? input.frontMatter.description : "";
  const excerpt = item.excerpt
    ? stripHTML(item.excerpt)
    : description || (collection.listing.excerptLength > 0
      ? truncate(stripHTML(item.content), { length: collection.listing.excerptLength })
      : "");
  const lastCategory = categories.length > 0 ? categories[categories.length - 1].name : "";
  return {
    href: typeof input.page.link === "string" && input.page.link.length > 0
      ? input.page.link
      : item.route.path,
    title: item.title,
    layout: item.layout,
    date: item.date,
    cover: item.presentation.card?.cover || "",
    caption: caption({
      card: item.presentation.card,
      description,
      excerpt: item.excerpt,
      content: item.content
    }),
    excerpt,
    categories: categories.map(category => category.name),
    categoryStyle: categoryStyle(lastCategory, articleConfig.categoryColors),
    tags: articleConfig.listing.showTags === true
      ? tagLinks.slice(0, 5).map(tag => tag.name)
      : [],
    authorId: typeof item.presentation.article?.author === "string" && item.presentation.article.author.length > 0
      ? item.presentation.article.author
      : String(input.themeConfig.default_author?.id || ""),
    priority: item.listing.priority,
    listed: item.visibility.listed !== false,
    cardStyle: collection.listing.cardStyle || "classic"
  };
}

function absoluteSiteAsset(value, siteUrl) {
  if (typeof value !== "string" || value.length === 0) return "";
  if (/^https?:\/\//.test(value)) return value;
  const root = String(siteUrl || "").replace(/\/+$/, "");
  if (root.length === 0) return value;
  return `${root}/${value.replace(/^\/+/, "")}`;
}

function canonicalUrl(host, path) {
  if (typeof host !== "string" || host.length === 0) return null;
  const normalizedPath = normalizeCollectionPath(path);
  if (normalizedPath === "404" || normalizedPath.startsWith("404/")) return null;
  return `https://${host}/${normalizedPath}${normalizedPath ? "/" : ""}`;
}

function buildPostRenderModel(input, collection, item) {
  const siteConfig = input.siteConfig;
  const themeConfig = input.themeConfig;
  const seoConfig = input.stellarConfig.seo;
  const canonicalConfig = seoConfig.canonical;
  const frontMatter = input.frontMatter;
  const page = input.page;
  const articleType = typeof item.presentation.article?.type === "string"
    ? item.presentation.article.type
    : null;
  const hasIndent = Object.prototype.hasOwnProperty.call(item.presentation.article || {}, "indent");
  const explicitDescription = typeof frontMatter.description === "string" && frontMatter.description.length > 0
    ? frontMatter.description
    : "";
  const descriptionSource = explicitDescription || item.excerpt || item.content;
  const description = truncate(stripHTML(descriptionSource), { length: 150 });
  const openGraphDescription = stripHTML(descriptionSource)
    .substring(0, 200)
    .trim()
    .replace(/\n/g, " ");
  const explicitKeywords = normalizeStringList(frontMatter.keywords);
  const siteKeywords = normalizeStringList(siteConfig.keywords);
  const keywords = explicitKeywords.length > 0
    ? explicitKeywords
    : item.tags.length > 0 ? item.tags.slice() : siteKeywords;
  const cardCover = item.presentation.card?.cover || "";
  const bannerImage = item.presentation.banner?.image || "";
  const defaultOgImage = siteConfig.avatar || (siteConfig.email ? gravatar(siteConfig.email) : "");
  const openGraphConfig = seoConfig.openGraph;
  let openGraph = null;
  if (openGraphConfig.enabled === true) {
    const pageOpenGraph = isPlainObject(frontMatter.seo?.openGraph) ? frontMatter.seo.openGraph : {};
    const args = {
      type: "article",
      title: item.title,
      url: item.route.permalink,
      site_name: String(siteConfig.title || ""),
      description: openGraphDescription,
      language: normalizeLanguage(page.lang, page.language, frontMatter.lang, frontMatter.language, siteConfig.language),
      author: String(siteConfig.author || ""),
      date: false,
      updated: false
    };
    if (openGraphConfig.twitterId) args.twitter_id = openGraphConfig.twitterId;
    if (cardCover) args.twitter_card = "summary_large_image";
    args.image = cardCover || bannerImage || firstContentImage(item.content) || defaultOgImage || null;
    Object.assign(args, cloneValue(pageOpenGraph));
    openGraph = {
      args,
      title: item.title,
      siteName: String(siteConfig.title || ""),
      twitterTitle: item.title,
      publishedTime: pageOpenGraph.date === false || !item.date ? null : new Date(item.date).toISOString(),
      modifiedTime: pageOpenGraph.updated === false || !item.updated ? null : new Date(item.updated).toISOString(),
      tags: item.tags.slice().sort()
    };
  }

  let authorImage = siteConfig.avatar || (siteConfig.email ? gravatar(siteConfig.email) : "");
  authorImage = absoluteSiteAsset(authorImage, siteConfig.url);
  const author = {
    "@type": "Person",
    name: String(siteConfig.author || ""),
    sameAs: cloneValue(seoConfig.structuredData.sameAs)
  };
  const publisher = { ...author, "@type": "Organization" };
  if (authorImage) {
    author.image = authorImage;
    publisher.image = authorImage;
    publisher.logo = { "@type": "ImageObject", url: authorImage };
  }
  const images = postImages({
    cardCover,
    bannerImage,
    photos: Array.isArray(frontMatter.photos) ? frontMatter.photos : [],
    content: item.content,
    defaultCover: themeConfig.default?.cover
  });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    author,
    dateCreated: item.date,
    dateModified: item.updated,
    datePublished: item.date,
    description: postDescription({ excerpt: item.excerpt, content: item.content }),
    headline: item.title,
    mainEntityOfPage: { "@type": "WebPage", "@id": item.route.permalink },
    publisher,
    url: item.route.permalink,
    image: images
  };
  if (item.tags.length > 0) jsonLd.keywords = item.tags.join(", ");
  if (images.length > 0) jsonLd.thumbnailUrl = images[0];

  return {
    document: {
      language: normalizeLanguage(page.lang, page.language, frontMatter.lang, frontMatter.language, siteConfig.language),
      headInject: normalizeHeadInject(frontMatter.inject?.head),
      preferredTheme: themeConfig.style?.prefers_theme === "auto"
        ? "auto"
        : String(themeConfig.style?.prefers_theme || "")
    },
    layout: {
      pageType: "content",
      articleType,
      indent: hasIndent ? item.presentation.article.indent === true : articleType === "story",
      siteBackground: Boolean(themeConfig.style?.site?.["background-image"]),
      leftbarSurface: themeConfig.style?.leftbar?.["ui-style"] === "card" ? "card" : "glass",
      leftbarBlur: themeConfig.style?.leftbar?.blur === true,
      blogPath: typeof siteConfig.index_generator?.path === "string" ? normalizeCollectionPath(siteConfig.index_generator.path) : "",
      brand: mergeBrand(collection.identity, item.presentation.sidebar?.left?.brand),
      breadcrumbs: normalizeCategoryLinks(page.categoryLinks)
    },
    seo: {
      title: item.title ? `${item.title} - ${String(siteConfig.title || "")}` : String(siteConfig.title || ""),
      description,
      keywords,
      robots: input.isBackup === true
        ? "noindex, nofollow"
        : typeof frontMatter.robots === "string" && frontMatter.robots.length > 0 ? frontMatter.robots : null,
      canonical: canonicalUrl(canonicalConfig.host, item.route.path),
      openGraph,
      jsonLd
    },
    article: buildPostArticleRender(input, item),
    listing: buildPostListingRender(input, collection, item)
  };
}

function buildCollectionModel(themeConfig, stellarConfig) {
  const profiles = requireLayoutProfiles(stellarConfig);
  const postProfile = profiles.post;
  const blogIndex = profiles.blogIndex;
  const content = requireContentConfig(stellarConfig);
  const article = content.article;
  const comments = normalizeThemeComments(themeConfig.comments);
  const navigation = toRenderNavigation(postProfile);
  const sidebar = normalizeSidebarBrand(pick(postProfile.sidebar, CONTENT_MODEL_FIELDS.sidebar));

  return {
    id: "post",
    profile: "post",
    identity: normalizeBrand(stellarConfig.site.brand),
    source: {},
    route: {
      baseDir: profilePath(blogIndex.path)
    },
    navigation,
    listing: {
      pinStyle: article.listing.pinnedLayout,
      cardStyle: article.listing.cardLayout,
      excerptLength: article.listing.excerptLength
    },
    presentation: {
      sidebar,
      article: articlePresentationDefaults(content),
      footer: articleFooterDefaults(content),
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
      sidebar: normalizeSidebarBrand(mergeConfig(collection.presentation.sidebar, pageSidebar, "sidebar")),
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

function normalizeThemeComments(comments) {
  const source = isPlainObject(comments) ? comments : {};
  const provider = typeof source.service === "string" ? source.service : null;
  return {
    enabled: source.enabled !== false,
    title: typeof source.title === "string" ? source.title : String(source.comment_title || ""),
    id: typeof source.id === "string" ? source.id : "",
    provider,
    options: {}
  };
}

function buildWikiCollectionModel(input, collectionId) {
  const themeConfig = input.themeConfig;
  const collectionConfig = input.collectionConfig;
  const collectionState = isPlainObject(input.collectionState) ? input.collectionState : {};
  const profiles = requireLayoutProfiles(input.stellarConfig);
  const wikiProfile = profiles.wiki;
  const indexWiki = profiles.wikiIndex;
  const content = requireContentConfig(input.stellarConfig, input.themeSource);
  const collectionRoute = isPlainObject(collectionConfig.route) ? collectionConfig.route : {};
  const collectionListing = isPlainObject(collectionConfig.listing) ? collectionConfig.listing : {};
  const baseDir = collectionRoute.path || `${profilePath(indexWiki.path) || "wiki"}/${collectionId}`;

  const profileNavigation = toRenderNavigation(wikiProfile);
  const collectionNavigation = pick(collectionConfig.navigation, CONTENT_MODEL_FIELDS.navigation);
  const profileSidebar = pick(wikiProfile.sidebar, CONTENT_MODEL_FIELDS.sidebar);
  const collectionSidebar = pick(collectionConfig.sidebar, CONTENT_MODEL_FIELDS.sidebar);
  const globalArticle = articlePresentationDefaults(content);
  const globalFooter = articleFooterDefaults(content);

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
      excerptLength: collectionListing.excerptLength ?? null,
      perPage: collectionListing.perPage ?? null,
      orderBy: collectionListing.orderBy ?? null
    },
    presentation: {
      card: pick(collectionConfig.card, CONTENT_MODEL_FIELDS.card),
      hero: cloneValue(collectionConfig.hero || {}),
      sidebar: normalizeSidebarBrand(mergeConfig(profileSidebar, collectionSidebar, "sidebar")),
      article: mergeConfig(globalArticle, pick(collectionConfig.article, CONTENT_MODEL_FIELDS.article)),
      footer: mergeConfig(globalFooter, pick(collectionConfig.footer, CONTENT_MODEL_FIELDS.footer)),
      comments: mergeConfig(
        normalizeThemeComments(themeConfig.comments),
        pick(collectionConfig.comments, CONTENT_MODEL_FIELDS.comments)
      )
    },
    visibility: {
      listed: input.collectionListed !== false,
      searchable: true
    }
  };
}

function buildTopicSeries(collectionId, members, currentId, orderBy) {
  const items = [];
  for (const [index, member] of (Array.isArray(members) ? members : []).entries()) {
    const config = isPlainObject(member?.frontMatter) ? member.frontMatter : {};
    const page = member?.page || {};
    if (config.collection?.profile !== "topic" || config.collection.id !== collectionId) continue;
    if (config.visibility?.listed === false) continue;
    items.push({
      index,
      id: String(page._id || page.source || page.path || ""),
      title: String(page.title || config.title || ""),
      path: typeof page.path === "string" ? normalizeCollectionPath(page.path) : "",
      date: normalizeDate(page.date ?? config.date),
      current: String(page._id || page.source || page.path || "") === currentId
    });
  }

  const field = String(orderBy || "-date").replace(/^-/, "");
  const direction = String(orderBy || "-date").startsWith("-") ? -1 : 1;
  if (field === "date") {
    items.sort((left, right) => {
      const compared = String(left.date || "").localeCompare(String(right.date || "")) * direction;
      return compared || left.index - right.index;
    });
  }
  return items.map(({ index, ...item }) => item);
}

function buildTopicCollectionModel(input, collectionId, currentId) {
  const themeConfig = input.themeConfig;
  const siteConfig = input.siteConfig;
  const collectionConfig = input.collectionConfig;
  const profiles = requireLayoutProfiles(input.stellarConfig);
  const postProfile = profiles.post;
  const topicProfile = profiles.topic;
  const indexTopic = profiles.topicIndex;
  const collectionRoute = isPlainObject(collectionConfig.route) ? collectionConfig.route : {};
  const collectionListing = isPlainObject(collectionConfig.listing) ? collectionConfig.listing : {};
  const content = requireContentConfig(input.stellarConfig, input.themeSource);
  const baseDir = profilePath(indexTopic.path) || "topic";
  const routePath = collectionRoute.path || `${baseDir}/${collectionId}`;
  const orderBy = collectionListing.orderBy ?? "-date";

  const profileNavigation = mergeConfig(
    toRenderNavigation(postProfile),
    toRenderNavigation(topicProfile)
  );
  const collectionNavigation = pick(collectionConfig.navigation, CONTENT_MODEL_FIELDS.navigation);
  const siteBrand = normalizeBrand(input.stellarConfig.site.brand);
  const brandSidebar = { left: { brand: siteBrand } };
  const postSidebar = mergeConfig(
    brandSidebar,
    pick(postProfile.sidebar, CONTENT_MODEL_FIELDS.sidebar),
    "sidebar"
  );
  const profileSidebar = mergeConfig(
    postSidebar,
    pick(topicProfile.sidebar, CONTENT_MODEL_FIELDS.sidebar),
    "sidebar"
  );
  const collectionSidebar = pick(collectionConfig.sidebar, CONTENT_MODEL_FIELDS.sidebar);
  const globalArticle = articlePresentationDefaults(content);
  const globalFooter = articleFooterDefaults(content);

  return {
    id: collectionId,
    profile: "topic",
    identity: normalizeCollectionIdentity(collectionConfig),
    source: pick(collectionConfig.source, CONTENT_MODEL_FIELDS.source),
    route: {
      baseDir: normalizeCollectionPath(baseDir),
      path: normalizeCollectionPath(routePath),
      start: typeof collectionRoute.start === "string"
        ? normalizeCollectionPath(collectionRoute.start)
        : ""
    },
    navigation: {
      ...mergeConfig(profileNavigation, collectionNavigation),
      series: buildTopicSeries(collectionId, input.members, currentId, orderBy)
    },
    listing: {
      priority: collectionListing.priority ?? 0,
      sort: collectionListing.sort ?? null,
      excerptLength: collectionListing.excerptLength ?? null,
      perPage: collectionListing.perPage ?? null,
      orderBy
    },
    presentation: {
      card: pick(collectionConfig.card, CONTENT_MODEL_FIELDS.card),
      hero: cloneValue(collectionConfig.hero || {}),
      sidebar: normalizeSidebarBrand(mergeConfig(profileSidebar, collectionSidebar, "sidebar")),
      article: mergeConfig(
        globalArticle,
        pick(collectionConfig.article, CONTENT_MODEL_FIELDS.article)
      ),
      footer: mergeConfig(globalFooter, pick(collectionConfig.footer, CONTENT_MODEL_FIELDS.footer)),
      comments: mergeConfig(
        normalizeThemeComments(themeConfig.comments),
        pick(collectionConfig.comments, CONTENT_MODEL_FIELDS.comments)
      )
    },
    visibility: {
      listed: input.collectionListed !== false,
      searchable: true
    }
  };
}

function notebookBaseDir(collectionId, collectionConfig, stellarConfig) {
  if (typeof collectionConfig.route?.path === "string" && collectionConfig.route.path.length > 0) {
    return normalizeCollectionPath(collectionConfig.route.path);
  }
  const root = profilePath(requireLayoutProfiles(stellarConfig).notebookIndex.path);
  return normalizeCollectionPath([root, collectionId].filter(Boolean).join("/"));
}

function buildNotebookTagNavigation(collectionId, baseDir, collectionItems) {
  const tags = new Map();
  const items = Array.isArray(collectionItems) ? collectionItems : [];
  for (const item of items) {
    if (item?.collection?.profile !== "notebook" || item.collection.id !== collectionId) continue;
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
  const profiles = requireLayoutProfiles(input.stellarConfig);
  const content = requireContentConfig(input.stellarConfig, input.themeSource);
  const notebookDefaults = content.notebook;
  const collectionListing = isPlainObject(collectionConfig.listing) ? collectionConfig.listing : {};
  const defaultListing = notebookDefaults.listing;
  const baseDir = notebookBaseDir(collectionId, collectionConfig, input.stellarConfig);
  const profileNavigation = toRenderNavigation(profiles.noteIndex);
  const collectionNavigation = pick(collectionConfig.navigation, CONTENT_MODEL_FIELDS.navigation);
  const profileSidebar = pick(profiles.note.sidebar, CONTENT_MODEL_FIELDS.sidebar);
  const collectionSidebar = pick(collectionConfig.noteDefaults?.sidebar, CONTENT_MODEL_FIELDS.sidebar);
  const globalArticle = articlePresentationDefaults(content);
  const globalFooter = {
    references: [],
    license: notebookDefaults.footer.license,
    share: notebookDefaults.footer.share
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
      excerptLength: collectionListing.excerptLength ?? defaultListing.excerptLength,
      perPage: collectionListing.perPage ?? defaultListing.perPage ?? siteConfig.per_page ?? 10,
      orderBy: collectionListing.orderBy ?? defaultListing.orderBy
    },
    presentation: {
      card: pick(collectionConfig.card, CONTENT_MODEL_FIELDS.card),
      hero: cloneValue(collectionConfig.hero || {}),
      sidebar: normalizeSidebarBrand(mergeConfig(profileSidebar, collectionSidebar, "sidebar")),
      article: mergeConfig(globalArticle, pick(collectionConfig.article, CONTENT_MODEL_FIELDS.article)),
      footer: mergeConfig(globalFooter, pick(collectionConfig.footer, CONTENT_MODEL_FIELDS.footer)),
      comments: mergeConfig(
        normalizeThemeComments(themeConfig.comments),
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

  assertNormalizedConfig(input.stellarConfig, themeSource, [
    {
      path: "stellarConfig.site.brand",
      read: config => config?.site?.brand,
      expected: "normalized site brand object",
      migration: "configuration/site"
    },
    {
      path: "stellarConfig.seo",
      read: config => config?.seo,
      expected: "normalized SEO object",
      migration: "configuration/seo"
    },
    layoutConfigRequirement()
  ]);

  validateThemeConfig(themeConfig, themeSource);
  const collection = buildCollectionModel(themeConfig, input.stellarConfig);
  const item = buildContentItemModel(page, frontMatter, collection, source);
  const render = buildPostRenderModel({ ...input, siteConfig, themeConfig, frontMatter, page }, collection, item);
  return deepFreeze(assertPageViewModel("post", { collection, item, render }));
}

function buildWikiPageViewModel(input) {
  const source = input.source || "<page>";
  const themeSource = input.themeSource || "<theme>";
  const collectionSource = input.collectionSource || "<collection>";
  const themeConfig = isPlainObject(input.themeConfig) ? input.themeConfig : {};
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const page = input.page || {};

  assertNormalizedConfig(input.stellarConfig, themeSource, [layoutConfigRequirement()]);

  if (!isPlainObject(input.collectionConfig)) {
    const collectionId = input.collectionId || frontMatter.collection?.id || "<unknown>";
    throw new ContentConfigError([
      `${source}: collection.id ${collectionId} 未找到 Wiki 项目配置 ${collectionSource}`
    ]);
  }
  const collectionConfig = input.collectionConfig;

  validateThemeConfig(themeConfig, themeSource);

  const collectionId = input.collectionId || frontMatter.collection?.id;
  if (frontMatter.collection?.profile !== "wiki") {
    throw new ContentConfigError([`${source}: collection.profile 必须是 wiki`]);
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
  return deepFreeze(assertPageViewModel("wiki", { collection, item }));
}

function buildTopicPageViewModel(input) {
  const source = input.source || "<page>";
  const themeSource = input.themeSource || "<theme>";
  const siteConfig = isPlainObject(input.siteConfig) ? input.siteConfig : {};
  const themeConfig = isPlainObject(input.themeConfig) ? input.themeConfig : {};
  const collectionConfig = input.collectionConfig;
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const page = input.page || {};
  const collectionId = input.collectionId || frontMatter.collection?.id;

  assertNormalizedConfig(input.stellarConfig, themeSource, [
    {
      path: "stellarConfig.site.brand",
      read: config => config?.site?.brand,
      expected: "normalized site brand object",
      migration: "configuration/site"
    },
    layoutConfigRequirement()
  ]);

  validateThemeConfig(themeConfig, themeSource);
  if (!isPlainObject(collectionConfig)) {
    throw new ContentConfigError([`${source}: collection.id 无法解析 Topic ${collectionId || "<unknown>"}`]);
  }
  if (frontMatter.collection?.profile !== "topic") {
    throw new ContentConfigError([`${source}: collection.profile 必须是 topic`]);
  }
  if (collectionId !== frontMatter.collection.id) {
    throw new ContentConfigError([
      `${source}: collection.id ${frontMatter.collection.id} 与 Topic ${collectionId} 不匹配`
    ]);
  }
  const currentId = String(page._id || page.source || page.path || "");
  const collection = buildTopicCollectionModel({
    ...input,
    siteConfig,
    themeConfig,
    collectionConfig
  }, collectionId, currentId);
  const item = buildContentItemModel(page, frontMatter, collection, source, {
    source: collection.source,
    visibility: { listed: true, searchable: true }
  });
  return deepFreeze(assertPageViewModel("topic", { collection, item }));
}

function buildNotebookPageViewModel(input) {
  const source = input.source || "<page>";
  const themeSource = input.themeSource || "<theme>";
  const siteConfig = isPlainObject(input.siteConfig) ? input.siteConfig : {};
  const themeConfig = isPlainObject(input.themeConfig) ? input.themeConfig : {};
  const collectionConfig = input.collectionConfig;
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const page = input.page || {};
  const collectionId = input.collectionId;

  assertNormalizedConfig(input.stellarConfig, themeSource, [layoutConfigRequirement()]);

  validateThemeConfig(themeConfig, themeSource);
  if (!isPlainObject(collectionConfig)) {
    throw new ContentConfigError([`${source}: 未找到 Notebook collection ${collectionId || "<unknown>"}`]);
  }
  if (frontMatter.collection?.profile !== "notebook") {
    throw new ContentConfigError([`${source}: Note 必须显式声明 collection.profile: notebook`]);
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
  return deepFreeze(assertPageViewModel("notebook", { collection, item }));
}

module.exports = {
  buildNotebookPageViewModel,
  buildPostPageViewModel,
  buildTopicPageViewModel,
  buildWikiPageViewModel
};
