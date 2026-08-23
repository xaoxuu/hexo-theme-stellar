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
const { buildWikiPageViewModel } = require("../../lib/models");
const { ensureRuntimeData } = require("../../lib/runtime-data");
const {
  sourcePathForData,
  sourcePathForPage
} = require("../../lib/source-config");

function cloneConfig(value) {
  return value == null ? value : structuredClone(value);
}

function eachPage(pages, callback) {
  if (typeof pages.each === "function") {
    pages.each(callback);
    return;
  }
  pages.forEach(callback);
}

module.exports = ctx => {
  const data = ctx.locals.get("data");
  const pages = ctx.locals.get("pages");
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
  eachPage(pages, page => {
    const config = parsedPages.get(page);
    if (config == null) return;
    const collectionId = getCollectionId(config, "wiki");
    if (collectionId == null) return;
    page.viewModel = buildWikiPageViewModel({
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
      frontMatter: config,
      page
    });
  });
};
