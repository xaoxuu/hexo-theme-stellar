'use strict';

const {
  ContentConfigError,
  validateCollectionConfig,
  validatePageConfig,
  validateThemeConfig
} = require('../../lib/content-config');
const {
  readFrontMatter,
  sourcePathForData,
  sourcePathForPage
} = require("../../lib/source-config");
const {
  buildNotebookPageViewModel,
  buildTopicPageViewModel
} = require("../../lib/models");
const {
  resetPageViewModels,
  setPostViewModelInput
} = require("../../lib/page-view-model-registry");

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
      type: config.collection.type,
      id: config.collection.id
    }
  };
}

module.exports = ctx => {
  resetPageViewModels();
  const issues = [];
  const data = ctx.locals.get('data');
  const themeConfig = ctx.config.theme_config || ctx.theme.config;
  const themeConfigSource = ctx.config.theme_config
    ? '_config.stellar.yml'
    : 'themes/stellar/_config.yml';

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
      validateCollectionConfig(value, sourcePathForData(key));
    } catch (error) {
      if (!(error instanceof ContentConfigError)) throw error;
      issues.push(...error.issues);
    }
  }

  const pageConfigs = new Map();
  const configForPage = page => {
    if (!pageConfigs.has(page)) pageConfigs.set(page, readFrontMatter(ctx, page));
    return pageConfigs.get(page);
  };
  const posts = ctx.locals.get("posts");
  const topicMembers = [];
  posts.each(page => {
    const config = configForPage(page);
    if (config?.collection?.type === "topic") {
      topicMembers.push({
        source: sourcePathForPage(page),
        frontMatter: config,
        page: pageModelInput(page, config)
      });
    }
  });

  const validatedSources = new Set();
  const pages = ctx.locals.get('pages');
  const notebookMemberInputs = [];
  pages.each(page => {
    const config = readFrontMatter(ctx, page);
    if (config?.collection?.type !== 'notebook') return;
    notebookMemberInputs.push({
      collection: {
        type: config.collection.type,
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
        validatePageConfig(config, sourcePathForPage(page));
        if (type === "posts" && config.collection == null) {
          const viewModelInput = {
            source: sourcePathForPage(page),
            themeSource: themeConfigSource,
            siteConfig: ctx.config,
            themeConfig: ctx.theme.config,
            stellarConfig: ctx.stellar?.config,
            frontMatter: config,
            page: pageModelInput(page, config),
            isBackup: process.env.IS_BACKUP === "true"
          };
          setPostViewModelInput(page, viewModelInput);
        }
        if (type === "posts" && config.collection?.type === "topic") {
          const collectionId = config.collection.id;
          const publishList = Array.isArray(data.topic?.publish_list)
            ? data.topic.publish_list
            : null;
          page.viewModel = buildTopicPageViewModel({
            source: sourcePathForPage(page),
            themeSource: themeConfigSource,
            collectionSource: sourcePathForData(`topic/${collectionId}`),
            collectionId,
            collectionListed: publishList == null || publishList.includes(collectionId),
            siteConfig: ctx.config,
            themeConfig: ctx.theme.config,
            collectionConfig: data[`topic/${collectionId}`],
            members: topicMembers,
            frontMatter: config,
            page: pageModelInput(page, config)
          });
        }
        if (type === "pages" && config.collection?.type === "notebook") {
          const collectionId = config.collection.id;
          page.viewModel = buildNotebookPageViewModel({
            source: sourcePathForPage(page),
            themeSource: themeConfigSource,
            collectionSource: sourcePathForData(`notebooks/${collectionId}`),
            collectionId,
            siteConfig: ctx.config,
            themeConfig: ctx.theme.config,
            collectionConfig: data[`notebooks/${collectionId}`],
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
