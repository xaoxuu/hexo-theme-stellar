/* global hexo */
"use strict";

function normalizeBrand(brand) {
  const result = {};
  for (const key of ["name", "tagline", "href"]) {
    if (brand?.[key] !== undefined) result[key] = brand[key];
  }
  if (brand?.image && typeof brand.image === "object") {
    const image = {};
    for (const key of ["src", "variant"]) {
      if (brand.image[key] !== undefined) image[key] = brand.image[key];
    }
    if (Object.keys(image).length > 0) result.image = image;
  }
  return result;
}

function shouldShowMobileBrand({ profileKey }) {
  return [
    "home",
    "blogIndex",
    "topicIndex",
    "wikiIndex",
    "notebookIndex",
    "noteIndex"
  ].includes(profileKey);
}

function replaceConfigTokens(value, config) {
  if (typeof value !== "string") return "";
  return value
    .replaceAll("{config.title}", config?.title || "")
    .replaceAll("{config.subtitle}", config?.subtitle || "")
    .replaceAll("{config.avatar}", config?.avatar || "");
}

module.exports = {
  normalizeBrand,
  replaceConfigTokens,
  shouldShowMobileBrand
};
