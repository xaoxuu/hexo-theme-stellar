"use strict";

const { gravatar, stripHTML, truncate } = require("hexo-util");
const { CONTENT_MODEL_FIELDS, ContentConfigError, isPlainObject } = require("../content-config");
const { ConfigSchemaError, isPlainObject: isPlainConfigObject, valueType: configValueType } = require("../config-schema");
const { normalize_path: normalizePath } = require("../path_utils");
const { profilePath } = require("../layout-config");
const { cascadeRegions, resolveRegions } = require("../regions");
const { firstContentImage, postDescription, postImages } = require("../seo");
const { caption } = require("../caption");
const { resolveServiceProvider } = require("../service-provider");
const { filterShareServices } = require("../share-services");
const { resolveCommentsModel } = require("../comments");
const { requireContentConfig } = require("../content-defaults");

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
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeConfig(result[key], value, fieldPath);
    } else {
      result[key] = cloneValue(value);
    }
  }
  return result;
}

function toContentNavigation(config) {
  const navigation = {};
  if (config?.activeMenu != null) navigation.menu = config.activeMenu;
  if (config?.breadcrumb != null) navigation.breadcrumb = config.breadcrumb;
  return navigation;
}

function collectionIndexHref(path) {
  if (typeof path !== "string") return null;
  const normalized = profilePath(path);
  return normalized ? `/${normalized}/` : "/";
}

function collectionBrand(identity, href, options = {}) {
  const normalizedHref = normalizeCollectionPath(href);
  const brand = {
    source: "collection",
    style: "regular",
    backButton: true,
    search: true,
    backHref: collectionIndexHref(options.indexPath),
    backLabel: options.backLabel || "",
    image: { src: identity.icon || null, variant: "icon" },
    name: identity.name,
    tagline: identity.tagline,
    href: normalizedHref ? `/${normalizedHref}/` : "/"
  };
  return brand;
}

function assertCollectionBrandConfig(config, defaultSource, source) {
  const brand = config?.leftbar?.brand;
  if (!isPlainObject(brand)) return;
  const resolvedSource = brand.source || defaultSource;
  if (resolvedSource === "collection") return;
  const unsupported = ["backButton", "search"].filter(key => brand[key] != null);
  if (unsupported.length === 0) return;
  throw new ContentConfigError(unsupported.map(key => (
    `${source}: leftbar.brand.${key === "backButton" ? "back_button" : key} 仅支持 source: collection`
  )));
}

function articleIndentEnabled(article) {
  const style = article?.style;
  const mode = article?.paragraphIndent || "auto";
  return mode === "always" || (mode === "auto" && style === "story");
}

function finalizedRegions(input, collection, item) {
  return resolveRegions({
    profile: collection.profile,
    defaultState: input.stellarConfig.leftbar.defaultState,
    catalog: input.runtimeData?.widgets || {},
    layers: [item.presentation]
  });
}

function renderRegionLayout(regionLayout) {
  return {
    topbar: regionLayout.topbar,
    leftbar: regionLayout.leftbar,
    rightbar: regionLayout.rightbar,
    regionWarnings: regionLayout.warnings
  };
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
    path: "stellarConfig.profiles",
    read: config => config?.profiles,
    expected: "normalized Layout Profile object",
    migration: null
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

function normalizeInject(value) {
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

function resolveLicense(license, item, runtimeData) {
  if (typeof license !== "string" || license.length === 0) return "";
  const authors = isPlainObject(runtimeData.authors) ? runtimeData.authors : null;
  if (!authors) return license;
  const authorId = item.presentation.article?.author;
  const author = typeof authorId === "string" && isPlainObject(authors[authorId])
    ? authors[authorId]
    : isPlainObject(runtimeData.defaultAuthor) ? runtimeData.defaultAuthor : null;
  if (!author) return license;
  return license
    .replace("{author.name}", String(author.name || ""))
    .replace("{author.url}", String(author.url || ""));
}

function buildContributor(item, stellarConfig) {
  const repositories = resolveServiceProvider(stellarConfig.services.contributors)?.repositories;
  if (!Array.isArray(repositories)) return null;
  const source = item.source.file || "";
  const matched = repositories
    .filter(item => typeof item?.sourcePrefix === "string" && source.startsWith(item.sourcePrefix))
    .sort((left, right) => right.sourcePrefix.length - left.sourcePrefix.length)[0];
  if (!matched) return null;
  const relativePath = source.slice(matched.sourcePrefix.length).replace(/^\/+/, "");
  const branch = matched.branch || "main";
  const apiUrl = stellarConfig.services.github.apiUrl.replace(/\/+$/, "");
  return {
    editUrl: `https://github.com/${matched.repository}/blob/${branch}/${relativePath}`,
    commitsUrl: `${apiUrl}/repos/${matched.repository}/commits?path=${encodeURIComponent(relativePath)}`
  };
}

function buildPostArticleRender(input, item) {
  const runtimeData = input.runtimeData;
  const articleConfig = requireContentConfig(input.stellarConfig, input.themeSource).article;
  const frontMatter = input.frontMatter;
  const footer = item.presentation.footer || {};
  const extensionConfig = input.stellarConfig;
  const configuredShare = footer.share === true
    ? articleConfig.footer.share
    : Array.isArray(footer.share) ? footer.share : [];
  const configuredLicense = footer.license === true
    ? articleConfig.footer.license
    : footer.license;
  const shareServices = filterShareServices(configuredShare);
  const summarySource = typeof frontMatter.description === "string" && frontMatter.description.length > 0
    ? frontMatter.description
    : item.excerpt || item.content;
  const relatedPostsLimit = articleConfig.relatedPostsLimit;

  return {
    heti: extensionConfig.features.heti.enabled === true,
    tags: footer.showTags === true ? normalizeLinks(input.page.tagLinks) : [],
    footer: {
      references: Array.isArray(footer.references) ? cloneValue(footer.references) : [],
      license: resolveLicense(configuredLicense, item, runtimeData),
      share: shareServices.length > 0 ? {
        services: shareServices,
        permalink: item.route.permalink,
        title: `${item.title} - ${String(input.siteConfig.title || "")}`,
        image: item.cover || "",
        summary: truncate(stripHTML(summarySource), { length: 120 })
      } : null,
      contributor: buildContributor(item, input.stellarConfig)
    },
    previous: normalizePostLink(input.page.previous),
    next: normalizePostLink(input.page.next),
    related: {
      enabled: relatedPostsLimit > 0,
      title: "",
      maxCount: relatedPostsLimit,
      items: normalizeRelatedItems(input.relatedItems)
    },
    comments: buildCommentsRender(input.stellarConfig, item)
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
    cover: item.cover || "",
    caption: caption({
      tagline: item.tagline,
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
      : String(input.runtimeData.defaultAuthor?.id || ""),
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
  const seoConfig = input.stellarConfig;
  const appearance = input.stellarConfig.appearance;
  const fallbacks = input.stellarConfig.fallbacks;
  const canonicalConfig = seoConfig.canonical;
  const frontMatter = input.frontMatter;
  const page = input.page;
  const articleStyle = typeof item.presentation.article?.style === "string"
    ? item.presentation.article.style
    : null;
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
  const cardCover = item.cover || "";
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
    defaultCover: fallbacks.cover
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

  const regionLayout = finalizedRegions(input, collection, item);
  return {
    document: {
      language: normalizeLanguage(page.lang, page.language, frontMatter.lang, frontMatter.language, siteConfig.language),
      headBeginInject: normalizeInject(frontMatter.inject?.headBegin),
      headEndInject: normalizeInject(frontMatter.inject?.headEnd),
      bodyBeginInject: normalizeInject(frontMatter.inject?.bodyBegin),
      bodyEndInject: normalizeInject(frontMatter.inject?.bodyEnd),
      preferredTheme: appearance.colorScheme === "auto"
        ? "auto"
        : String(appearance.colorScheme || "")
    },
    layout: {
      pageType: "content",
      articleStyle,
      indent: articleIndentEnabled(item.presentation.article),
      siteBackground: Boolean(appearance.backgrounds.page.image),
      blogPath: typeof siteConfig.index_generator?.path === "string" ? normalizeCollectionPath(siteConfig.index_generator.path) : "",
      ...renderRegionLayout(regionLayout),
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

function buildCommentsRender(stellarConfig, item) {
  return resolveCommentsModel(stellarConfig, item.presentation.comments, item.title);
}

function buildContentItemModel(page, frontMatter, collection, source, options = {}) {
  const pageNavigation = toContentNavigation(frontMatter);
  const pageRegions = pick(frontMatter, CONTENT_MODEL_FIELDS.regionIds);
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
    cover: typeof frontMatter.cover === "string" ? frontMatter.cover : "",
    tagline: typeof frontMatter.tagline === "string" ? frontMatter.tagline : "",
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
      banner: mergeConfig(
        collection.presentation.banner,
        pick(frontMatter.banner, CONTENT_MODEL_FIELDS.banner)
      ),
      ...cascadeRegions([collection.presentation, pageRegions]),
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
    icon: typeof config.icon === "string" ? config.icon : ""
  };
}

module.exports = { cloneValue, deepFreeze, pick, mergeConfig, toContentNavigation, collectionIndexHref, collectionBrand, assertCollectionBrandConfig, articleIndentEnabled, finalizedRegions, renderRegionLayout, assertNormalizedConfig, layoutConfigRequirement, normalizeDate, normalizeLanguage, normalizeTerms, normalizeCollectionPath, normalizeStringList, normalizeInject, normalizeCategoryLinks, normalizeLinks, normalizePostLink, normalizeRelatedItems, categoryStyle, resolveLicense, buildContributor, buildPostArticleRender, buildPostListingRender, absoluteSiteAsset, canonicalUrl, buildPostRenderModel, buildCommentsRender, buildContentItemModel, normalizeCollectionIdentity };
