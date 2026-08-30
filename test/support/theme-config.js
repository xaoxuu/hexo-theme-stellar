"use strict";

const GROUPS = ["site", "layout", "content", "seo", "resources", "extensions"];

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value == null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
}

function unwrapProviders(value) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return value;
  if (value.providers && typeof value.providers === "object" && !Array.isArray(value.providers)) {
    Object.assign(value, value.providers);
    delete value.providers;
  }
  return value;
}

function flattenRegion(region) {
  if (region == null || Array.isArray(region) || typeof region !== "object") return region;
  return Array.isArray(region.widgets) ? region.widgets : region;
}

function flattenThemeFixture(input = {}) {
  const source = clone(input || {});
  const result = {};
  for (const [key, value] of Object.entries(source)) {
    if (GROUPS.includes(key) && value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, value);
    } else {
      result[key] = value;
    }
  }

  if (result.regions) {
    if (Object.prototype.hasOwnProperty.call(result.regions, "topbar")) result.regions.topbar = flattenRegion(result.regions.topbar);
    if (Object.prototype.hasOwnProperty.call(result.regions, "rightbar")) result.regions.rightbar = flattenRegion(result.regions.rightbar);
    if (Array.isArray(result.regions.leftbar)) result.regions.leftbar = { widgets: result.regions.leftbar };
    if (result.regions.leftbar?.footer) {
      result.regions.leftbar.footer_actions = result.regions.leftbar.footer.actions;
      delete result.regions.leftbar.footer;
    }
  }
  for (const profile of Object.values(result.profiles || {})) {
    if (!profile || typeof profile !== "object") continue;
    if (profile.navigation && Object.prototype.hasOwnProperty.call(profile.navigation, "active_menu")) {
      profile.active_menu = profile.navigation.active_menu;
    }
    delete profile.navigation;
    if (profile.regions) {
      Object.assign(profile, profile.regions);
      delete profile.regions;
    }
    if (Object.prototype.hasOwnProperty.call(profile, "topbar")) profile.topbar = flattenRegion(profile.topbar);
    if (Object.prototype.hasOwnProperty.call(profile, "rightbar")) profile.rightbar = flattenRegion(profile.rightbar);
    if (Array.isArray(profile.leftbar)) profile.leftbar = { widgets: profile.leftbar };
    if (profile.leftbar?.footer) {
      profile.leftbar.footer_actions = profile.leftbar.footer.actions;
      delete profile.leftbar.footer;
    }
  }

  unwrapProviders(result.search);
  unwrapProviders(result.comments);
  unwrapProviders(result.features?.math);
  unwrapProviders(result.features?.diagrams);
  for (const service of Object.values(result.services || {})) unwrapProviders(service);
  return result;
}

module.exports = { flattenThemeFixture };
