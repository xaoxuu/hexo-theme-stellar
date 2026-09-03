"use strict";

const {
  ContentConfigError,
  parseCollectionConfig,
  parsePageConfig,
  validateThemeConfig
} = require("../../lib/content-config");
const { formatConfigWarnings } = require("../../lib/config-schema");
const { resetPageViewModels, setPageConfig } = require("../page-view-model-registry");
const { ensureRuntimeData } = require("../runtime-data");
const { readFrontMatter, sourcePathForData, sourcePathForPage } = require("../source-config");
const {
  createCollectionRegistry,
  resolveContentMembership
} = require("../content-membership");
const { discoverContent, memberKey } = require("./shared");
const { profileAdapters } = require("./registry");

function prepareCollectionPipeline(ctx) {
  resetPageViewModels();
  const issues = [];
  const configWarnings = [];
  const data = ctx.locals.get("data") || {};
  const collectionConfigs = new Map();
  const pageConfigs = new Map();
  ctx.stellar ||= {};
  ctx.stellar.contentConfig = { collectionConfigs, pageConfigs };
  const themeConfig = ctx.config.theme_config ?? ctx.theme.config;
  const themeSource = ctx.config.theme_config !== undefined
    ? "_config.stellar.yml"
    : "themes/stellar/_config.yml";
  const runtimeData = ensureRuntimeData(ctx);

  const capture = operation => {
    try {
      return operation();
    } catch (error) {
      if (!(error instanceof ContentConfigError)) throw error;
      issues.push(...error.issues);
      return null;
    }
  };

  capture(() => validateThemeConfig(themeConfig, themeSource));
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith("wiki/") && !key.startsWith("topic/") && !key.startsWith("notebooks/")) continue;
    capture(() => collectionConfigs.set(key, parseCollectionConfig(value, sourcePathForData(key), {
      mode: "recover",
      onIssues: current => configWarnings.push(...current)
    })));
  }
  const membershipRegistry = createCollectionRegistry(collectionConfigs);

  const configForPage = (page, kind) => {
    if (pageConfigs.has(page)) return pageConfigs.get(page);
    const raw = readFrontMatter(ctx, page);
    if (raw == null) {
      pageConfigs.set(page, null);
      return null;
    }
    let parsed = capture(() => parsePageConfig(raw, sourcePathForPage(page), {
      mode: "recover",
      onIssues: current => configWarnings.push(...current)
    }));
    if (parsed != null) {
      const resolved = resolveContentMembership({
        kind,
        source: sourcePathForPage(page),
        pagePath: page.path,
        config: parsed,
        registry: membershipRegistry
      });
      if (resolved.issues.length > 0) {
        issues.push(...resolved.issues);
        parsed = null;
      } else {
        parsed = resolved.config;
      }
    }
    pageConfigs.set(page, parsed);
    if (parsed != null) {
      setPageConfig(page, parsed);
      page.stellarConfig = parsed;
    }
    return parsed;
  };

  const discovery = discoverContent({
    posts: ctx.locals.get("posts"),
    pages: ctx.locals.get("pages"),
    configForPage
  });
  const collectionMap = new Map();
  for (const [key, config] of collectionConfigs) {
    const matched = key.match(/^(wiki|topic|notebooks)\/(.+)$/);
    if (!matched) continue;
    const profile = matched[1] === "notebooks" ? "notebook" : matched[1];
    collectionMap.set(memberKey(profile, matched[2]), config);
  }

  const pipeline = {
    ctx,
    data,
    runtimeData,
    themeSource,
    discovery,
    capture,
    sourceForPage: sourcePathForPage,
    members(profile, collectionId) {
      return collectionId == null
        ? discovery.byProfile.get(profile) || Object.freeze([])
        : discovery.byCollection.get(memberKey(profile, collectionId)) || Object.freeze([]);
    },
    collection(profile, id) {
      return collectionMap.get(memberKey(profile, id));
    },
    collections(profile) {
      const result = [];
      for (const [key, value] of collectionMap) {
        if (key.startsWith(`${profile}:`)) result.push([key.slice(profile.length + 1), value]);
      }
      return result;
    },
    modelInput(record, extra = {}) {
      return Object.freeze({
        source: sourcePathForPage(record.page),
        themeSource,
        siteConfig: ctx.config,
        runtimeData,
        stellarConfig: ctx.stellar?.config,
        frontMatter: record.config,
        page: record.snapshot,
        ...extra
      });
    }
  };

  const adapters = profileAdapters();
  for (const adapter of adapters) adapter.prepare?.(pipeline);

  const warning = formatConfigWarnings(configWarnings);
  if (warning) ctx.log.warn(warning);
  if (issues.length > 0) throw new ContentConfigError(issues);
  pipeline.summary = Object.freeze({
    profiles: Object.freeze(adapters.map(adapter => adapter.id)),
    contentVisits: discovery.visits,
    members: discovery.records.length
  });
  return pipeline;
}

function runCollectionPipeline(ctx) {
  const pipeline = prepareCollectionPipeline(ctx);
  for (const adapter of profileAdapters()) adapter.build?.(pipeline);
  pipeline.runtimeData.collectionPipeline = pipeline.summary;
  return pipeline;
}

module.exports = { prepareCollectionPipeline, runCollectionPipeline };
