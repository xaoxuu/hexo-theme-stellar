'use strict';

const {
  ContentConfigError,
  parseCollectionConfig,
  parsePageConfig,
  validateThemeConfig
} = require('../../lib/content-config');
const {
  readFrontMatter,
  sourcePathForData,
  sourcePathForPage
} = require("../../lib/source-config");
const {
  buildNotebookPageViewModel,
  buildTopicIndexRender,
  buildTopicPageViewModelBase,
  completeTopicPageViewModel
} = require("../../lib/models");
const {
  resetPageViewModels,
  setPageConfig,
  setPostViewModelInput,
  setTopicViewModelBase,
  setTopicViewModelInput
} = require("../../lib/page-view-model-registry");
const { ensureRuntimeData } = require("../../lib/runtime-data");

function plainTerms(value) {
  if (value == null) return [];
  const items = Array.isArray(value) ? value : [value];
  return items.map(item => {
    if (typeof item === "string") return item;
    if (item != null && typeof item.name === "string") return item.name;
    return null;
  }).filter(Boolean);
}

function plainTermLinks(value) {
  let items = value;
  if (items != null && !Array.isArray(items) && typeof items.toArray === "function") {
    items = items.toArray();
  }
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    name: typeof item?.name === "string" ? item.name : "",
    path: typeof item?.path === "string" ? item.path : ""
  })).filter(item => item.name.length > 0 && item.path.length > 0);
}

function plainDate(value) {
  if (value == null) return null;
  if (typeof value.toISOString === "function") return value.toISOString();
  return typeof value === "string" || typeof value === "number" ? value : null;
}

function plainPostLink(value) {
  if (value == null) return null;
  return {
    title: typeof value.title === "string" ? value.title : "",
    path: typeof value.path === "string" ? value.path : "",
    date: plainDate(value.date)
  };
}

function pageModelInput(page, config) {
  return {
    _id: String(page._id || page.source || page.path || ""),
    source: typeof page.source === "string" ? page.source : "",
    path: typeof page.path === "string" ? page.path : "",
    permalink: typeof page.permalink === "string" ? page.permalink : "",
    link: typeof page.link === "string" ? page.link : typeof config.link === "string" ? config.link : "",
    title: typeof page.title === "string" ? page.title : String(config.title || ""),
    layout: typeof page.layout === "string" ? page.layout : String(config.layout || "page"),
    content: typeof page.content === "string" ? page.content : "",
    excerpt: typeof page.excerpt === "string" ? page.excerpt : "",
    date: plainDate(page.date ?? config.date),
    updated: plainDate(page.updated ?? config.updated ?? page.date ?? config.date),
    tags: plainTerms(config.tags),
    categories: plainTerms(config.categories),
    categoryLinks: plainTermLinks(page.categories),
    tagLinks: plainTermLinks(page.tags),
    previous: plainPostLink(page.prev),
    next: plainPostLink(page.next),
    lang: typeof page.lang === "string" ? page.lang : "",
    language: typeof page.language === "string" ? page.language : "",
    collection: config.collection == null ? null : {
      profile: config.collection.profile,
      id: config.collection.id
    }
  };
}

module.exports = ctx => {
  resetPageViewModels();
  const issues = [];
  const data = ctx.locals.get('data');
  const collectionConfigs = new Map();
  const pageConfigs = new Map();
  ctx.stellar ||= {};
  ctx.stellar.contentConfig = { collectionConfigs, pageConfigs };
  const themeConfig = ctx.config.theme_config ?? ctx.theme.config;
  const themeConfigSource = ctx.config.theme_config !== undefined
    ? '_config.stellar.yml'
    : 'themes/stellar/_config.yml';
  const runtimeData = ensureRuntimeData(ctx);

  try {
    validateThemeConfig(themeConfig, themeConfigSource);
  } catch (error) {
    if (!(error instanceof ContentConfigError)) throw error;
    issues.push(...error.issues);
  }

  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith('wiki/') && !key.startsWith('topic/') && !key.startsWith('notebooks/')) {
      continue;
    }
    try {
      collectionConfigs.set(key, parseCollectionConfig(value, sourcePathForData(key)));
    } catch (error) {
      if (!(error instanceof ContentConfigError)) throw error;
      issues.push(...error.issues);
    }
  }

  const configForPage = page => {
    if (!pageConfigs.has(page)) {
      const raw = readFrontMatter(ctx, page);
      if (raw == null) {
        pageConfigs.set(page, null);
      } else {
        try {
          const parsed = parsePageConfig(raw, sourcePathForPage(page));
          pageConfigs.set(page, parsed);
          setPageConfig(page, parsed);
          page.stellarConfig = parsed;
        } catch (error) {
          if (!(error instanceof ContentConfigError)) throw error;
          issues.push(...error.issues);
          pageConfigs.set(page, null);
        }
      }
    }
    return pageConfigs.get(page);
  };
  const posts = ctx.locals.get("posts");
  const topicMembers = [];
  posts.each(page => {
    const config = configForPage(page);
    if (config?.collection?.profile === "topic") {
      topicMembers.push(Object.freeze({
        source: sourcePathForPage(page),
        frontMatter: config,
        page: Object.freeze(pageModelInput(page, config))
      }));
    }
  });
  const frozenTopicMembers = Object.freeze(topicMembers.slice());

  const topicPublishList = Array.isArray(data.topic?.publish_list)
    ? data.topic.publish_list
    : null;
  const topicIndexItems = [];
  for (const [key, collectionConfig] of collectionConfigs) {
    if (!key.startsWith("topic/")) continue;
    const collectionId = key.slice("topic/".length);
    try {
      topicIndexItems.push(buildTopicIndexRender({
        source: sourcePathForData(key),
        themeSource: themeConfigSource,
        collectionSource: sourcePathForData(key),
        collectionId,
        collectionListed: topicPublishList == null || topicPublishList.includes(collectionId),
        siteConfig: ctx.config,
        runtimeData,
        stellarConfig: ctx.stellar?.config,
        collectionConfig,
        members: frozenTopicMembers
      }));
    } catch (error) {
      if (!(error instanceof ContentConfigError)) throw error;
      issues.push(...error.issues);
    }
  }
  runtimeData.topicIndex = Object.freeze({
    items: Object.freeze(topicIndexItems.slice())
  });

  const validatedSources = new Set();
  const pages = ctx.locals.get('pages');
  const notebookMemberInputs = [];
  pages.each(page => {
    const config = configForPage(page);
    if (config?.collection?.profile !== "notebook") return;
    notebookMemberInputs.push({
      collection: {
        profile: config.collection.profile,
        id: config.collection.id
      },
      tags: plainTerms(config.tags)
    });
  });
  const contentCollections = [
    { type: "posts", collection: ctx.locals.get('posts') },
    { type: "pages", collection: ctx.locals.get('pages') }
  ];
  for (const { type, collection } of contentCollections) {
    collection.each(page => {
      if (!page.source || validatedSources.has(page.source)) return;
      validatedSources.add(page.source);
      const config = configForPage(page);
      if (config == null) return;
      try {
        if (type === "posts" && config.collection == null) {
          const viewModelInput = Object.freeze({
            source: sourcePathForPage(page),
            themeSource: themeConfigSource,
            siteConfig: ctx.config,
            runtimeData,
            stellarConfig: ctx.stellar?.config,
            frontMatter: config,
            page: Object.freeze(pageModelInput(page, config)),
            isBackup: process.env.IS_BACKUP === "true"
          });
          setPostViewModelInput(page, viewModelInput);
        }
        if (type === "posts" && config.collection?.profile === "topic") {
          const collectionId = config.collection.id;
          const publishList = Array.isArray(data.topic?.publish_list)
            ? data.topic.publish_list
            : null;
          const viewModelInput = Object.freeze({
            source: sourcePathForPage(page),
            themeSource: themeConfigSource,
            collectionSource: sourcePathForData(`topic/${collectionId}`),
            collectionId,
            collectionListed: publishList == null || publishList.includes(collectionId),
            siteConfig: ctx.config,
            runtimeData,
            stellarConfig: ctx.stellar?.config,
            collectionConfig: collectionConfigs.get(`topic/${collectionId}`),
            members: frozenTopicMembers,
            frontMatter: config,
            page: Object.freeze(pageModelInput(page, config))
          });
          const base = buildTopicPageViewModelBase(viewModelInput);
          setTopicViewModelInput(page, viewModelInput);
          setTopicViewModelBase(page, base);
          page.viewModel = completeTopicPageViewModel(viewModelInput, base);
        }
        if (type === "pages" && config.collection?.profile === "notebook") {
          const collectionId = config.collection.id;
          page.viewModel = buildNotebookPageViewModel({
            source: sourcePathForPage(page),
            themeSource: themeConfigSource,
            collectionSource: sourcePathForData(`notebooks/${collectionId}`),
            collectionId,
            siteConfig: ctx.config,
            runtimeData,
            stellarConfig: ctx.stellar?.config,
            collectionConfig: collectionConfigs.get(`notebooks/${collectionId}`),
            collectionItems: notebookMemberInputs,
            frontMatter: config,
            page: pageModelInput(page, config)
          });
        }
      } catch (error) {
        if (!(error instanceof ContentConfigError)) throw error;
        issues.push(...error.issues);
      }
    });
  }

  if (issues.length > 0) {
    throw new ContentConfigError(issues);
  }
};
