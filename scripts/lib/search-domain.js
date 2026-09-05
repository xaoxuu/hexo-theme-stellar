"use strict";

const COLLECTION_PROFILES = new Set(["wiki", "notebook", "topic"]);

function collectionDomain(profile, id) {
  if (typeof profile !== "string" || profile.length === 0) return null;
  if (typeof id !== "string" || id.length === 0) return null;
  return `${profile}:${id}`;
}

function indexDomains(page, config) {
  const domains = [];
  if (page?.layout === "post") domains.push("blog");
  const collection = config?.collection;
  const domain = COLLECTION_PROFILES.has(collection?.profile)
    ? collectionDomain(collection.profile, collection.id)
    : null;
  if (domain && !domains.includes(domain)) domains.push(domain);
  return domains;
}

function scopeAllows(indexScope, contentType) {
  return indexScope === "all" || indexScope === contentType;
}

function collectionScope(collection, indexScope) {
  const profile = collection?.profile;
  if (!COLLECTION_PROFILES.has(profile)) return null;
  const domain = collectionDomain(profile, collection?.id);
  if (!domain) return null;
  const contentType = profile === "topic" ? "post" : "page";
  if (!scopeAllows(indexScope, contentType)) return null;
  const label = collection?.identity?.name || collection?.name || collection.id;
  const options = profile === "topic" && scopeAllows(indexScope, "post")
    ? ["blog", domain]
    : [domain];
  return { current: domain, label, options };
}

function resolveSearchScope(input = {}) {
  const indexScope = ["all", "post", "page"].includes(input.indexScope)
    ? input.indexScope
    : "all";
  const collection = input.viewModel?.collection || input.collection || null;
  const scoped = collectionScope(collection, indexScope);
  if (scoped) return scoped;
  if (collection?.profile === "post" || input.blogAggregate === true) {
    if (!scopeAllows(indexScope, "post")) return null;
    return { current: "blog", label: null, options: ["blog"] };
  }
  return null;
}

module.exports = {
  collectionDomain,
  indexDomains,
  resolveSearchScope,
  scopeAllows
};
