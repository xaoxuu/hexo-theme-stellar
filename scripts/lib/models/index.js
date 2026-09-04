"use strict";

const { gravatar, stripHTML, truncate } = require("hexo-util");
const {
  CONTENT_MODEL_FIELDS,
  ContentConfigError,
  isPlainObject
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
  toRenderNavigation,
  toRenderRegions
} = require("../layout-config");
const { cascadeRegions, resolveRegions } = require("../regions");
const { normalizeBrand } = require("../brand");
const { firstContentImage, postDescription, postImages } = require("../seo");
const { caption } = require("../caption");
const { wikiReadmeHtml } = require("../wiki_readme");
const { resolveServiceProvider } = require("../service-provider");
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
  const shareServices = configuredShare.filter(name => ["wechat", "weibo", "email", "link"].includes(name));
  const summarySource = typeof frontMatter.description === "string" && frontMatter.description.length > 0
    ? frontMatter.description
    : item.excerpt || item.content;
  const relatedPostsLimit = articleConfig.relatedPostsLimit;

  return {
    heti: extensionConfig.features.heti.enabled === true,
    tags: footer.showTags === true ? normalizeLinks(input.page.tagLinks) : [],
    footer: {
      references: Array.isArray(footer.references) ? cloneValue(footer.references) : [],
      license: resolveLicense(footer.license, item, runtimeData),
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
      headEndInject: normalizeInject(frontMatter.inject?.headEnd),
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

function wikiTitle(itemTitle, collectionName, siteTitle, language) {
  const title = String(itemTitle || "");
  const wiki = String(collectionName || "");
  let stripped = title;
  if (title.toLowerCase() === wiki.toLowerCase()) {
    stripped = "";
  } else if (wiki.length > 0) {
    const flex = wiki.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[\s-]+/g, "[\\s-]*");
    const matched = title.match(new RegExp(`^${flex}[\\s-]*[：:\\-](.*)$`, "i"));
    if (matched?.[1]) stripped = matched[1].trim();
  }
  const colon = String(language || "").toLowerCase().startsWith("zh") ? "：" : ": ";
  const subject = stripped ? `${wiki}${colon}${stripped}` : wiki;
  return subject ? `${subject} - ${String(siteTitle || "")}` : String(siteTitle || "");
}

function buildCommentsRender(stellarConfig, item) {
  const comments = item.presentation.comments || {};
  const service = typeof comments.provider === "string" ? comments.provider : "";
  const extensionConfig = stellarConfig;
  const options = mergeConfig(
    service && isPlainObject(extensionConfig.comments?.[service])
      ? extensionConfig.comments[service]
      : {},
    isPlainObject(comments.options) ? comments.options : {}
  );
  const preferredTheme = stellarConfig.appearance.colorScheme;
  if (service === "giscus" && preferredTheme !== "auto" && options["data-theme"] === "preferred_color_scheme") {
    options["data-theme"] = preferredTheme;
  }
  return {
    enabled: comments.enabled !== false && service.length > 0,
    title: typeof comments.title === "string"
      ? comments.title
      : extensionConfig.comments.title,
    id: typeof comments.id === "string" ? comments.id : "",
    service,
    options,
    pageTitle: item.title
  };
}

function wikiPageLink(value) {
  if (!value || typeof value.path !== "string" || value.path.length === 0) return null;
  return {
    title: String(value.title || ""),
    path: normalizeCollectionPath(value.path),
    date: null
  };
}

function wikiReadNext(collection, item) {
  const pages = collection.navigation.tree.flatMap(section => section.items || [])
    .filter(page => Number.isFinite(page.pageNumber))
    .sort((left, right) => left.pageNumber - right.pageNumber);
  const current = pages.find(page => page.path === item.route.path);
  if (!current) return { previous: null, next: null };
  return {
    previous: wikiPageLink(pages.find(page => page.pageNumber === current.pageNumber - 1)),
    next: wikiPageLink(pages.find(page => page.pageNumber === current.pageNumber + 1))
  };
}

function buildWikiRelated(input) {
  if (!Array.isArray(input.relatedCollections)) return [];
  return input.relatedCollections.map(group => ({
    name: String(group?.name || ""),
    items: Array.isArray(group?.items) ? group.items.map(project => {
      const identity = isPlainObject(project?.identity) ? project.identity : project;
      const route = isPlainObject(project?.route) ? project.route : {};
      return {
        href: normalizeCollectionPath(route.homepage || project?.homepage?.path || route.path || ""),
        title: String(identity?.name || project?.id || ""),
        description: String(identity?.description || "")
      };
    }).filter(project => project.href.length > 0 && project.title.length > 0) : []
  })).filter(group => group.name.length > 0 && group.items.length > 0);
}

function buildWikiListingRender(input, collection) {
  const repository = typeof collection.source.repository === "string" ? collection.source.repository : "";
  const githubApi = input.stellarConfig.services.github.apiUrl;
  return {
    id: collection.id,
    href: collection.route.homepage,
    name: collection.identity.name,
    headline: collection.identity.headline,
    caption: collection.identity.tagline || collection.identity.description,
    description: collection.identity.description,
    tags: normalizeTerms(input.collectionConfig.tags),
    audience: collection.identity.audience,
    icon: collection.identity.icon,
    cover: collection.cover || "",
    repository,
    repositoryApi: repository ? `${githubApi}/repos/${repository}` : "",
    priority: collection.listing.priority,
    order: collection.listing.order ?? 0,
    listed: collection.visibility.listed !== false
  };
}

function buildWikiRenderModel(input, collection, item) {
  const siteConfig = input.siteConfig;
  const stellarConfig = input.stellarConfig;
  const frontMatter = input.frontMatter;
  const appearance = stellarConfig.appearance;
  const seoConfig = stellarConfig;
  const language = normalizeLanguage(
    input.page.lang,
    input.page.language,
    frontMatter.lang,
    frontMatter.language,
    siteConfig.language
  );
  const articleStyle = typeof item.presentation.article?.style === "string"
    ? item.presentation.article.style
    : null;
  const explicitDescription = typeof frontMatter.description === "string" && frontMatter.description.length > 0
    ? frontMatter.description
    : "";
  const descriptionSource = explicitDescription || collection.identity.description || item.excerpt || item.content;
  const description = truncate(stripHTML(descriptionSource), { length: 150 });
  const keywords = normalizeStringList(frontMatter.keywords);
  if (keywords.length === 0) keywords.push(...(item.tags.length > 0 ? item.tags : normalizeStringList(siteConfig.keywords)));
  const cardCover = item.cover || "";
  const bannerImage = item.presentation.banner?.image || "";
  const openGraphConfig = seoConfig.openGraph;
  let openGraph = null;
  if (openGraphConfig.enabled === true) {
    const pageOpenGraph = isPlainObject(frontMatter.seo?.openGraph) ? frontMatter.seo.openGraph : {};
    const args = {
      type: "website",
      title: item.title || collection.identity.headline,
      url: item.route.permalink,
      site_name: String(siteConfig.title || ""),
      description: stripHTML(descriptionSource).substring(0, 200).trim().replace(/\n/g, " "),
      language,
      author: String(siteConfig.author || ""),
      date: false,
      updated: false,
      image: cardCover || bannerImage || firstContentImage(item.content) || siteConfig.avatar || null
    };
    if (openGraphConfig.twitterId) args.twitter_id = openGraphConfig.twitterId;
    if (cardCover || bannerImage) args.twitter_card = "summary_large_image";
    Object.assign(args, cloneValue(pageOpenGraph));
    openGraph = {
      args,
      title: item.title || collection.identity.headline,
      siteName: String(siteConfig.title || ""),
      twitterTitle: item.title || collection.identity.headline,
      publishedTime: null,
      modifiedTime: null,
      tags: []
    };
  }

  const articleDefaults = articleFooterDefaults(requireContentConfig(stellarConfig, input.themeSource));
  const footer = item.presentation.footer || {};
  const resolvedLicense = footer.license === true
    ? articleDefaults.license
    : footer.license === false || footer.license == null ? "" : footer.license;
  const configuredShare = footer.share === true
    ? articleDefaults.share
    : Array.isArray(footer.share) ? footer.share : [];
  const shareServices = configuredShare.filter(name => ["wechat", "weibo", "email", "link"].includes(name));
  const readNext = wikiReadNext(collection, item);
  const isHomepage = collection.route.homepage === item.route.path;
  const hero = collection.presentation.hero || {};
  const repository = typeof collection.source.repository === "string" ? collection.source.repository : "";
  const githubApi = stellarConfig.services.github.apiUrl;
  const rawUrl = stellarConfig.services.github.rawUrl;
  const banner = mergeConfig({}, item.presentation.banner || {});
  if (banner.headline == null) banner.headline = item.title;
  const readmeHtml = isHomepage ? wikiReadmeHtml(
    { source: collection.source, homepage: { path: item.route.path } },
    { path: item.route.path, content: item.content },
    { rawUrl }
  ) : "";

  const regionLayout = finalizedRegions(input, collection, item);
  return {
    document: {
      language,
      headEndInject: normalizeInject(frontMatter.inject?.headEnd),
      bodyEndInject: normalizeInject(frontMatter.inject?.bodyEnd),
      preferredTheme: appearance.colorScheme === "auto" ? "auto" : String(appearance.colorScheme || "")
    },
    layout: {
      pageType: "content",
      articleStyle,
      indent: articleIndentEnabled(item.presentation.article),
      siteBackground: Boolean(appearance.backgrounds.page.image),
      wikiIndexPath: profilePath(requireLayoutProfiles(stellarConfig).wikiIndex.path),
      algoliaFilterPath: (() => {
        const matched = `${item.route.path}/`.match(/(.*?)\/(.*?)\//i);
        return matched?.[0] || "";
      })(),
      ...renderRegionLayout(regionLayout),
      breadcrumbs: [{
        name: collection.identity.name,
        path: collection.route.homepage
      }]
    },
    seo: {
      title: wikiTitle(item.title, collection.identity.name, siteConfig.title, language),
      description,
      keywords,
      robots: input.isBackup === true
        ? "noindex, nofollow"
        : typeof frontMatter.robots === "string" && frontMatter.robots.length > 0 ? frontMatter.robots : null,
      canonical: canonicalUrl(seoConfig.canonical.host, item.route.path),
      openGraph,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": item.route.permalink,
        name: item.title || collection.identity.headline,
        description,
        url: item.route.permalink,
        isPartOf: {
          "@type": "WebSite",
          name: String(siteConfig.title || ""),
          url: String(siteConfig.url || "")
        }
      }
    },
    cover: {
      enabled: isHomepage && hero.enabled === true,
      background: cloneValue(hero.background || {}),
      preview: cloneValue(hero.preview || {}),
      actions: cloneValue(Array.isArray(hero.actions) ? hero.actions : []),
      title: collection.identity.headline || collection.identity.name,
      description: collection.identity.description || explicitDescription,
      repository,
      sourceUrl: repository ? `https://github.com/${repository}` : "",
      releaseApi: repository ? `${githubApi}/repos/${repository}/tags` : "",
      projectName: collection.identity.name || collection.id,
      siteName: String(siteConfig.title || "")
    },
    article: {
      heti: stellarConfig.features.heti.enabled === true,
      banner,
      updated: item.updated,
      readmeHtml,
      footer: {
        references: Array.isArray(footer.references) ? cloneValue(footer.references) : [],
        license: resolveLicense(String(resolvedLicense || ""), item, input.runtimeData),
        share: shareServices.length > 0 ? {
          services: shareServices,
          permalink: item.route.permalink,
          title: `${item.title} - ${String(siteConfig.title || "")}`,
          image: cardCover,
          summary: truncate(stripHTML(descriptionSource), { length: 120 })
        } : null,
        contributor: buildContributor(item, stellarConfig)
      },
      previous: readNext.previous,
      next: readNext.next,
      comments: buildCommentsRender(stellarConfig, item),
      related: Array.isArray(input.related) ? cloneValue(input.related) : buildWikiRelated(input)
    },
    listing: isPlainObject(input.listing)
      ? cloneValue(input.listing)
      : buildWikiListingRender(input, collection)
  };
}

function buildCollectionModel(stellarConfig) {
  const profiles = requireLayoutProfiles(stellarConfig);
  const postProfile = profiles.post;
  const blogIndex = profiles.blogIndex;
  const content = requireContentConfig(stellarConfig);
  const article = content.article;
  const comments = normalizeThemeComments(stellarConfig.comments);
  const navigation = toRenderNavigation(postProfile);
  const regions = toRenderRegions(stellarConfig, postProfile);

  return {
    id: "post",
    profile: "post",
    identity: normalizeBrand(stellarConfig.leftbar.brand),
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
      banner: {},
      ...regions,
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
  const provider = typeof source.provider === "string" ? source.provider : null;
  return {
    enabled: source.enabled !== false,
    title: typeof source.title === "string" ? source.title : "",
    id: typeof source.id === "string" ? source.id : "",
    provider,
    options: {}
  };
}

function buildWikiCollectionModel(input, collectionId) {
  const collectionConfig = input.collectionConfig;
  const collectionState = isPlainObject(input.collectionState) ? input.collectionState : {};
  const profiles = requireLayoutProfiles(input.stellarConfig);
  const wikiProfile = profiles.wiki;
  const indexWiki = profiles.wikiIndex;
  const content = requireContentConfig(input.stellarConfig, input.themeSource);
  const collectionRoute = isPlainObject(collectionConfig.route) ? collectionConfig.route : {};
  const collectionListing = isPlainObject(collectionConfig.listing) ? collectionConfig.listing : {};
  const baseDir = collectionRoute.path || `${profilePath(indexWiki.path) || "wiki"}/${collectionId}`;
  const identity = normalizeCollectionIdentity(collectionConfig);

  const profileNavigation = toRenderNavigation(wikiProfile);
  const collectionNavigation = toContentNavigation(collectionConfig);
  const collectionRegions = pick(collectionConfig, CONTENT_MODEL_FIELDS.regionIds);
  const defaultBrand = collectionBrand(identity, baseDir, {
    indexPath: indexWiki.path,
    backLabel: "btn.all_wiki"
  });
  assertCollectionBrandConfig(collectionConfig, "collection", input.collectionSource || "<collection>");
  const regions = toRenderRegions(input.stellarConfig, wikiProfile, {
    leftbar: { brand: defaultBrand }
  }, {
    brandSources: { collection: defaultBrand },
    layers: [collectionRegions]
  });
  const globalArticle = articlePresentationDefaults(content);
  const globalFooter = articleFooterDefaults(content);

  return {
    id: collectionId,
    profile: "wiki",
    identity,
    cover: typeof collectionConfig.cover === "string" ? collectionConfig.cover : "",
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
      order: collectionListing.order ?? 0,
      excerptLength: collectionListing.excerptLength ?? null,
      perPage: collectionListing.perPage ?? null
    },
    presentation: {
      hero: cloneValue(collectionConfig.hero || {}),
      banner: pick(collectionConfig.banner, CONTENT_MODEL_FIELDS.banner),
      ...regions,
      article: mergeConfig(globalArticle, pick(collectionConfig.article, CONTENT_MODEL_FIELDS.article)),
      footer: mergeConfig(globalFooter, pick(collectionConfig.footer, CONTENT_MODEL_FIELDS.footer)),
      comments: mergeConfig(
        normalizeThemeComments(input.stellarConfig.comments),
        pick(collectionConfig.comments, CONTENT_MODEL_FIELDS.comments)
      )
    },
    visibility: {
      listed: input.collectionListed !== false,
      searchable: true
    }
  };
}

function buildTopicSeries(collectionId, members, currentId, sort) {
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

  const field = sort?.field || "date";
  const direction = sort?.direction === "asc" ? 1 : -1;
  if (field === "date") {
    items.sort((left, right) => {
      const compared = String(left.date || "").localeCompare(String(right.date || "")) * direction;
      return compared || left.index - right.index;
    });
  }
  return items.map(({ index, ...item }) => item);
}

function buildTopicCollectionModel(input, collectionId, currentId) {
  const siteConfig = input.siteConfig;
  const collectionConfig = input.collectionConfig;
  const profiles = requireLayoutProfiles(input.stellarConfig);
  const topicProfile = profiles.topic;
  const indexTopic = profiles.topicIndex;
  const collectionRoute = isPlainObject(collectionConfig.route) ? collectionConfig.route : {};
  const collectionListing = isPlainObject(collectionConfig.listing) ? collectionConfig.listing : {};
  const content = requireContentConfig(input.stellarConfig, input.themeSource);
  const baseDir = profilePath(indexTopic.path) || "topic";
  const routePath = collectionRoute.path || `${baseDir}/${collectionId}`;
  const sort = collectionListing.sort ?? { field: "date", direction: "desc" };

  const profileNavigation = toRenderNavigation(topicProfile);
  const collectionNavigation = toContentNavigation(collectionConfig);
  const collectionRegions = pick(collectionConfig, CONTENT_MODEL_FIELDS.regionIds);
  const availableBrand = collectionBrand(normalizeCollectionIdentity(collectionConfig), routePath, {
    indexPath: indexTopic.path,
    backLabel: "btn.all_topic"
  });
  assertCollectionBrandConfig(collectionConfig, "site", input.collectionSource || "<collection>");
  const regions = toRenderRegions(input.stellarConfig, topicProfile, null, {
    brandSources: { collection: availableBrand },
    layers: [collectionRegions]
  });
  const globalArticle = articlePresentationDefaults(content);
  const globalFooter = articleFooterDefaults(content);

  return {
    id: collectionId,
    profile: "topic",
    identity: normalizeCollectionIdentity(collectionConfig),
    cover: typeof collectionConfig.cover === "string" ? collectionConfig.cover : "",
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
      series: buildTopicSeries(collectionId, input.members, currentId, sort)
    },
    listing: {
      priority: collectionListing.priority ?? 0,
      order: collectionListing.order ?? null,
      cardStyle: content.article.listing.cardLayout,
      excerptLength: collectionListing.excerptLength ?? null,
      perPage: collectionListing.perPage ?? null,
      sort
    },
    presentation: {
      banner: pick(collectionConfig.banner, CONTENT_MODEL_FIELDS.banner),
      ...regions,
      article: mergeConfig(
        globalArticle,
        pick(collectionConfig.article, CONTENT_MODEL_FIELDS.article)
      ),
      footer: mergeConfig(globalFooter, pick(collectionConfig.footer, CONTENT_MODEL_FIELDS.footer)),
      comments: mergeConfig(
        normalizeThemeComments(input.stellarConfig.comments),
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
  const siteConfig = input.siteConfig;
  const collectionConfig = input.collectionConfig;
  const profiles = requireLayoutProfiles(input.stellarConfig);
  const content = requireContentConfig(input.stellarConfig, input.themeSource);
  const notebookDefaults = content.notebook;
  const collectionListing = isPlainObject(collectionConfig.listing) ? collectionConfig.listing : {};
  const defaultListing = notebookDefaults.listing;
  const baseDir = notebookBaseDir(collectionId, collectionConfig, input.stellarConfig);
  const identity = normalizeCollectionIdentity(collectionConfig);
  const profileNavigation = toRenderNavigation(profiles.noteIndex);
  const collectionNavigation = toContentNavigation(collectionConfig);
  const collectionRegions = pick(collectionConfig, CONTENT_MODEL_FIELDS.regionIds);
  const defaultBrand = collectionBrand(identity, baseDir, {
    indexPath: profiles.notebookIndex.path,
    backLabel: "btn.all_notebook"
  });
  assertCollectionBrandConfig(collectionConfig, "collection", input.collectionSource || "<collection>");
  const regions = toRenderRegions(input.stellarConfig, profiles.note, {
    leftbar: { brand: defaultBrand }
  }, {
    brandSources: { collection: defaultBrand },
    layers: [collectionRegions]
  });
  const globalArticle = articlePresentationDefaults(content);
  const globalFooter = {
    references: [],
    license: notebookDefaults.footer.license ?? content.article.footer.license,
    share: notebookDefaults.footer.share ?? content.article.footer.share,
    showTags: content.article.footer.showTags
  };

  return {
    id: collectionId,
    profile: "notebook",
    identity,
    cover: typeof collectionConfig.cover === "string" ? collectionConfig.cover : "",
    source: pick(collectionConfig.source, CONTENT_MODEL_FIELDS.source),
    route: { baseDir },
    navigation: {
      ...mergeConfig(profileNavigation, collectionNavigation),
      tags: buildNotebookTagNavigation(collectionId, baseDir, input.collectionItems)
    },
    listing: {
      priority: collectionListing.priority ?? 0,
      order: collectionListing.order ?? 0,
      excerptLength: collectionListing.excerptLength ?? defaultListing.excerptLength,
      perPage: collectionListing.perPage ?? defaultListing.perPage ?? siteConfig.per_page ?? 10,
      sort: collectionListing.sort ?? defaultListing.sort
    },
    presentation: {
      banner: pick(collectionConfig.banner, CONTENT_MODEL_FIELDS.banner),
      ...regions,
      article: mergeConfig(globalArticle, pick(collectionConfig.article, CONTENT_MODEL_FIELDS.article)),
      footer: mergeConfig(globalFooter, pick(collectionConfig.footer, CONTENT_MODEL_FIELDS.footer)),
      comments: mergeConfig(
        normalizeThemeComments(input.stellarConfig.comments),
        pick(collectionConfig.comments, CONTENT_MODEL_FIELDS.comments)
      )
    },
    visibility: {
      listed: true,
      searchable: true
    }
  };
}

function buildNotebookTagTree(collection, inputTags) {
  const tags = Array.isArray(inputTags) && inputTags.length > 0
    ? inputTags
    : [{
        id: "",
        name: "",
        label: "",
        path: collection.route.baseDir,
        parentId: null
      }, ...collection.navigation.tags];
  const children = new Map();
  for (const tag of tags) {
    const parentId = typeof tag?.parentId === "string" ? tag.parentId : "";
    if (!children.has(parentId)) children.set(parentId, []);
    if (typeof tag?.id === "string" && tag.id.length > 0) children.get(parentId).push(tag.id);
  }
  return tags.map(tag => ({
    id: typeof tag?.id === "string" ? tag.id : "",
    name: typeof tag?.name === "string" ? tag.name : "",
    label: typeof tag?.label === "string"
      ? tag.label
      : typeof tag?.part === "string" ? tag.part : "",
    path: typeof tag?.path === "string" ? normalizeCollectionPath(tag.path) : collection.route.baseDir,
    parentId: typeof tag?.parentId === "string"
      ? tag.parentId
      : typeof tag?.parent === "string" && tag.parent.length > 0 ? tag.parent : null,
    children: Array.isArray(tag?.children) ? tag.children.slice() : (children.get(tag?.id || "") || []).slice()
  }));
}

function buildNotebookArticleTags(collection, item) {
  const navigation = new Map(collection.navigation.tags.map(tag => [tag.id, tag]));
  return item.tags.map(name => {
    const id = String(name).toLowerCase();
    const tag = navigation.get(id);
    return {
      name: String(name),
      path: tag?.path || normalizeCollectionPath(`${collection.route.baseDir}/tags/${id}`)
    };
  });
}

function buildNotebookRenderModel(input, collection, item) {
  const core = buildPostRenderModel(input, collection, item);
  const content = requireContentConfig(input.stellarConfig, input.themeSource);
  const explicitDescription = typeof input.frontMatter.description === "string"
    ? input.frontMatter.description
    : "";
  const excerpt = item.excerpt
    ? stripHTML(item.excerpt)
    : explicitDescription || (collection.listing.excerptLength > 0
      ? truncate(stripHTML(item.content), { length: collection.listing.excerptLength })
      : "");
  const collectionTitle = collection.identity.headline || collection.identity.name || collection.id;
  const configuredLicense = item.presentation.footer?.license;
  const openGraph = core.seo.openGraph == null ? null : {
    ...core.seo.openGraph,
    args: {
      ...core.seo.openGraph.args,
      type: "website"
    }
  };

  return {
    document: core.document,
    layout: {
      pageType: core.layout.pageType,
      articleStyle: core.layout.articleStyle,
      indent: core.layout.indent,
      siteBackground: core.layout.siteBackground,
      notebookIndexPath: profilePath(requireLayoutProfiles(input.stellarConfig).notebookIndex.path),
      notebookPath: collection.route.baseDir,
      algoliaFilterPath: collection.route.baseDir,
      topbar: core.layout.topbar,
      leftbar: core.layout.leftbar,
      rightbar: core.layout.rightbar,
      regionWarnings: core.layout.regionWarnings,
      breadcrumbs: [{ name: collectionTitle, path: collection.route.baseDir }],
      tagTree: buildNotebookTagTree(collection, input.tagTree),
      recentItems: cloneValue(Array.isArray(input.recentItems) ? input.recentItems : [])
    },
    seo: {
      ...core.seo,
      openGraph,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": item.route.permalink,
        name: item.title,
        description: core.seo.description,
        url: item.route.permalink,
        isPartOf: {
          "@type": "WebSite",
          name: String(input.siteConfig.title || ""),
          url: String(input.siteConfig.url || "")
        }
      }
    },
    article: {
      heti: core.article.heti,
      banner: cloneValue(item.presentation.banner || {}),
      created: item.date,
      updated: item.updated,
      tags: buildNotebookArticleTags(collection, item),
      footer: {
        ...core.article.footer,
        license: resolveLicense(configuredLicense, item, input.runtimeData)
      },
      comments: core.article.comments
    },
    listing: {
      id: item.id,
      collectionId: collection.id,
      collectionName: collection.identity.name,
      href: typeof input.page.link === "string" && input.page.link.length > 0
        ? input.page.link
        : item.route.path,
      title: item.title,
      cover: item.cover || "",
      excerpt,
      tags: item.tags.slice(),
      date: item.date,
      updated: item.updated,
      priority: item.listing.priority,
      listed: item.visibility.listed !== false
    }
  };
}

function buildPostPageViewModel(input) {
  const source = input.source || "<page>";
  const themeSource = input.themeSource || "<theme>";
  const siteConfig = isPlainObject(input.siteConfig) ? input.siteConfig : {};
  const runtimeData = isPlainObject(input.runtimeData) ? input.runtimeData : {};
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const page = input.page || {};

  assertNormalizedConfig(input.stellarConfig, themeSource, [
    {
      path: "stellarConfig.canonical",
      read: config => config?.canonical,
      expected: "normalized canonical object",
      migration: null
    },
    layoutConfigRequirement()
  ]);

  const collection = buildCollectionModel(input.stellarConfig);
  const item = buildContentItemModel(page, frontMatter, collection, source);
  const render = buildPostRenderModel({ ...input, siteConfig, runtimeData, frontMatter, page }, collection, item);
  return deepFreeze(assertPageViewModel("post", { collection, item, render }));
}

function buildWikiPageViewModelBase(input) {
  const source = input.source || "<page>";
  const themeSource = input.themeSource || "<theme>";
  const collectionSource = input.collectionSource || "<collection>";
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const page = input.page || {};

  assertNormalizedConfig(input.stellarConfig, themeSource, [
    {
      path: "stellarConfig.canonical",
      read: config => config?.canonical,
      expected: "normalized canonical object",
      migration: null
    },
    layoutConfigRequirement()
  ]);

  if (!isPlainObject(input.collectionConfig)) {
    const collectionId = input.collectionId || frontMatter.collection?.id || "<unknown>";
    throw new ContentConfigError([
      `${source}: collection.id ${collectionId} 未找到 Wiki 项目配置 ${collectionSource}`
    ]);
  }
  const collectionConfig = input.collectionConfig;

  const collectionId = input.collectionId || frontMatter.collection?.id;
  if (frontMatter.collection?.profile !== "wiki") {
    throw new ContentConfigError([`${source}: collection.profile 必须是 wiki`]);
  }
  if (collectionId !== frontMatter.collection.id) {
    throw new ContentConfigError([
      `${source}: collection.id ${frontMatter.collection.id} 与 Wiki 项目 ${collectionId} 不匹配`
    ]);
  }

  const collection = buildWikiCollectionModel({ ...input, collectionConfig }, collectionId);
  const item = buildContentItemModel(page, frontMatter, collection, source, {
    source: collection.source,
    visibility: { listed: true, searchable: true }
  });
  return { collection, item };
}

function completeWikiPageViewModel(input, base) {
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const page = input.page || {};
  const collection = base.collection;
  const item = base.item;
  const render = buildWikiRenderModel({
    ...input,
    siteConfig: isPlainObject(input.siteConfig) ? input.siteConfig : {},
    runtimeData: isPlainObject(input.runtimeData) ? input.runtimeData : {},
    frontMatter,
    page
  }, collection, item);
  return deepFreeze(assertPageViewModel("wiki", { collection, item, render }));
}

function buildWikiPageViewModel(input) {
  return completeWikiPageViewModel(input, buildWikiPageViewModelBase(input));
}

function buildTopicPageViewModelBase(input) {
  const source = input.source || "<page>";
  const themeSource = input.themeSource || "<theme>";
  const siteConfig = isPlainObject(input.siteConfig) ? input.siteConfig : {};
  const collectionConfig = input.collectionConfig;
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const page = input.page || {};
  const collectionId = input.collectionId || frontMatter.collection?.id;

  assertNormalizedConfig(input.stellarConfig, themeSource, [
    {
      path: "stellarConfig.canonical",
      read: config => config?.canonical,
      expected: "normalized canonical object",
      migration: null
    },
    layoutConfigRequirement()
  ]);

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
    collectionConfig
  }, collectionId, currentId);
  return deepFreeze({ collection });
}

function completeTopicPageViewModel(input, base) {
  const source = input.source || "<page>";
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const collection = base.collection;
  const item = buildContentItemModel(input.page || {}, frontMatter, collection, source, {
    source: collection.source,
    visibility: { listed: true, searchable: true }
  });
  const render = buildPostRenderModel({
    ...input,
    siteConfig: isPlainObject(input.siteConfig) ? input.siteConfig : {},
    runtimeData: isPlainObject(input.runtimeData) ? input.runtimeData : {},
    frontMatter: isPlainObject(input.frontMatter) ? input.frontMatter : {},
    page: input.page || {}
  }, collection, item);
  render.layout.blogPath = collection.route.baseDir;
  render.layout.breadcrumbs = [{
    name: collection.identity.headline || collection.identity.name || collection.id,
    path: collection.navigation.series[0]?.path || collection.route.path
  }];
  render.article.banner = cloneValue(item.presentation.banner || {});
  return deepFreeze(assertPageViewModel("topic", { collection, item, render }));
}

function buildTopicPageViewModel(input) {
  return completeTopicPageViewModel(input, buildTopicPageViewModelBase(input));
}

function buildTopicIndexRender(input) {
  const collectionId = input.collectionId;
  const collection = buildTopicCollectionModel(input, collectionId, "");
  const pages = collection.navigation.series.map(item => ({
    title: item.title,
    path: item.path,
    date: item.date
  }));
  const latest = pages[0] || null;
  const cover = collection.cover || "";
  return deepFreeze({
    id: collection.id,
    name: collection.identity.name,
    headline: collection.identity.headline,
    description: collection.identity.description,
    cover: typeof cover === "string" ? cover : "",
    href: latest?.path || "/",
    latest,
    items: pages.slice(1),
    sortDate: latest?.date || null,
    listed: collection.visibility.listed !== false
  });
}

function buildNotebookPageViewModelBase(input) {
  const source = input.source || "<page>";
  const themeSource = input.themeSource || "<theme>";
  const siteConfig = isPlainObject(input.siteConfig) ? input.siteConfig : {};
  const collectionConfig = input.collectionConfig;
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const page = input.page || {};
  const collectionId = input.collectionId;

  assertNormalizedConfig(input.stellarConfig, themeSource, [layoutConfigRequirement()]);

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
    collectionConfig
  }, collectionId);
  return deepFreeze({ collection });
}

function completeNotebookPageViewModel(input, base) {
  const source = input.source || "<page>";
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const collection = base.collection;
  const item = buildContentItemModel(input.page || {}, frontMatter, collection, source, {
    source: collection.source,
    visibility: { listed: true, searchable: true }
  });
  const render = buildNotebookRenderModel({
    ...input,
    siteConfig: isPlainObject(input.siteConfig) ? input.siteConfig : {},
    runtimeData: isPlainObject(input.runtimeData) ? input.runtimeData : {},
    frontMatter,
    page: input.page || {}
  }, collection, item);
  return deepFreeze(assertPageViewModel("notebook", { collection, item, render }));
}

function buildNotebookPageViewModel(input) {
  return completeNotebookPageViewModel(input, buildNotebookPageViewModelBase(input));
}

module.exports = {
  buildNotebookPageViewModelBase,
  buildNotebookPageViewModel,
  buildPostPageViewModel,
  buildTopicIndexRender,
  buildTopicPageViewModel,
  buildTopicPageViewModelBase,
  buildWikiListingRender,
  buildWikiPageViewModel,
  buildWikiPageViewModelBase,
  buildWikiRelated,
  completeNotebookPageViewModel,
  completeTopicPageViewModel,
  completeWikiPageViewModel
};
