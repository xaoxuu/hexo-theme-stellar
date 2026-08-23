"use strict";

const postInputs = new Map();
const pageConfigs = new Map();
const pageViewModels = new Map();

function keysForPage(page) {
  return [page?.source, page?.path, page?._id]
    .filter(value => typeof value === "string" && value.length > 0);
}

function resetPageViewModels() {
  postInputs.clear();
  pageConfigs.clear();
  pageViewModels.clear();
}

function setPageConfig(page, config) {
  for (const key of keysForPage(page)) pageConfigs.set(key, config);
}

function getPageConfig(page) {
  for (const key of keysForPage(page)) {
    if (pageConfigs.has(key)) return pageConfigs.get(key);
  }
  return null;
}

function setPostViewModelInput(page, input) {
  for (const key of keysForPage(page)) postInputs.set(key, input);
}

function getPostViewModelInput(page) {
  for (const key of keysForPage(page)) {
    if (postInputs.has(key)) return postInputs.get(key);
  }
  return null;
}

function setPageViewModel(page, viewModel) {
  for (const key of keysForPage(page)) pageViewModels.set(key, viewModel);
}

function getPageViewModel(page) {
  for (const key of keysForPage(page)) {
    if (pageViewModels.has(key)) return pageViewModels.get(key);
  }
  return null;
}

module.exports = {
  getPageConfig,
  getPageViewModel,
  getPostViewModelInput,
  resetPageViewModels,
  setPageConfig,
  setPageViewModel,
  setPostViewModelInput
};
