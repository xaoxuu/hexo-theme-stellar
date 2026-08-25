"use strict";

const { deepFreeze } = require("../schema/schema-utils");
const { normalize_path: normalizePathKey } = require("./path_utils");

const PROFILE_DIRECTORY = Object.freeze({
  wiki: "wiki",
  topic: "topic",
  notebook: "notebooks"
});

function normalizePath(value) {
  if (typeof value !== "string") return "";
  let result = value.replace(/\\/g, "/").replace(/^source\//, "").replace(/^\/+/, "");
  result = result.replace(/\.md$/i, "");
  result = normalizePathKey(result).replace(/^\/+|\/+$/g, "");
  return result;
}

function sourcePagePath(source) {
  const normalized = normalizePath(source);
  return normalizePath(normalized.replace(/^_posts\//, ""));
}

function flattenTree(tree) {
  if (Array.isArray(tree)) return tree.filter(item => typeof item === "string");
  if (tree == null || typeof tree !== "object") return [];
  return Object.values(tree).flatMap(items => (
    Array.isArray(items) ? items.filter(item => typeof item === "string") : []
  ));
}

function addIndex(index, signal, key) {
  const normalized = normalizePath(signal);
  if (!normalized) return;
  if (!index.has(normalized)) index.set(normalized, new Set());
  index.get(normalized).add(key);
}

function parseCollectionKey(key) {
  const matched = String(key).match(/^(wiki|topic|notebooks)\/(.+)$/);
  if (!matched) return null;
  return {
    profile: matched[1] === "notebooks" ? "notebook" : matched[1],
    id: matched[2]
  };
}

function createCollectionRegistry(collectionConfigs) {
  const records = [];
  const byKey = new Map();
  const wikiMembers = new Map();
  const topicStarts = new Map();
  for (const [sourceKey, config] of collectionConfigs || []) {
    const identity = parseCollectionKey(sourceKey);
    if (!identity) continue;
    const key = `${identity.profile}:${identity.id}`;
    const record = deepFreeze({ ...identity, key, sourceKey, config });
    records.push(record);
    byKey.set(key, record);
    if (identity.profile === "wiki") {
      const base = normalizePath(config.route?.path || `wiki/${identity.id}`);
      for (const member of flattenTree(config.navigation?.tree)) {
        addIndex(wikiMembers, `${base}/${member}`, key);
      }
    } else if (identity.profile === "topic" && typeof config.route?.start === "string") {
      addIndex(topicStarts, config.route.start, key);
    }
  }
  return {
    records: Object.freeze(records),
    byKey,
    wikiMembers,
    topicStarts
  };
}

function namespaceFor(kind, source) {
  const normalized = normalizePath(source);
  if (kind === "pages") {
    const wiki = normalized.match(/^wiki\/([^/]+)(?:\/|$)/);
    if (wiki) return { profile: "wiki", id: wiki[1], key: `wiki:${wiki[1]}` };
    const notebook = normalized.match(/^notebooks\/([^/]+)(?:\/|$)/);
    if (notebook) return { profile: "notebook", id: notebook[1], key: `notebook:${notebook[1]}` };
  }
  if (kind === "posts") {
    const topic = normalized.match(/^_posts\/topics?\/([^/]+)(?:\/|$)/);
    if (topic) return { profile: "topic", id: topic[1], key: `topic:${topic[1]}` };
  }
  return null;
}

function pageSignals(source, pagePath, config) {
  const normalizedSource = normalizePath(source);
  const withoutPosts = normalizedSource.replace(/^_posts\//, "");
  const signals = new Set([
    normalizedSource,
    withoutPosts,
    sourcePagePath(source),
    normalizePath(pagePath),
    normalizePath(config?.permalink),
    normalizePath(withoutPosts.split("/").at(-1))
  ].filter(Boolean));
  return signals;
}

function collectCandidateKeys({ kind, source, pagePath, config, registry }, includeNamespace) {
  const keys = new Set();
  const namespace = namespaceFor(kind, source);
  if (includeNamespace && namespace && registry.byKey.has(namespace.key)) keys.add(namespace.key);
  const index = kind === "posts" ? registry.topicStarts : registry.wikiMembers;
  for (const signal of pageSignals(source, pagePath, config)) {
    for (const key of index.get(signal) || []) keys.add(key);
  }
  return Object.freeze([...keys].sort());
}

function candidateKeys(input) {
  return collectCandidateKeys(input, true);
}

function membershipIssue(code, source, actual, candidates, fix) {
  const list = candidates.length > 0 ? candidates.join(", ") : "<none>";
  return Object.freeze({
    code,
    source,
    path: "collection",
    actualType: actual,
    expected: `one registered Collection; candidates=${list}; fix=${fix}`,
    migration: "content-schema/membership"
  });
}

function resolveContentMembership(input) {
  const kind = input.kind;
  const source = input.source || "<page>";
  const config = input.config || {};
  const registry = input.registry;
  const candidates = candidateKeys({ ...input, registry });
  const relationshipCandidates = collectCandidateKeys({ ...input, registry }, false);
  const namespace = namespaceFor(kind, source);
  const hardCandidates = new Set(relationshipCandidates);
  if (namespace?.profile !== "wiki" && registry.byKey.has(namespace?.key)) hardCandidates.add(namespace.key);
  const conflictingCandidates = Object.freeze([...hardCandidates].sort());
  const explicit = config.collection == null
    ? null
    : `${config.collection.profile}:${config.collection.id}`;
  const allowedProfiles = kind === "posts" ? new Set(["topic"]) : new Set(["wiki", "notebook"]);

  if (explicit) {
    const profile = config.collection.profile;
    if (!allowedProfiles.has(profile) || !registry.byKey.has(explicit)) {
      return deepFreeze({
        config: null,
        candidates,
        inferred: false,
        issues: [membershipIssue(
          "collection_not_found",
          source,
          `collection:${explicit}`,
          candidates,
          "use a profile/id registered in source/_data and valid for this content source"
        )]
      });
    }
    if (conflictingCandidates.length > 0 && !conflictingCandidates.includes(explicit)) {
      return deepFreeze({
        config: null,
        candidates,
        inferred: false,
        issues: [membershipIssue(
          "collection_conflict",
          source,
          `collection:${explicit}`,
          conflictingCandidates,
          "change collection.profile/id to the inferred member or move the source file"
        )]
      });
    }
    return deepFreeze({ config, candidates, inferred: false, issues: [] });
  }

  if (candidates.length === 1) {
    const record = registry.byKey.get(candidates[0]);
    return deepFreeze({
      config: {
        ...config,
        collection: { profile: record.profile, id: record.id }
      },
      candidates,
      inferred: true,
      issues: []
    });
  }
  if (candidates.length > 1) {
    return deepFreeze({
      config: null,
      candidates,
      inferred: false,
      issues: [membershipIssue(
        "collection_ambiguous",
        source,
        "collection:missing",
        candidates,
        "add collection.profile and collection.id to this page"
      )]
    });
  }

  if (namespace) {
    return deepFreeze({
      config: null,
      candidates,
      inferred: false,
      issues: [membershipIssue(
        "collection_not_found",
        source,
        "collection:missing",
        candidates,
        `create source/_data/${PROFILE_DIRECTORY[namespace.profile]}/${namespace.id}.yml or add a valid collection.profile/id`
      )]
    });
  }
  return deepFreeze({ config, candidates, inferred: false, issues: [] });
}

module.exports = {
  candidateKeys,
  createCollectionRegistry,
  normalizePath,
  resolveContentMembership,
  sourcePagePath
};
