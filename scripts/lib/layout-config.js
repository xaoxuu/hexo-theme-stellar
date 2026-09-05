/* global hexo */
"use strict";

const { cascadeRegions } = require("./regions");

function profilePath(path) {
  if (typeof path !== "string") return "";
  return path.replace(/^\/+|\/+$/g, "");
}

function generatorPath(path) {
  const normalized = profilePath(path);
  if (normalized.length === 0) return "index.html";
  return /\.[^/]+$/.test(normalized) ? normalized : `${normalized}/index.html`;
}

function toRenderNavigation(profile) {
  const activeMenu = profile?.activeMenu;
  return activeMenu == null ? {} : { menu: activeMenu };
}

function siteBrandModel(globalConfig) {
  const configured = globalConfig?.leftbar?.brand;
  if (configured === false) return false;
  return {
    ...(configured && typeof configured === "object" ? configured : {}),
    source: "site",
    style: configured?.style || "regular"
  };
}

function toRenderRegions(globalConfig, profile, defaults = null, options = {}) {
  const siteBrand = siteBrandModel(globalConfig);
  const normalizedGlobal = {
    ...globalConfig,
    leftbar: {
      ...(globalConfig?.leftbar || {}),
      brand: siteBrand
    }
  };
  return cascadeRegions(
    [normalizedGlobal, defaults, profile, ...(options.layers || [])],
    { brandSources: { site: siteBrand, ...(options.brandSources || {}) } }
  );
}

function requireLayoutProfiles(stellarConfig) {
  const profiles = stellarConfig?.profiles;
  if (profiles == null || typeof profiles !== "object" || Array.isArray(profiles)) {
    throw new TypeError("Stellar v2: 缺少冻结的 profiles 配置");
  }
  return profiles;
}

module.exports = {
  generatorPath,
  profilePath,
  requireLayoutProfiles,
  siteBrandModel,
  toRenderNavigation,
  toRenderRegions
};
