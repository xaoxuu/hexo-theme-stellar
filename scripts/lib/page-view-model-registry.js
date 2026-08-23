"use strict";

const postInputs = new Map();
const topicInputs = new Map();
const topicBases = new Map();
const notebookInputs = new Map();
const notebookBases = new Map();
const relatedItems = new Map();
const pageConfigs = new Map();
const pageViewModels = new Map();

function keysForPage(page) {
  return [page?.source, page?.path, page?._id]
    .filter(value => typeof value === "string" && value.length > 0);
}

function resetPageViewModels() {
  postInputs.clear();
  topicInputs.clear();
  topicBases.clear();
  notebookInputs.clear();
  notebookBases.clear();
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

function setPostViewModelInput(page, input) {
  setValue(postInputs, page, input);
}

function getPostViewModelInput(page) {
  return getValue(postInputs, page);
}

function setTopicViewModelInput(page, input) {
  setValue(topicInputs, page, input);
}

function getTopicViewModelInput(page) {
  return getValue(topicInputs, page);
}

function setTopicViewModelBase(page, base) {
  setValue(topicBases, page, base);
}

function getTopicViewModelBase(page) {
  return getValue(topicBases, page);
}

function setNotebookViewModelInput(page, input) {
  setValue(notebookInputs, page, input);
}

function getNotebookViewModelInput(page) {
  return getValue(notebookInputs, page);
}

function setNotebookViewModelBase(page, base) {
  setValue(notebookBases, page, base);
}

function getNotebookViewModelBase(page) {
  return getValue(notebookBases, page);
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
  setNotebookViewModelBase,
  setNotebookViewModelInput,
  setPostViewModelInput,
  setRelatedItems,
  setTopicViewModelBase,
  setTopicViewModelInput
};
