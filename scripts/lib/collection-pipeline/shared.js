"use strict";

const { deepFreeze } = require("../../schema/schema-utils");

function collectionItems(collection) {
  if (Array.isArray(collection)) return collection;
  if (Array.isArray(collection?.data)) return collection.data;
  const items = [];
  if (typeof collection?.each === "function") collection.each(item => items.push(item));
  return items;
}

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
  return deepFreeze({
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
  });
}

function memberKey(profile, id) {
  return `${profile}:${id || ""}`;
}

function discoverContent({ posts, pages, configForPage }) {
  const records = [];
  const byProfile = new Map();
  const byCollection = new Map();
  let visits = 0;

  const visit = (kind, page) => {
    visits += 1;
    const config = configForPage(page, kind);
    if (config == null) return;
    let profile = config.collection?.profile || null;
    if (kind === "posts" && profile == null) profile = "post";
    if (kind === "posts" && profile !== "post" && profile !== "topic") return;
    if (kind === "pages" && profile !== "wiki" && profile !== "notebook") return;
    const collectionId = profile === "post" ? "post" : config.collection.id;
    const record = Object.freeze({
      index: records.length,
      kind,
      profile,
      collectionId,
      config,
      page,
      snapshot: pageModelInput(page, config)
    });
    records.push(record);
    if (!byProfile.has(profile)) byProfile.set(profile, []);
    byProfile.get(profile).push(record);
    const key = memberKey(profile, collectionId);
    if (!byCollection.has(key)) byCollection.set(key, []);
    byCollection.get(key).push(record);
  };

  for (const page of collectionItems(posts)) visit("posts", page);
  for (const page of collectionItems(pages)) visit("pages", page);
  for (const [profile, items] of byProfile) byProfile.set(profile, Object.freeze(items.slice()));
  for (const [key, items] of byCollection) byCollection.set(key, Object.freeze(items.slice()));
  return Object.freeze({ records: Object.freeze(records), byProfile, byCollection, visits });
}

function stableSort(items, compare) {
  return items.map((item, index) => ({ item, index }))
    .sort((left, right) => compare(left.item, right.item) || left.index - right.index)
    .map(entry => entry.item);
}

function selectListingItems(items, options = {}) {
  const tagId = options.tagId;
  const itemIds = tagId == null
    ? null
    : new Set((options.tags || []).find(tag => (tag.id ?? tag.name) === tagId)?.itemIds || []);
  const selected = (Array.isArray(items) ? items : []).filter(item => (
    item?.listed !== false && (itemIds == null || itemIds.has(item.id))
  ));
  return options.compare ? stableSort(selected, options.compare) : selected;
}

function paginateItems(items, perPage) {
  const size = Number.isInteger(perPage) && perPage > 0 ? perPage : Math.max(items.length, 1);
  const pages = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(Object.freeze(items.slice(index, index + size)));
  }
  if (pages.length === 0) pages.push(Object.freeze([]));
  return Object.freeze(pages);
}

function runTwoStage(entries, lifecycle) {
  const bases = entries.map(entry => lifecycle.buildBase(entry));
  const aggregate = lifecycle.aggregate(entries, bases);
  return Object.freeze(entries.map((entry, index) => lifecycle.complete(entry, bases[index], aggregate)));
}

module.exports = {
  collectionItems,
  discoverContent,
  memberKey,
  pageModelInput,
  paginateItems,
  plainTerms,
  runTwoStage,
  selectListingItems,
  stableSort
};
