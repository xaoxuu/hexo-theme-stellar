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
  const activeMenu = profile?.navigation?.activeMenu;
  return activeMenu == null ? {} : { menu: activeMenu };
}

function toRenderRegions(globalRegions, profile) {
  return cascadeRegions([globalRegions, profile?.regions]);
}

function requireLayoutProfiles(stellarConfig) {
  const profiles = stellarConfig?.layout?.profiles;
  if (profiles == null || typeof profiles !== "object" || Array.isArray(profiles)) {
    throw new TypeError("Stellar v2: 缺少冻结的 layout.profiles 配置");
  }
  return profiles;
}

module.exports = {
  generatorPath,
  profilePath,
  requireLayoutProfiles,
  toRenderNavigation,
  toRenderRegions
};
