/**
 * Notebook v2 two-stage render/listing projections.
 *
 * 笔记本系统构建入口：从唯一 CollectionModel 聚合标签、索引与详情模型。
 */

"use strict";

const {
  buildNotebookCollectionModel,
  completeNotebookPageViewModel
} = require("../../lib/models");
const { pageViewModelsFor } = require("../../lib/page-view-model-registry");
const { ensureRuntimeData } = require("../../lib/runtime-data");
const { sourcePathForData } = require("../../lib/source-config");
const { deepFreeze } = require("../../schema/schema-utils");
const {
  plainTerms,
  runTwoStage,
  stableSort
} = require("../../lib/collection-pipeline/shared");

function recordId(record) {
  return String(record.page?._id || record.page?.source || record.page?.path || "");
}

function buildTagTree(collection, records) {
  const tags = new Map();
  tags.set("", {
    id: "",
    name: "",
    label: "",
    path: collection.route.baseDir,
    parentId: null,
    children: new Set(),
    itemIds: new Set()
  });
  for (const tag of collection.navigation.tags) {
    tags.set(tag.id, {
      ...tag,
      children: new Set(),
      itemIds: new Set()
    });
  }
  for (const tag of tags.values()) {
    if (tag.id.length === 0) continue;
    tags.get(tag.parentId || "")?.children.add(tag.id);
  }
  for (const record of records) {
    const itemId = recordId(record);
    tags.get("").itemIds.add(itemId);
    for (const hierarchy of plainTerms(record.config.tags)) {
      const parts = hierarchy.split("/").filter(Boolean);
      for (let index = 0; index < parts.length; index += 1) {
        tags.get(parts.slice(0, index + 1).join("/").toLowerCase())?.itemIds.add(itemId);
      }
    }
  }
  return Array.from(tags.values()).map(tag => ({
    ...tag,
    children: Array.from(tag.children).sort(),
    itemIds: Array.from(tag.itemIds)
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

module.exports = (ctx, pipeline) => {
  if (!pipeline) throw new TypeError("Stellar v2: Notebook 构建必须由 Collection Pipeline 驱动");
  const records = pipeline.members("notebook");
  const collectionConfigs = new Map(pipeline.collections("notebook"));
  const collectionItems = records.map(record => ({
    collection: { profile: "notebook", id: record.collectionId },
    tags: plainTerms(record.config.tags)
  }));
  const recordsByCollection = new Map();
  for (const record of records) {
    if (!recordsByCollection.has(record.collectionId)) recordsByCollection.set(record.collectionId, []);
    recordsByCollection.get(record.collectionId).push(record);
  }
  const runtimeData = ensureRuntimeData(ctx);
  const entries = [];
  const collections = new Map(pipeline.notebookCollections);

  for (const record of records) {
    const page = record.page;
    const input = pageViewModelsFor(ctx).getNotebookViewModelInput(page);
    const base = pageViewModelsFor(ctx).getNotebookViewModelBase(page);
    if (!input || !base) continue;
    collections.set(base.collection.id, base.collection);
    entries.push({ page, input, base });
  }
  const tagTrees = new Map(Array.from(collections, ([collectionId, collection]) => [
    collectionId,
    buildTagTree(collection, recordsByCollection.get(collectionId) || [])
  ]));

  const finalViewModels = runTwoStage(entries, {
    buildBase(entry) {
      return completeNotebookPageViewModel({
        ...entry.input,
        runtimeData,
        tagTree: tagTrees.get(entry.base.collection.id)
      }, entry.base);
    },
    aggregate(allEntries, viewModels) {
      const entriesByCollection = new Map();
      for (let index = 0; index < allEntries.length; index += 1) {
        const id = allEntries[index].base.collection.id;
        if (!entriesByCollection.has(id)) entriesByCollection.set(id, []);
        entriesByCollection.get(id).push(viewModels[index]);
      }
      const projections = [];
      const collectionMap = {};
      for (const [collectionId, collection] of collections) {
        const collectionConfig = collectionConfigs.get(collectionId) || {};
        const collectionViewModels = entriesByCollection.get(collectionId) || [];
        const baseDir = collection.route.baseDir;
        const tags = tagTrees.get(collectionId);
        const items = sortNoteItems(
          collectionViewModels.map(viewModel => viewModel.render.listing),
          collection.listing.sort
        );
        const recentItems = stableSort(
          items.filter(item => item.listed !== false),
          (left, right) => String(right.updated || right.date || "").localeCompare(String(left.updated || left.date || ""))
        );
        const identity = collection.identity;
        const projection = {
          id: collectionId,
          href: baseDir,
          name: identity.name,
          headline: identity.headline,
          description: identity.description,
          icon: identity.icon || "",
          order: collection.listing.order,
          listed: collection.visibility.listed !== false,
          navigation: {
            menu: collectionConfig.activeMenu ?? null
          },
          layout: {
            topbar: structuredClone(collectionConfig.topbar || {}),
            leftbar: structuredClone(collectionConfig.leftbar || {}),
            rightbar: structuredClone(collectionConfig.rightbar || {}),
            algoliaFilterPath: baseDir
          },
          tags,
          items,
          recentItems,
          perPage: collection.listing.perPage
        };
        projections.push(projection);
        collectionMap[collectionId] = projection;
      }
      const orderedCollections = stableSort(projections, (left, right) => left.order - right.order);
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
    pageViewModelsFor(ctx).setPageViewModel(entries[index].page, finalViewModels[index]);
    pageViewModelsFor(ctx).setProfileViewModelInput("notebook", entries[index].page, entries[index].completeInput);
  }
};
