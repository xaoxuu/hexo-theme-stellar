"use strict";

function createPageViewModelRegistry() {

  const profileInputs = new Map();
  const profileBases = new Map();
  const relatedItems = new Map();
  const pageConfigs = new Map();
  const pageViewModels = new Map();
  const navigationMembers = new Map();

  function setNavigationMembers(records) {
    navigationMembers.clear();
    for (const record of records) {
      navigationMembers.set(record.page.path, JSON.stringify([record.profile, record.collectionId]));
    }
  }

  function getNavigationCollection(path) {
    return navigationMembers.get(path) || null;
  }

  function keysForPage(page) {
    return ["source", "path", "_id"].filter(key => typeof page?.[key] === "string" && page[key].length > 0)
      .map(key => `${key}:${page[key]}`);
  }

  function resetPageViewModelRegistry() {
    profileInputs.clear();
    profileBases.clear();
    relatedItems.clear();
    pageConfigs.clear();
    pageViewModels.clear();
    navigationMembers.clear();
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

  function setPageViewModel(page, viewModel) {
    setValue(pageViewModels, page, viewModel);
    // Derived models belong to this build, not Warehouse's persisted content.
    // A non-enumerable getter avoids deep-copying entire Collection trees on save.
    Object.defineProperty(page, "viewModel", {
      configurable: true,
      enumerable: false,
      get: () => getPageViewModel(page)
    });
  }

  function getPageViewModel(page) {
    return getValue(pageViewModels, page);
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

  return Object.freeze({
    setNavigationMembers,
    getNavigationCollection,
    getProfileViewModelBase,
    getProfileViewModelInput,
    getPageConfig,
    getPageViewModel,
    getNotebookViewModelBase,
    getNotebookViewModelInput,
    getPostViewModelInput,
    getRelatedItems,
    getTopicViewModelBase,
    getTopicViewModelInput,
    resetPageViewModelRegistry,
    setPageConfig,
    setPageViewModel,
    setProfileViewModelBase,
    setProfileViewModelInput,
    setRelatedItems
  });

}
const registries = new WeakMap();
function pageViewModelsFor(ctx) {
  if (!registries.has(ctx)) registries.set(ctx, createPageViewModelRegistry());
  return registries.get(ctx);
}
module.exports = { createPageViewModelRegistry, pageViewModelsFor };
