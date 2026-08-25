"use strict";

const adapters = [
  require("./adapters/post"),
  require("./adapters/topic"),
  require("./adapters/wiki"),
  require("./adapters/notebook")
];

const PROFILE_IDS = Object.freeze(adapters.map(adapter => adapter.id));
const registry = new Map(adapters.map(adapter => [adapter.id, Object.freeze(adapter)]));

function getProfileAdapter(id) {
  const adapter = registry.get(id);
  if (!adapter) throw new Error(`Stellar v2: 未登记的 Collection profile ${id}`);
  return adapter;
}

function profileAdapters() {
  return PROFILE_IDS.map(getProfileAdapter);
}

module.exports = {
  PROFILE_IDS,
  getProfileAdapter,
  profileAdapters
};
