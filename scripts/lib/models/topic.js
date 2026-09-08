"use strict";

const { CONTENT_MODEL_FIELDS, ContentConfigError, isPlainObject } = require("../content-config");
const { profilePath, requireLayoutProfiles, toRenderNavigation, toRenderRegions } = require("../layout-config");
const { normalizeThemeComments } = require("../comments");
const { articlePresentationDefaults, collectionFooterDefaults, requireContentConfig } = require("../content-defaults");
const { cloneValue, deepFreeze, pick, mergeConfig, toContentNavigation, collectionBrand, assertCollectionBrandConfig, assertNormalizedConfig, layoutConfigRequirement, normalizeDate, normalizeCollectionPath, buildPostRenderModel, buildContentItemModel, normalizeCollectionIdentity } = require("./shared");

function buildTopicSeries(collectionId, members, sort) {
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
      date: normalizeDate(page.date ?? config.date)
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

function buildTopicCollectionModel(input, collectionId) {
  const siteConfig = input.siteConfig;
  const collectionConfig = input.collectionConfig;
  const profiles = requireLayoutProfiles(input.stellarConfig);
  const topicProfile = profiles.topic;
  const collectionRoute = isPlainObject(collectionConfig.route) ? collectionConfig.route : {};
  const collectionListing = isPlainObject(collectionConfig.listing) ? collectionConfig.listing : {};
  const content = requireContentConfig(input.stellarConfig, input.themeSource);
  const baseDir = profilePath(topicProfile.path) || "topic";
  const routePath = collectionRoute.path || `${baseDir}/${collectionId}`;
  const sort = collectionListing.sort ?? { field: "date", direction: "desc" };

  const profileNavigation = toRenderNavigation(topicProfile);
  const collectionNavigation = toContentNavigation(collectionConfig);
  const collectionRegions = pick(collectionConfig, CONTENT_MODEL_FIELDS.regionIds);
  const availableBrand = collectionBrand(normalizeCollectionIdentity(collectionConfig), routePath, {
    indexPath: topicProfile.path,
    backLabel: "btn.all_topic"
  });
  assertCollectionBrandConfig(collectionConfig, "site", input.collectionSource || "<collection>");
  const regions = toRenderRegions(input.stellarConfig, topicProfile, null, {
    brandSources: { collection: availableBrand },
    layers: [collectionRegions]
  });
  const globalArticle = articlePresentationDefaults(content);
  const globalFooter = collectionFooterDefaults(content);

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
      series: buildTopicSeries(collectionId, input.members, sort)
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
      listed: input.collectionListed !== false && collectionConfig.visibility?.listed !== false,
      searchable: collectionConfig.visibility?.searchable !== false
    }
  };
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
  const collection = input.collectionModel || buildTopicCollectionModel({
    ...input,
    siteConfig,
    collectionConfig
  }, collectionId);
  return deepFreeze({ collection });
}

function completeTopicPageViewModel(input, base) {
  const source = input.source || "<page>";
  const frontMatter = isPlainObject(input.frontMatter) ? input.frontMatter : {};
  const collection = base.collection;
  const item = buildContentItemModel(input.page || {}, frontMatter, collection, source, {
    source: collection.source,
    visibility: mergeConfig(
      { listed: true, searchable: true },
      input.collectionConfig?.visibility
    )
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
  return deepFreeze({ collection, item, render });
}

function buildTopicPageViewModel(input) {
  return completeTopicPageViewModel(input, buildTopicPageViewModelBase(input));
}

function buildTopicIndexRender(input) {
  const collectionId = input.collectionId;
  const collection = input.collectionModel || buildTopicCollectionModel(input, collectionId);
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

module.exports = { buildTopicSeries, buildTopicCollectionModel, buildTopicPageViewModelBase, completeTopicPageViewModel, buildTopicPageViewModel, buildTopicIndexRender };
