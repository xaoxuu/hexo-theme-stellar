/**
 * Notebook tree plus v2 two-stage render/listing projections.
 *
 * 笔记本系统构建入口：先完成运行时树，再投影冻结索引并完成详情模型。
 */

"use strict";

const { getNotebooksObject } = require("../../lib/notebooks");
const { resolveBrand } = require("../../lib/brand");
const { normalize_path: normalizePath } = require("../../lib/path_utils");
const { completeNotebookPageViewModel } = require("../../lib/models");
const {
  getNotebookViewModelBase,
  getNotebookViewModelInput,
  setPageViewModel
} = require("../../lib/page-view-model-registry");
const { ensureRuntimeData } = require("../../lib/runtime-data");
const { deepFreeze } = require("../../schema/schema-utils");

function eachPage(pages, callback) {
  if (typeof pages.each === "function") {
    pages.each(callback);
    return;
  }
  pages.forEach(callback);
}

function plainTagTree(notebook) {
  return Array.from(notebook.tagTree.values()).map(tag => ({
    id: String(tag.id || ""),
    name: String(tag.name || ""),
    label: String(tag.part || ""),
    path: normalizePath(tag.path).replace(/^\/+/, ""),
    parentId: typeof tag.parent === "string" && tag.parent.length > 0 ? tag.parent : null,
    children: Array.isArray(tag.children) ? tag.children.slice() : [],
    itemIds: Array.from(tag.noteSet || []).map(String)
  }));
}

function sortNoteItems(items, orderBy) {
  const ordered = items.slice();
  const rule = String(orderBy || "-updated");
  const field = rule.replace(/^-/, "");
  const direction = rule.startsWith("-") ? -1 : 1;
  ordered.sort((left, right) => {
    const compared = String(left[field] || "").localeCompare(String(right[field] || "")) * direction;
    return compared;
  });
  ordered.sort((left, right) => right.priority - left.priority);
  return ordered;
}

module.exports = ctx => {
  const notebooks = getNotebooksObject(ctx);
  const runtimeData = ensureRuntimeData(ctx);
  runtimeData.notebooks = notebooks;
  const pages = ctx.locals.get("pages");
  const entries = [];
  const entriesByCollection = new Map();

  eachPage(pages, page => {
    const input = getNotebookViewModelInput(page);
    const base = getNotebookViewModelBase(page);
    if (!input || !base) return;
    const notebook = notebooks.tree[base.collection.id];
    if (!notebook) return;
    const tags = plainTagTree(notebook);
    const viewModel = completeNotebookPageViewModel({
      ...input,
      runtimeData,
      tagTree: tags
    }, base);
    if (!entriesByCollection.has(base.collection.id)) entriesByCollection.set(base.collection.id, []);
    entriesByCollection.get(base.collection.id).push(viewModel);
    entries.push({ page, input, base });
  });

  const collections = [];
  const collectionMap = {};
  for (const notebook of Object.values(notebooks.tree)) {
    const viewModels = entriesByCollection.get(notebook.id) || [];
    const collection = viewModels[0]?.collection;
    const baseDir = collection?.route.baseDir || normalizePath(notebook.route.path).replace(/^\/+/, "");
    const tags = plainTagTree(notebook);
    const items = sortNoteItems(
      viewModels.map(viewModel => viewModel.render.listing),
      collection?.listing.orderBy || notebook.listing.order_by
    );
    const recentItems = items.filter(item => item.listed !== false).sort((left, right) => (
      String(right.updated || right.date || "").localeCompare(String(left.updated || left.date || ""))
    ));
    const identity = collection?.identity || {
      name: String(notebook.name || ""),
      headline: String(notebook.headline ?? notebook.name ?? ""),
      description: String(notebook.description || ""),
      icon: String(notebook.identity?.icon || "")
    };
    const brand = resolveBrand({
      siteBrand: ctx.stellar.config.site.brand,
      collection: notebook,
      collectionType: "notebook",
      defaultIcon: ctx.stellar.config.resources.fallbacks.projectIcon
    });
    const projection = {
      id: notebook.id,
      href: baseDir,
      name: identity.name,
      headline: identity.headline,
      description: identity.description,
      icon: identity.icon || ctx.stellar.config.resources.fallbacks.projectIcon || "",
      sort: collection?.listing.sort ?? notebook.listing.sort ?? 0,
      listed: collection?.visibility.listed !== false && notebook.visibility?.listed !== false,
      navigation: {
        menu: notebook.navigation.menu ?? collection?.navigation.menu ?? null
      },
      layout: {
        brand,
        sidebar: structuredClone(notebook.sidebar || {}),
        searchFilter: baseDir
      },
      tags,
      items,
      recentItems,
      perPage: collection?.listing.perPage ?? notebook.listing.per_page
    };
    collections.push(projection);
    collectionMap[notebook.id] = projection;
  }
  collections.sort((left, right) => left.sort - right.sort);
  const recentItems = collections
    .filter(collection => collection.listed !== false)
    .flatMap(collection => collection.recentItems)
    .sort((left, right) => String(right.updated || right.date || "").localeCompare(String(left.updated || left.date || "")));
  runtimeData.notebookIndex = deepFreeze({
    items: collections,
    collections: collectionMap,
    recentItems
  });

  for (const entry of entries) {
    const collection = runtimeData.notebookIndex.collections[entry.base.collection.id];
    entry.page.viewModel = completeNotebookPageViewModel({
      ...entry.input,
      runtimeData,
      tagTree: collection.tags,
      recentItems: collection.recentItems
    }, entry.base);
    setPageViewModel(entry.page, entry.page.viewModel);
  }
};
