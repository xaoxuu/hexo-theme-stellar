"use strict";

const profileInputs = new Map();
const profileBases = new Map();
const relatedItems = new Map();
const pageConfigs = new Map();

function keysForPage(page) {
  return [page?.source, page?.path, page?._id]
    .filter(value => typeof value === "string" && value.length > 0);
}

function resetPageViewModelRegistry() {
  profileInputs.clear();
  profileBases.clear();
  relatedItems.clear();
  pageConfigs.clear();
}

function setValue(store, page, value) {
  for (const key of keysForPage(page)) store.set(key, value);
}

function getValue(store, page) {
  for (const key of keysForPage(page)) {
    if (store.has(key)) return store.get(key);
  }
  return null;
}

function setPageConfig(page, config) {
  setValue(pageConfigs, page, config);
}

function getPageConfig(page) {
  return getValue(pageConfigs, page);
}

function profileStore(stores, profile) {
  if (!stores.has(profile)) stores.set(profile, new Map());
  return stores.get(profile);
}

function setProfileViewModelInput(profile, page, input) {
  setValue(profileStore(profileInputs, profile), page, input);
}

function getProfileViewModelInput(profile, page) {
  return getValue(profileStore(profileInputs, profile), page);
}

function setProfileViewModelBase(profile, page, base) {
  setValue(profileStore(profileBases, profile), page, base);
}

function getProfileViewModelBase(profile, page) {
  return getValue(profileStore(profileBases, profile), page);
}

function getPostViewModelInput(page) {
  return getProfileViewModelInput("post", page);
}

function getTopicViewModelInput(page) {
  return getProfileViewModelInput("topic", page);
}

function getTopicViewModelBase(page) {
  return getProfileViewModelBase("topic", page);
}

function getNotebookViewModelInput(page) {
  return getProfileViewModelInput("notebook", page);
}

function getNotebookViewModelBase(page) {
  return getProfileViewModelBase("notebook", page);
}

function setRelatedItems(page, items) {
  setValue(relatedItems, page, Object.freeze(items.slice()));
}

function getRelatedItems(page) {
  return getValue(relatedItems, page) || [];
}

module.exports = {
  getProfileViewModelBase,
  getProfileViewModelInput,
  getPageConfig,
  getNotebookViewModelBase,
  getNotebookViewModelInput,
  getPostViewModelInput,
  getRelatedItems,
  getTopicViewModelBase,
  getTopicViewModelInput,
  resetPageViewModelRegistry,
  setPageConfig,
  setProfileViewModelBase,
  setProfileViewModelInput,
  setRelatedItems
};
