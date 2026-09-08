"use strict";

const { stripHTML, truncate } = require("hexo-util");
const { CONTENT_MODEL_FIELDS, ContentConfigError, isPlainObject } = require("../content-config");
const { profilePath, requireLayoutProfiles, toRenderNavigation, toRenderRegions } = require("../layout-config");
const { firstContentImage } = require("../seo");
const { caption } = require("../caption");
const { wikiReadmeHtml } = require("../wiki_readme");
const { filterShareServices } = require("../share-services");
const { projectHeroEffect } = require("../hero-effect-registry");
const { normalizeThemeComments } = require("../comments");
const { articleFooterDefaults, articlePresentationDefaults, collectionFooterDefaults, requireContentConfig } = require("../content-defaults");
const { cloneValue, deepFreeze, pick, mergeConfig, toContentNavigation, collectionBrand, assertCollectionBrandConfig, articleIndentEnabled, finalizedRegions, renderRegionLayout, assertNormalizedConfig, layoutConfigRequirement, normalizeLanguage, normalizeTerms, normalizeCollectionPath, normalizeStringList, normalizeInject, resolveLicense, buildContributor, canonicalUrl, buildCommentsRender, buildContentItemModel, normalizeCollectionIdentity } = require("./shared");

function heroBackground(value) {
  const background = cloneValue(value || {});
  if (background.effect) background.effect = projectHeroEffect(background.effect);
  return background;
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

function wikiPageLink(value) {
  if (!value || typeof value.path !== "string" || value.path.length === 0) return null;
  return {
    title: String(value.title || ""),
    path: normalizeCollectionPath(value.path),
    date: null
  };
}

const wikiNeighbors = new WeakMap();

function wikiReadNext(collection, item) {
  if (!wikiNeighbors.has(collection)) {
    const pages = collection.navigation.tree.flatMap(section => section.items || [])
      .filter(page => Number.isFinite(page.pageNumber)).sort((a, b) => a.pageNumber - b.pageNumber);
    const numbers = new Map(pages.map(page => [page.pageNumber, page]));
    wikiNeighbors.set(collection, new Map(pages.map(page => [page.path, Object.freeze({
      previous: wikiPageLink(numbers.get(page.pageNumber - 1)), next: wikiPageLink(numbers.get(page.pageNumber + 1))
    })])));
  }
  return wikiNeighbors.get(collection).get(item.route.path) || { previous: null, next: null };
}

function buildWikiRelated(input) {
  if (!Array.isArray(input.relatedCollections)) return [];
  return input.relatedCollections.map(group => ({
    name: String(group?.name || ""),
    items: Array.isArray(group?.items) ? group.items.map(project => {
      const { identity, route } = project;
      return {
        href: normalizeCollectionPath(route.homepage || route.path || ""),
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
  const shareServices = filterShareServices(configuredShare);
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
      headBeginInject: normalizeInject(frontMatter.inject?.headBegin),
      headEndInject: normalizeInject(frontMatter.inject?.headEnd),
      bodyBeginInject: normalizeInject(frontMatter.inject?.bodyBegin),
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
      background: heroBackground(hero.background),
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
  const globalFooter = collectionFooterDefaults(content);

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
      listed: input.collectionListed !== false && collectionConfig.visibility?.listed !== false,
      searchable: collectionConfig.visibility?.searchable !== false
    }
  };
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

  const collection = input.collectionModel || buildWikiCollectionModel({ ...input, collectionConfig }, collectionId);
  const item = buildContentItemModel(page, frontMatter, collection, source, {
    source: collection.source,
    visibility: mergeConfig(
      { listed: true, searchable: true },
      input.collectionConfig?.visibility
    )
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
  return deepFreeze({ collection, item, render });
}

function buildWikiPageViewModel(input) {
  return completeWikiPageViewModel(input, buildWikiPageViewModelBase(input));
}

module.exports = { heroBackground, wikiTitle, wikiPageLink, wikiReadNext, buildWikiRelated, buildWikiListingRender, buildWikiRenderModel, normalizeWikiTree, buildWikiCollectionModel, buildWikiPageViewModelBase, completeWikiPageViewModel, buildWikiPageViewModel };
