"use strict";

const { resolveRegionWidgets } = require("./widget-registry");

const REGION_IDS = Object.freeze(["topbar", "leftbar", "rightbar"]);

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value == null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
}

function freeze(value) {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}

function regionLayer(value) {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}

function cascadeRegion(layers, region) {
  let widgets = [];
  for (const layer of layers) {
    const current = regionLayer(layer?.[region]);
    if (!current) continue;
    if (Array.isArray(current.widgets)) widgets = current.widgets.map(clone);
  }
  return widgets;
}

function mergeBrand(base, override) {
  if (override == null) return clone(base);
  if (override === false) return false;
  if (regionLayer(override) == null) return clone(base);
  const result = regionLayer(base) == null ? {} : clone(base);
  for (const [key, value] of Object.entries(override)) {
    if (key === "image" && regionLayer(value)) {
      result.image = { ...(regionLayer(result.image) ? result.image : {}), ...clone(value) };
    } else {
      result[key] = clone(value);
    }
  }
  return result;
}

function resolveRegion(layers, region) {
  const result = {
    enabled: region !== "topbar",
    widgets: []
  };
  if (["topbar", "leftbar"].includes(region)) {
    result.brand = false;
    result.menu = [];
  }
  if (region === "leftbar") result.footer = { actions: [] };
  for (const layer of layers) {
    const current = regionLayer(layer?.[region]);
    if (!current) continue;
    if (typeof current.enabled === "boolean") result.enabled = current.enabled;
    if (["topbar", "leftbar"].includes(region) && current.brand !== undefined) {
      result.brand = mergeBrand(result.brand, current.brand);
    }
    if (["topbar", "leftbar"].includes(region) && Array.isArray(current.menu)) {
      result.menu = current.menu.map(clone);
    }
    if (region === "leftbar" && Array.isArray(current.footer?.actions)) {
      result.footer.actions = current.footer.actions.map(clone);
    }
    if (Array.isArray(current.widgets)) result.widgets = current.widgets.map(clone);
  }
  return result;
}

function resolveLeftbar(layers) {
  return resolveRegion(layers, "leftbar");
}

function cascadeRegions(layers) {
  const regions = {};
  for (const region of REGION_IDS) {
    regions[region] = resolveRegion(layers, region);
  }
  return freeze(regions);
}

function resolveRegions(options = {}) {
  const layers = Array.isArray(options.layers) ? options.layers : [];
  const resolvedRegions = {};
  const warnings = [];
  for (const region of REGION_IDS) {
    const state = resolveRegion(layers, region);
    const widgets = state.enabled ? state.widgets : [];
    const resolved = resolveRegionWidgets(widgets, options.catalog || {}, {
      region,
      profile: options.profile,
      contentOnly: region === "leftbar"
    });
    resolvedRegions[region] = {
      widgets: resolved.instances,
      enabled: state.enabled,
      ...(["topbar", "leftbar"].includes(region) ? {
        brand: clone(state.brand),
        menu: clone(state.menu)
      } : {}),
      ...(region === "leftbar" ? {
        defaultState: options.defaultState || "expanded",
        footer: clone(state.footer)
      } : {})
    };
    warnings.push(...resolved.warnings);
  }
  return freeze({ ...resolvedRegions, warnings });
}

module.exports = {
  REGION_IDS,
  cascadeRegion,
  cascadeRegions,
  mergeBrand,
  resolveLeftbar,
  resolveRegion,
  resolveRegions
};
