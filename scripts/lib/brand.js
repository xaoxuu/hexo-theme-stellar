'use strict';

const MOBILE_BRAND_LAYOUTS = Object.freeze([
  'categories',
  'tags',
  'index_topic',
  'index_wiki',
  'notebooks',
  'notes'
]);

const AUTO_BRAND_COLLECTION_TYPES = Object.freeze(['wiki', 'notebook']);

function mergeBrand(base, override) {
  const result = { ...(base || {}) };
  if (override == null) return result;
  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
}

function collectionBrandUrl(collection, type) {
  if (type === 'wiki') return collection?.homepage?.path;
  if (type === 'notebook') return collection?.routing?.base_dir;
  return undefined;
}

function automaticCollectionBrand(collection, type, defaultIcon) {
  if (collection == null || !AUTO_BRAND_COLLECTION_TYPES.includes(type)) return {};
  const imageSrc = collection.identity?.icon || defaultIcon;
  return {
    image: imageSrc ? { src: imageSrc, style: 'icon' } : undefined,
    name: collection.name,
    tagline: collection.tagline,
    url: collectionBrandUrl(collection, type)
  };
}

function resolveBrand({ themeBrand, pageBrand, collection, collectionType, defaultIcon }) {
  let brand = mergeBrand({}, themeBrand);
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
  if (typeof value !== 'string') return '';
  return value
    .replaceAll('{config.title}', config?.title || '')
    .replaceAll('{config.subtitle}', config?.subtitle || '')
    .replaceAll('{config.avatar}', config?.avatar || '');
}

module.exports = {
  MOBILE_BRAND_LAYOUTS,
  automaticCollectionBrand,
  collectionBrandUrl,
  mergeBrand,
  replaceConfigTokens,
  resolveBrand,
  shouldShowMobileBrand
};
