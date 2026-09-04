/**
 * Notebook tree plus v2 two-stage render/listing projections.
 *
 * 笔记本系统构建入口：先完成运行时树，再投影冻结索引并完成详情模型。
 */

"use strict";

const { getNotebooksObject, groupPagesByNotebook } = require("../../lib/notebooks");
const { normalize_path: normalizePath } = require("../../lib/path_utils");
const { completeNotebookPageViewModel } = require("../../lib/models");
const {
  getNotebookViewModelBase,
  getNotebookViewModelInput,
  setPageViewModel,
  setProfileViewModelInput
} = require("../../lib/page-view-model-registry");
const { ensureRuntimeData } = require("../../lib/runtime-data");
const { ConfigSchemaError } = require("../../lib/config-schema");
const { deepFreeze } = require("../../schema/schema-utils");
const { runTwoStage, stableSort } = require("../../lib/collection-pipeline/shared");

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

function sortNoteItems(items, sort) {
  const field = sort?.field || "updated";
  const direction = sort?.direction === "asc" ? 1 : -1;
  return stableSort(items, (left, right) => (
    (right.priority - left.priority) ||
    (String(left[field] || "").localeCompare(String(right[field] || "")) * direction)
  ));
}

function validateTagIcons(notebooks, tagIcons) {
  const known = new Set();
  for (const notebook of Object.values(notebooks.tree)) {
    for (const tag of notebook.tagTree.values()) {
      for (const value of [tag.id, tag.name, tag.part, String(tag.part || "").toLowerCase()]) {
        if (value) known.add(value);
      }
    }
  }
  const issues = Object.keys(tagIcons || {}).filter(key => !known.has(key)).map(key => Object.freeze({
    code: "invalid_value",
    source: "_config.stellar.yml",
    path: `notebook.tag_icons.${key}`,
    actualType: "string",
    expected: "tag key present in a Notebook",
    migration: "configuration/content"
  }));
  if (issues.length > 0) throw new ConfigSchemaError(issues);
}

module.exports = (ctx, pipeline = null) => {
  const pages = pipeline == null
    ? ctx.locals.get("pages").data
    : pipeline.members("notebook").map(record => record.page);
  const pageConfigs = ctx.stellar?.contentConfig?.pageConfigs || new Map();
  const notebooks = getNotebooksObject(ctx, {
    pagesByNotebook: groupPagesByNotebook(pages, pageConfigs)
  });
  validateTagIcons(notebooks, ctx.stellar.config.notebook.tagIcons);
  const runtimeData = ensureRuntimeData(ctx);
  runtimeData.notebooks = notebooks;
  const entries = [];

  for (const page of pages) {
    const input = getNotebookViewModelInput(page);
    const base = getNotebookViewModelBase(page);
    if (!input || !base) continue;
    const notebook = notebooks.tree[base.collection.id];
    if (!notebook) continue;
    entries.push({ page, input, base, notebook });
  }

  const finalViewModels = runTwoStage(entries, {
    buildBase(entry) {
      return completeNotebookPageViewModel({
        ...entry.input,
        runtimeData,
        tagTree: plainTagTree(entry.notebook)
      }, entry.base);
    },
    aggregate(allEntries, viewModels) {
      const entriesByCollection = new Map();
      for (let index = 0; index < allEntries.length; index += 1) {
        const id = allEntries[index].base.collection.id;
        if (!entriesByCollection.has(id)) entriesByCollection.set(id, []);
        entriesByCollection.get(id).push(viewModels[index]);
      }
      const collections = [];
      const collectionMap = {};
      for (const notebook of Object.values(notebooks.tree)) {
        const collectionViewModels = entriesByCollection.get(notebook.id) || [];
        const collection = collectionViewModels[0]?.collection;
        const baseDir = collection?.route.baseDir || normalizePath(notebook.route.path).replace(/^\/+/, "");
        const tags = plainTagTree(notebook);
        const items = sortNoteItems(
          collectionViewModels.map(viewModel => viewModel.render.listing),
          collection?.listing.sort || notebook.listing.sort
        );
        const recentItems = stableSort(
          items.filter(item => item.listed !== false),
          (left, right) => String(right.updated || right.date || "").localeCompare(String(left.updated || left.date || ""))
        );
        const identity = collection?.identity || {
          name: String(notebook.name || ""),
          headline: String(notebook.headline ?? notebook.name ?? ""),
          description: String(notebook.description || ""),
          icon: String(notebook.icon || "")
        };
        const projection = {
          id: notebook.id,
          href: baseDir,
          name: identity.name,
          headline: identity.headline,
          description: identity.description,
          icon: identity.icon || "",
          order: collection?.listing.order ?? notebook.listing.order ?? 0,
          listed: collection?.visibility.listed !== false && notebook.visibility?.listed !== false,
          navigation: {
            menu: notebook.activeMenu ?? collection?.navigation.menu ?? null
          },
          layout: {
            topbar: structuredClone(notebook.topbar || {}),
            leftbar: structuredClone(notebook.leftbar || {}),
            rightbar: structuredClone(notebook.rightbar || {}),
            algoliaFilterPath: baseDir
          },
          tags,
          items,
          recentItems,
          perPage: collection?.listing.perPage ?? notebook.listing.per_page
        };
        collections.push(projection);
        collectionMap[notebook.id] = projection;
      }
      const orderedCollections = stableSort(collections, (left, right) => left.order - right.order);
      const recentItems = stableSort(
        orderedCollections
          .filter(collection => collection.listed !== false)
          .flatMap(collection => collection.recentItems),
        (left, right) => String(right.updated || right.date || "").localeCompare(String(left.updated || left.date || ""))
      );
      runtimeData.notebookIndex = deepFreeze({
        items: orderedCollections,
        collections: collectionMap,
        recentItems
      });
      return runtimeData.notebookIndex;
    },
    complete(entry, viewModel, notebookIndex) {
      const collection = notebookIndex.collections[entry.base.collection.id];
      entry.completeInput = Object.freeze({
        ...entry.input,
        runtimeData,
        tagTree: collection.tags,
        recentItems: collection.recentItems
      });
      return completeNotebookPageViewModel(entry.completeInput, entry.base);
    }
  });

  for (let index = 0; index < entries.length; index += 1) {
    entries[index].page.viewModel = finalViewModels[index];
    setProfileViewModelInput("notebook", entries[index].page, entries[index].completeInput);
    setPageViewModel(entries[index].page, finalViewModels[index]);
  }
};
