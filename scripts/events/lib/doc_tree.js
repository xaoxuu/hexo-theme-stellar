/**
 * doc_tree.js v2 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * Wiki 文档树构建入口：委托 scripts/lib/doc_tree.js 的纯函数，
 * 保持 ctx.theme.config.wiki 输出结构与旧实现一致。
 */

"use strict";

const { getCollectionId } = require("../../lib/content-config");
const { buildWikiTree } = require("../../lib/doc_tree");
const { requireLayoutProfiles } = require("../../lib/layout-config");
const { buildWikiPageViewModel } = require("../../lib/models");
const {
  readFrontMatter,
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
  const collectionConfigs = new Map();
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("wiki/") && key.length > 5) {
      collectionConfigs.set(key.slice(5), cloneConfig(value));
    }
  }

  const wiki = buildWikiTree({
    data,
    pages,
    shelf: data.wiki || [],
    wikiIndexPath: requireLayoutProfiles(ctx.stellar?.config).wikiIndex.path
  });
  ctx.theme.config.wiki = wiki;

  const themeConfig = ctx.theme.config;
  const themeSource = ctx.config.theme_config
    ? "_config.stellar.yml"
    : "themes/stellar/_config.yml";
  eachPage(pages, page => {
    const collectionId = getCollectionId(page, "wiki");
    if (collectionId == null) return;
    const config = readFrontMatter(ctx, page);
    if (config == null) return;
    page.viewModel = buildWikiPageViewModel({
      source: sourcePathForPage(page),
      themeSource,
      collectionSource: sourcePathForData(`wiki/${collectionId}`),
      siteConfig: ctx.config,
      themeConfig,
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
