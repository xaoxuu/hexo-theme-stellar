"use strict";

const profileInputs = new Map();
const profileBases = new Map();
const relatedItems = new Map();
const pageConfigs = new Map();
const pageViewModels = new Map();

function keysForPage(page) {
  return [page?.source, page?.path, page?._id]
    .filter(value => typeof value === "string" && value.length > 0);
}

function resetPageViewModels() {
  profileInputs.clear();
  profileBases.clear();
  relatedItems.clear();
  pageConfigs.clear();
  pageViewModels.clear();
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

function setPostViewModelInput(page, input) {
  setProfileViewModelInput("post", page, input);
}

function getPostViewModelInput(page) {
  return getProfileViewModelInput("post", page);
}

function setTopicViewModelInput(page, input) {
  setProfileViewModelInput("topic", page, input);
}

function getTopicViewModelInput(page) {
  return getProfileViewModelInput("topic", page);
}

function setTopicViewModelBase(page, base) {
  setProfileViewModelBase("topic", page, base);
}

function getTopicViewModelBase(page) {
  return getProfileViewModelBase("topic", page);
}

function setNotebookViewModelInput(page, input) {
  setProfileViewModelInput("notebook", page, input);
}

function getNotebookViewModelInput(page) {
  return getProfileViewModelInput("notebook", page);
}

function setNotebookViewModelBase(page, base) {
  setProfileViewModelBase("notebook", page, base);
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

function setPageViewModel(page, viewModel) {
  setValue(pageViewModels, page, viewModel);
}

function getPageViewModel(page) {
  return getValue(pageViewModels, page);
}

module.exports = {
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
  resetPageViewModels,
  setPageConfig,
  setPageViewModel,
  setProfileViewModelBase,
  setProfileViewModelInput,
  setNotebookViewModelBase,
  setNotebookViewModelInput,
  setPostViewModelInput,
  setRelatedItems,
  setTopicViewModelBase,
  setTopicViewModelInput
};
