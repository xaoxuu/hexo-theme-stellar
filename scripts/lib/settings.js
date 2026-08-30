"use strict";

const TOKEN_PATTERN = /\{(?:hexo|theme)\.[a-z]+\}/g;

function replaceSettingsTokens(value, tokens) {
  const source = typeof value === "string" ? value : "";
  return source.replace(TOKEN_PATTERN, token => Object.prototype.hasOwnProperty.call(tokens, token) ? String(tokens[token]) : token);
}

function routeIdentity(value) {
  let route = String(value || "").trim().replace(/^\/+|\/+$/g, "");
  route = route.replace(/\/index\.html$/i, "");
  return route || "<root>";
}

module.exports = { replaceSettingsTokens, routeIdentity };
