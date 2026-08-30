"use strict";

const { normalize_path: normalizePath } = require("./path_utils");

function localPath(value) {
  if (typeof value !== "string") return null;
  const withoutQuery = value.split(/[?#]/, 1)[0];
  if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(withoutQuery)) return null;
  const normalized = normalizePath(withoutQuery || "/");
  if (normalized === "") return "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function resolveMenuActiveByPath(items, pagePath, urlFor = value => value) {
  if (!Array.isArray(items)) return null;
  const currentPath = localPath(urlFor(pagePath || "/"));
  if (currentPath == null) return null;

  let match = null;
  let matchLength = -1;
  for (const item of items) {
    if (item == null || item.type === "search" || typeof item.id !== "string" || typeof item.url !== "string") continue;
    const itemPath = localPath(urlFor(item.url));
    if (itemPath == null) continue;
    const active = itemPath === "/"
      ? currentPath === "/"
      : currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
    if (active && itemPath.length > matchLength) {
      match = item.id;
      matchLength = itemPath.length;
    }
  }
  return match;
}

module.exports = { localPath, resolveMenuActiveByPath };
