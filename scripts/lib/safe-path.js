"use strict";

const fs = require("node:fs");
const path = require("node:path");

function safeRelativePath(value, source) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${source}: 路径必须是非空相对路径`);
  const unixPath = value.replace(/\\/g, "/");
  const normalized = path.posix.normalize(unixPath);
  const hasDriveRoot = /^[A-Za-z]:/.test(unixPath);
  if (path.isAbsolute(value) || path.posix.isAbsolute(unixPath) || hasDriveRoot || unixPath.split("/").includes("..") || /^\.\/?$/.test(normalized)) {
    throw new TypeError(`${source}: 路径不能逃逸根目录（${value}）`);
  }
  return normalized;
}

function resolveInside(root, relative, source) {
  const safe = safeRelativePath(relative, source);
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, safe);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new TypeError(`${source}: 路径不能逃逸根目录（${relative}）`);
  }
  const physicalRoot = fs.realpathSync(resolvedRoot);
  let ancestor = resolved;
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }
  const physicalAncestor = fs.realpathSync(ancestor);
  if (physicalAncestor !== physicalRoot && !physicalAncestor.startsWith(`${physicalRoot}${path.sep}`)) {
    throw new TypeError(`${source}: 路径经过根目录外的符号链接（${relative}）`);
  }
  if (fs.existsSync(resolved)) {
    const physicalResolved = fs.realpathSync(resolved);
    if (physicalResolved !== physicalRoot && !physicalResolved.startsWith(`${physicalRoot}${path.sep}`)) {
      throw new TypeError(`${source}: 路径经过根目录外的符号链接（${relative}）`);
    }
  }
  return { relative: safe, absolute: resolved };
}

module.exports = { resolveInside, safeRelativePath };
