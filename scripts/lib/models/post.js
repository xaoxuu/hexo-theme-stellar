"use strict";

const { isPlainObject } = require("../content-config");
const { profilePath, requireLayoutProfiles, toRenderNavigation, toRenderRegions } = require("../layout-config");
const { normalizeBrand } = require("../brand");
const { normalizeThemeComments } = require("../comments");
const { articleFooterDefaults, articlePresentationDefaults, requireContentConfig } = require("../content-defaults");
const { deepFreeze, assertNormalizedConfig, layoutConfigRequirement, buildPostRenderModel, buildContentItemModel } = require("./shared");

function buildPostCollectionModel(stellarConfig) {
  const profiles = requireLayoutProfiles(stellarConfig);
  const postProfile = profiles.post;
  const blogIndex = profiles.blogIndex;
  const content = requireContentConfig(stellarConfig);
  const article = content.article;
  const comments = normalizeThemeComments(stellarConfig.comments);
  const navigation = toRenderNavigation(postProfile);
  const regions = toRenderRegions(stellarConfig, postProfile);

  return deepFreeze({
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
  });
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

  const collection = input.collectionModel || buildPostCollectionModel(input.stellarConfig);
  const item = buildContentItemModel(page, frontMatter, collection, source);
  const render = buildPostRenderModel({ ...input, siteConfig, runtimeData, frontMatter, page }, collection, item);
  return deepFreeze({ collection, item, render });
}

module.exports = { buildPostCollectionModel, buildPostPageViewModel };
