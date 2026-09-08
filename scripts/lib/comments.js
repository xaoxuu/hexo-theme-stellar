"use strict";

const { CONFIG_DEFAULTS } = require("../schema/config-schema");
const { splitResources } = require("./resource-assets");
const INTERNAL = require("./internal-constants");
const { isPlainObject } = require("./content-config");

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value == null || typeof value !== "object") return value;
  const result = {};
  for (const [key, child] of Object.entries(value)) result[key] = cloneValue(child);
  return result;
}

function mergeComments(base, override) {
  const result = cloneValue(isPlainObject(base) ? base : {});
  if (!isPlainObject(override)) return result;
  for (const [key, value] of Object.entries(override)) {
    if (value != null) result[key] = cloneValue(value);
  }
  return result;
}

function normalizeThemeComments(comments) {
  const source = isPlainObject(comments) ? comments : {};
  return {
    enabled: source.enabled !== false,
    title: typeof source.title === "string" ? source.title : "",
    id: typeof source.id === "string" ? source.id : "",
    provider: typeof source.provider === "string" ? source.provider : null,
    options: {}
  };
}

function resolveCommentsModel(stellarConfig, overrides = {}, pageTitle = "") {
  const comments = mergeComments(normalizeThemeComments(stellarConfig?.comments), overrides);
  const service = typeof comments.provider === "string" ? comments.provider : "";
  const options = mergeComments(
    service && isPlainObject(stellarConfig?.comments?.[service])
      ? stellarConfig.comments[service]
      : {},
    comments.options
  );
  const fields = ["js"];
  if (service === "artalk" || service === "waline") fields.push("css");
  if (service === "waline") fields.push("meta_css");
  for (const field of fields) {
    if (Object.hasOwn(comments.options || {}, field)) options[field] = comments.options[field];
  }
  const resolved = splitResources(options, CONFIG_DEFAULTS.comments[service], fields);
  const assets = { ...INTERNAL.assets.comments?.[service], ...resolved.assets };
  if (service === "artalk") {
    const server = typeof options.server === "string" ? options.server.trim().replace(/\/+$/, "") : "";
    for (const field of ["js", "css"]) {
      if (assets[field] == null) assets[field] = server ? `${server}/dist/Artalk.${field}` : null;
    }
  }
  const preferredTheme = stellarConfig?.appearance?.colorScheme;
  if (service === "giscus" && preferredTheme !== "auto" && options["data-theme"] === "preferred_color_scheme") {
    resolved.options["data-theme"] = preferredTheme;
  }
  return Object.freeze({
    enabled: comments.enabled !== false && service.length > 0,
    title: typeof comments.title === "string" ? comments.title : "",
    id: typeof comments.id === "string" ? comments.id : "",
    service,
    options: Object.freeze(resolved.options),
    assets: Object.freeze(assets),
    pageTitle: String(pageTitle || "")
  });
}

module.exports = {
  mergeComments,
  normalizeThemeComments,
  resolveCommentsModel
};
