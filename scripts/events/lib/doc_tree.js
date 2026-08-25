/**
 * doc_tree.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * Wiki 文档树构建入口：委托 scripts/lib/doc_tree.js 的纯函数，
 * 将 Wiki 运行时树写入 ctx.stellar.data.wiki。
 */

"use strict";

const { getCollectionId } = require("../../lib/content-config");
const { buildWikiTree } = require("../../lib/doc_tree");
const { requireLayoutProfiles } = require("../../lib/layout-config");
const {
  buildWikiListingRender,
  buildWikiPageViewModelBase,
  buildWikiRelated,
  completeWikiPageViewModel
} = require("../../lib/models");
const { ensureRuntimeData } = require("../../lib/runtime-data");
const { setPageViewModel } = require("../../lib/page-view-model-registry");
const {
  sourcePathForData,
  sourcePathForPage
} = require("../../lib/source-config");

function cloneConfig(value) {
  return value == null ? value : structuredClone(value);
}

module.exports = (ctx, pipeline = null) => {
  const data = ctx.locals.get("data");
  const pages = pipeline == null
    ? ctx.locals.get("pages")
    : pipeline.members("wiki").map(record => record.page);
  const parsedCollections = ctx.stellar?.contentConfig?.collectionConfigs || new Map();
  const parsedPages = ctx.stellar?.contentConfig?.pageConfigs || new Map();
  const collectionConfigs = new Map();
  const normalizedData = { ...data };
  for (const [key, value] of parsedCollections) {
    normalizedData[key] = cloneConfig(value);
  }
  for (const [key, value] of Object.entries(normalizedData)) {
    if (key.startsWith("wiki/") && key.length > 5) {
      collectionConfigs.set(key.slice(5), cloneConfig(value));
    }
  }

  const wiki = buildWikiTree({
    data: normalizedData,
    pages,
    pageConfigs: parsedPages,
    shelf: data.wiki || [],
    wikiIndexPath: requireLayoutProfiles(ctx.stellar?.config).wikiIndex.path
  });
  const runtimeData = ensureRuntimeData(ctx);
  runtimeData.wiki = wiki;

  const themeSource = ctx.config.theme_config
    ? "_config.stellar.yml"
    : "themes/stellar/_config.yml";
  const entries = [];
  const homepageEntries = new Map();
  for (const page of pages) {
    const config = parsedPages.get(page);
    if (config == null) continue;
    const collectionId = getCollectionId(config, "wiki");
    if (collectionId == null) continue;
    const input = {
      source: sourcePathForPage(page),
      themeSource,
      collectionSource: sourcePathForData(`wiki/${collectionId}`),
      siteConfig: ctx.config,
      runtimeData,
      stellarConfig: ctx.stellar?.config,
      collectionId,
      collectionConfig: collectionConfigs.get(collectionId),
      collectionState: wiki.tree[collectionId],
      collectionListed: wiki.shelf.includes(collectionId),
      isBackup: process.env.IS_BACKUP === "true",
      frontMatter: config,
      page
    };
    const base = buildWikiPageViewModelBase(input);
    const entry = { page, collectionId, input, base };
    entries.push(entry);
    if (!homepageEntries.has(collectionId) || base.item.route.path === base.collection.route.homepage) {
      homepageEntries.set(collectionId, entry);
    }
  }

  const listings = new Map();
  for (const [collectionId, entry] of homepageEntries) {
    listings.set(collectionId, buildWikiListingRender(entry.input, entry.base.collection));
  }

  for (const entry of entries) {
    const relatedCollections = (wiki.tree[entry.collectionId]?.relatedItems || []).map(group => ({
      name: group.name,
      items: (group.items || [])
        .map(id => homepageEntries.get(id)?.base.collection)
        .filter(Boolean)
    }));
    const related = buildWikiRelated({ relatedCollections });
    entry.page.viewModel = completeWikiPageViewModel({
      ...entry.input,
      related,
      listing: listings.get(entry.collectionId)
    }, entry.base);
    setPageViewModel(entry.page, entry.page.viewModel);
  }

  wiki.index = {
    items: wiki.shelf
      .map(id => listings.get(id))
      .filter(item => item?.listed === true),
    tags: Object.values(wiki.all_tags || {}).map(tag => ({
      name: String(tag.name || ""),
      path: String(tag.path || ""),
      itemIds: Array.isArray(tag.items) ? tag.items.slice() : []
    }))
  };
};
