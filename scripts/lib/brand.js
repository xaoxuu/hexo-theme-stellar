/* global hexo */
"use strict";

const MOBILE_BRAND_LAYOUTS = Object.freeze([
  "categories",
  "tags",
  "index_topic",
  "index_wiki",
  "notebooks",
  "notes"
]);

const AUTO_BRAND_COLLECTION_TYPES = Object.freeze(["wiki", "notebook"]);

function normalizeBrand(brand) {
  const result = {};
  for (const [key, value] of Object.entries(brand || {})) {
    if (key !== "image" && value !== undefined) result[key] = value;
  }
  if (brand?.image && typeof brand.image === "object") {
    const image = {};
    for (const [key, value] of Object.entries(brand.image)) {
      if (value !== undefined) image[key] = value;
    }
    if (Object.keys(image).length > 0) result.image = image;
  }
  return result;
}

function mergeBrand(base, override) {
  const result = normalizeBrand(base);
  if (override == null) return result;
  for (const [key, value] of Object.entries(normalizeBrand(override))) {
    if (value !== undefined) result[key] = value;
  }
  return result;
}

function collectionBrandUrl(collection, type) {
  if (type === "wiki") return collection?.homepage?.path;
  if (type === "notebook") return collection?.route?.path;
  return undefined;
}

function automaticCollectionBrand(collection, type, defaultIcon) {
  if (collection == null || !AUTO_BRAND_COLLECTION_TYPES.includes(type)) return {};
  const imageSrc = collection.identity?.icon || defaultIcon;
  return {
    image: imageSrc ? { src: imageSrc, variant: "icon" } : undefined,
    name: collection.name,
    wordmark: null,
    tagline: collection.tagline == null ? undefined : { text: collection.tagline || null, hover: null },
    href: collectionBrandUrl(collection, type)
  };
}

function resolveBrand({ siteBrand, pageBrand, collection, collectionType, defaultIcon }) {
  let brand = mergeBrand({}, siteBrand);
  if (collection != null) {
    brand = mergeBrand(brand, automaticCollectionBrand(collection, collectionType, defaultIcon));
  }
  brand = mergeBrand(brand, collection?.sidebar?.left?.brand);
  brand = mergeBrand(brand, pageBrand);
  return brand;
}

function shouldShowMobileBrand({ layout, isHome, isCategory, isTag }) {
  return Boolean(isHome || isCategory || isTag || MOBILE_BRAND_LAYOUTS.includes(layout));
}

function replaceConfigTokens(value, config) {
  if (typeof value !== "string") return "";
  return value
    .replaceAll("{config.title}", config?.title || "")
    .replaceAll("{config.subtitle}", config?.subtitle || "")
    .replaceAll("{config.avatar}", config?.avatar || "");
}

module.exports = {
  MOBILE_BRAND_LAYOUTS,
  automaticCollectionBrand,
  collectionBrandUrl,
  mergeBrand,
  normalizeBrand,
  replaceConfigTokens,
  resolveBrand,
  shouldShowMobileBrand
};
