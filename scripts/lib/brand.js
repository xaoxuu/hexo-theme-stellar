/* global hexo */
"use strict";

const COLLECTION_BRAND_TYPES = Object.freeze(["wiki", "notebook", "topic"]);

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

function collectionBrandUrl(collection, type) {
  if (type === "wiki") {
    const homepage = collection?.route?.homepage ?? collection?.homepage?.path;
    return homepage === "" ? "/" : homepage;
  }
  if (type === "notebook") return collection?.route?.baseDir || collection?.route?.path;
  if (type === "topic") return collection?.route?.path;
  return undefined;
}

function collectionBrand(collection, type, defaultIcon) {
  if (collection == null || !COLLECTION_BRAND_TYPES.includes(type)) return null;
  const identity = collection.identity || {};
  const name = identity.name ?? collection.name;
  const tagline = identity.tagline ?? collection.tagline;
  const imageSrc = identity.icon || defaultIcon;
  return normalizeBrand({
    image: imageSrc ? { src: imageSrc, variant: "icon" } : undefined,
    name: name == null ? null : name,
    tagline: tagline == null ? undefined : tagline || null,
    href: collectionBrandUrl(collection, type)
  });
}

function resolveBrands({ siteBrand, collection, collectionType, defaultIcon }) {
  return {
    site: normalizeBrand({ ...siteBrand, href: "/" }),
    collection: collectionBrand(collection, collectionType, defaultIcon)
  };
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
  COLLECTION_BRAND_TYPES,
  collectionBrand,
  collectionBrandUrl,
  normalizeBrand,
  replaceConfigTokens,
  resolveBrands,
  shouldShowMobileBrand
};
