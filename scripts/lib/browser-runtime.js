/* global hexo */

"use strict";

const INTERNAL_CONSTANTS = require("./internal-constants");
const { buildContributionEntries } = require("./contribution-registry");
const { resolveServiceProvider } = require("./service-provider");

const RUNTIME_VERSION = 1;
const RUNTIME_CONFIG_ID = "stellar-runtime-config";
const LOCAL_MODULE_PREFIX = "/js/runtime/";

function deepFreeze(value) {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function plainObject(value, path) {
  if (value == null) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`[stellar runtime] ${path} must be an object`);
  }
  return value;
}

function validateWhen(value, path) {
  const when = plainObject(value, path);
  const keys = Object.keys(when);
  if (keys.length !== 1 || !["always", "selector"].includes(keys[0])) {
    throw new TypeError(`[stellar runtime] ${path} must declare exactly one of always/selector`);
  }
  if (keys[0] === "always" && when.always !== true) {
    throw new TypeError(`[stellar runtime] ${path}.always must be true`);
  }
  if (keys[0] === "selector" && (typeof when.selector !== "string" || when.selector.length === 0)) {
    throw new TypeError(`[stellar runtime] ${path}.selector must be a non-empty string`);
  }
  return when;
}

function validateEntry(entry, index, ids) {
  plainObject(entry, `extensions[${index}]`);
  const allowed = new Set(["id", "module", "when", "config"]);
  const unknown = Object.keys(entry).filter(key => !allowed.has(key));
  if (unknown.length > 0) {
    throw new TypeError(`[stellar runtime] extensions[${index}] has unknown field ${unknown[0]}`);
  }
  if (typeof entry.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(entry.id)) {
    throw new TypeError(`[stellar runtime] extensions[${index}].id is invalid`);
  }
  if (ids.has(entry.id)) {
    throw new TypeError(`[stellar runtime] duplicate extension id ${entry.id}`);
  }
  ids.add(entry.id);
  if (typeof entry.module !== "string" || !entry.module.startsWith(LOCAL_MODULE_PREFIX) || !entry.module.endsWith(".js")) {
    throw new TypeError(`[stellar runtime] extensions[${index}].module must be a local runtime .js path`);
  }
  validateWhen(entry.when, `extensions[${index}].when`);
  plainObject(entry.config, `extensions[${index}].config`);
}

function normalizeRoot(value) {
  const root = typeof value === "string" && value.length > 0 ? value : "/";
  return root.endsWith("/") ? root : `${root}/`;
}

function buildBrowserRuntimeManifest(input) {
  const source = plainObject(input, "input");
  const extensions = plainObject(source.extensions, "extensions");
  const features = plainObject(extensions.features, "extensions.features");
  const assets = plainObject(source.assets, "assets");
  const render = plainObject(source.render, "render");
  const messages = plainObject(source.messages, "messages");
  const root = normalizeRoot(source.root);
  const comments = plainObject(source.comments, "comments");
  const entries = buildContributionEntries({
    assets,
    colorScheme: source.colorScheme,
    comments,
    extensions,
    features,
    messages,
    plainObject,
    render,
    resolveServiceProvider
  });

  const manifest = {
    version: RUNTIME_VERSION,
    root,
    policy: Object.assign({}, INTERNAL_CONSTANTS.runtime, { providers: INTERNAL_CONSTANTS.providers }),
    dependencies: assets.dependencies || {},
    extensions: entries
  };
  const ids = new Set();
  entries.forEach((entry, index) => validateEntry(entry, index, ids));
  return deepFreeze(manifest);
}

function serializeBrowserRuntimeManifest(manifest) {
  return JSON.stringify(manifest)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

module.exports = {
  RUNTIME_CONFIG_ID,
  RUNTIME_VERSION,
  buildBrowserRuntimeManifest,
  serializeBrowserRuntimeManifest
};
