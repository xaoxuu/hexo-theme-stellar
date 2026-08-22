"use strict";

const postInputs = new Map();

function keysForPage(page) {
  return [page?.source, page?.path, page?._id]
    .filter(value => typeof value === "string" && value.length > 0);
}

function resetPageViewModels() {
  postInputs.clear();
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

module.exports = {
  getPostViewModelInput,
  resetPageViewModels,
  setPostViewModelInput
};
