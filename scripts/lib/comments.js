"use strict";

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
  const preferredTheme = stellarConfig?.appearance?.colorScheme;
  if (service === "giscus" && preferredTheme !== "auto" && options["data-theme"] === "preferred_color_scheme") {
    options["data-theme"] = preferredTheme;
  }
  return Object.freeze({
    enabled: comments.enabled !== false && service.length > 0,
    title: typeof comments.title === "string" ? comments.title : "",
    id: typeof comments.id === "string" ? comments.id : "",
    service,
    options: Object.freeze(options),
    pageTitle: String(pageTitle || "")
  });
}

module.exports = {
  mergeComments,
  normalizeThemeComments,
  resolveCommentsModel
};
