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

  if (result.leftbar?.footer) {
    result.leftbar.footer_actions = result.leftbar.footer.actions;
    delete result.leftbar.footer;
  }
  for (const profile of Object.values(result.profiles || {})) {
    if (!profile || typeof profile !== "object") continue;
    if (profile.navigation && Object.prototype.hasOwnProperty.call(profile.navigation, "active_menu")) {
      profile.active_menu = profile.navigation.active_menu;
    }
    delete profile.navigation;
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
