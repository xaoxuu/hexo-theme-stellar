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
  if (Array.isArray(value)) return { widgets: value };
  if (value == null || typeof value !== "object") return null;
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

function resolveLeftbar(layers) {
  let declared = false;
  const result = {
    enabled: true,
    brand: "site_brand",
    menu: true,
    footer: { actions: true },
    widgets: []
  };
  for (const layer of layers) {
    const current = regionLayer(layer?.leftbar);
    if (!current) continue;
    declared = true;
    if (typeof current.enabled === "boolean") result.enabled = current.enabled;
    if (current.brand === false || ["site_brand", "collection_brand"].includes(current.brand)) {
      result.brand = current.brand;
    }
    if (typeof current.menu === "boolean") result.menu = current.menu;
    if (typeof current.footerActions === "boolean") result.footer.actions = current.footerActions;
    if (typeof current.footer?.actions === "boolean") result.footer.actions = current.footer.actions;
    if (Array.isArray(current.widgets)) result.widgets = current.widgets.map(clone);
  }
  return declared ? result : null;
}

function cascadeRegions(layers) {
  const regions = {};
  for (const region of REGION_IDS) {
    if (region === "leftbar") {
      const leftbar = resolveLeftbar(layers);
      regions[region] = leftbar || { widgets: [] };
      continue;
    }
    regions[region] = { widgets: cascadeRegion(layers, region) };
  }
  return freeze(regions);
}

function resolveRegions(options = {}) {
  const layers = Array.isArray(options.layers) ? options.layers : [];
  const regions = {};
  const warnings = [];
  for (const region of REGION_IDS) {
    const leftbar = region === "leftbar" ? resolveLeftbar(layers) : null;
    if (leftbar && !leftbar.enabled) continue;
    const widgets = leftbar ? leftbar.widgets : cascadeRegion(layers, region);
    const resolved = resolveRegionWidgets(widgets, options.catalog || {}, {
      region,
      profile: options.profile,
      contentOnly: region === "leftbar"
    });
    if (resolved.instances.length > 0 || leftbar) {
      regions[region] = {
        widgets: resolved.instances,
        ...(leftbar ? {
          defaultState: options.defaultState || "expanded",
          brand: leftbar.brand,
          menu: leftbar.menu,
          footer: clone(leftbar.footer)
        } : {})
      };
    }
    warnings.push(...resolved.warnings);
  }
  return freeze({ regions, warnings });
}

module.exports = {
  REGION_IDS,
  cascadeRegion,
  cascadeRegions,
  resolveLeftbar,
  resolveRegions
};
