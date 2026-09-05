/* global hexo */
"use strict";

function ensureRuntimeData(ctx) {
  ctx.stellar ||= {};
  ctx.stellar.data ||= {};
  return ctx.stellar.data;
}

function runtimeDataAt(ctx, path) {
  const parts = typeof path === "string" && path.length > 0 ? path.split(".") : [];
  let value = ctx.stellar?.data;
  for (const part of parts) {
    if (value == null || !Object.prototype.hasOwnProperty.call(value, part)) return undefined;
    value = value[part];
  }
  return value;
}

module.exports = {
  ensureRuntimeData,
  runtimeDataAt
};
