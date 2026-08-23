/* global hexo */

"use strict";

const INTERNAL_CONSTANTS = require("./internal-constants");

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
  if (typeof entry.module !== "string" || !entry.module.startsWith(LOCAL_MODULE_PREFIX) || !entry.module.endsWith(".mjs")) {
    throw new TypeError(`[stellar runtime] extensions[${index}].module must be a local runtime .mjs path`);
  }
  validateWhen(entry.when, `extensions[${index}].when`);
  plainObject(entry.config, `extensions[${index}].config`);
}

function normalizeRoot(value) {
  const root = typeof value === "string" && value.length > 0 ? value : "/";
  return root.endsWith("/") ? root : `${root}/`;
}

function addFeature(entries, module, id, enabled, when, config) {
  if (!enabled) return;
  entries.push({
    id,
    module,
    when,
    config: Object.assign({ feature: id }, config || {})
  });
}

function buildBrowserRuntimeManifest(input) {
  const source = plainObject(input, "input");
  const extensions = plainObject(source.extensions, "extensions");
  const features = plainObject(extensions.features, "extensions.features");
  const assets = plainObject(source.assets, "assets");
  const render = plainObject(source.render, "render");
  const messages = plainObject(source.messages, "messages");
  const runtimeModules = plainObject(assets.runtime?.modules, "assets.runtime.modules");
  const entries = [];
  const root = normalizeRoot(source.root);

  const search = plainObject(extensions.search, "extensions.search");
  if (typeof search.provider === "string" && search.provider.length > 0) {
    const provider = plainObject(search.providers?.[search.provider], `extensions.search.providers.${search.provider}`);
    entries.push({
      id: "search",
      module: runtimeModules.search,
      when: { selector: "#search-input" },
      config: {
        provider: search.provider,
        options: provider,
        algoliaAsset: assets.search?.algolia || null
      }
    });
  }

  addFeature(entries, runtimeModules.feature, "lazy-loading", true, {
    selector: ".lazy, .data-service, [class*='ds-']"
  }, {
    asset: assets.dependencies?.lazyLoading || null
  });
  addFeature(entries, runtimeModules.feature, "deferred-icons", true, { selector: "svg.icon[data-icon]" }, {
    asset: assets.features?.deferredIcons?.js || null
  });
  addFeature(entries, runtimeModules.feature, "dropdown", true, { selector: "details.dropdown" }, {
    asset: assets.features?.dropdown?.js || null
  });

  entries.push({
    id: "services",
    module: runtimeModules.services,
    when: {
      selector: ".data-service, [class*='ds-'], a[cardlink], .site-card [data-siteinfo-api], .voice>audio, .video>video, .chat-file"
    },
    config: {
      services: assets.services || {},
      siteInfoEndpoint: extensions.services?.siteInfo?.endpoint || null,
      marked: assets.dependencies?.marked || null
    }
  });

  const comments = plainObject(source.comments, "comments");
  if (typeof comments.service === "string" && comments.service.length > 0) {
    entries.push({
      id: "comments",
      module: runtimeModules.comments,
      when: { selector: "#comments" },
      config: {
        provider: comments.service,
        options: comments.options || {},
        pageTitle: comments.pageTitle || "",
        assets: assets.comments?.[comments.service] || {}
      }
    });
  }

  addFeature(entries, runtimeModules.feature, "preload", features.preload?.enabled === true, { always: true }, {
    asset: assets.features?.preload || null
  });
  addFeature(entries, runtimeModules.feature, "lightbox", features.lightbox?.enabled === true,
    features.lightbox?.mode === "global" ? { always: true } : {
      selector: ["[data-fancybox]:not(.error)", ".with-fancybox", ".ds-memos", features.lightbox?.selector]
        .filter(Boolean).join(", ")
    }, Object.assign({}, features.lightbox, { assets: assets.features?.lightbox || {} }));
  addFeature(entries, runtimeModules.feature, "reveal", features.reveal?.enabled === true, { selector: ".slide-up" },
    Object.assign({}, features.reveal, { asset: assets.features?.reveal || null }));

  const ai = features.aiSummary || {};
  const profile = source.profile || "";
  const aiMatches = ai.scope === "all" || ai.scope === profile;
  const aiInterface = plainObject(ai.interface, "extensions.features.ai_summary.interface");
  const aiMessages = plainObject(messages.aiSummary, "messages.aiSummary");
  const aiButtons = Array.isArray(aiInterface.buttons)
    ? aiInterface.buttons
    : (Array.isArray(aiMessages.buttons) ? aiMessages.buttons : []);
  addFeature(entries, runtimeModules.feature, "ai-summary", ai.enabled === true && aiMatches, { selector: "article.content" },
    Object.assign({}, ai, {
      assets: assets.features?.aiSummary || {},
      interface: {
        name: aiInterface.name ?? aiMessages.name ?? "",
        introduce: aiInterface.introduce ?? aiMessages.introduce ?? "",
        version: INTERNAL_CONSTANTS.providers.aiSummaryVersion,
        buttons: aiButtons
      }
    }));

  const mathProvider = render.math || features.math?.provider;
  if (mathProvider === "mathjax") {
    addFeature(entries, runtimeModules.feature, "mathjax", true, { selector: ".has-jax, script[type^='math/tex']" }, {
      options: features.math?.providers?.mathjax || {},
      assets: {
        v2: assets.features?.mathjaxV2 || null,
        v3: assets.features?.mathjaxV3 || null
      }
    });
  }
  const diagramsEnabled = !!render.diagrams || features.diagrams?.enabled === true;
  const diagramOptions = render.diagrams && typeof render.diagrams === "object" ? render.diagrams : {};
  addFeature(entries, runtimeModules.feature, "diagrams", diagramsEnabled, { selector: ".mermaid" }, Object.assign({}, features.diagrams, diagramOptions, {
    assets: assets.features?.diagrams || {},
    colorScheme: source.colorScheme || "auto"
  }));
  addFeature(entries, runtimeModules.feature, "code-copy", features.codeCopy?.enabled === true, { selector: ".code" }, Object.assign({}, features.codeCopy, {
    assets: assets.features?.codeCopy || {},
    messages: plainObject(messages.copy, "messages.copy")
  }));
  addFeature(entries, runtimeModules.feature, "adaptive-text", features.adaptiveText?.enabled === true, { selector: "[data-text-adaptive]" }, {
    assets: assets.features?.adaptiveText || {}
  });
  addFeature(entries, runtimeModules.feature, "card-hover", features.cardHover?.enabled === true, { selector: ".card-hover" }, Object.assign({}, features.cardHover, {
    assets: assets.features?.cardHover || {}
  }));
  addFeature(entries, runtimeModules.feature, "cjk-typography", features.cjkTypography?.enabled === true, { selector: ".heti" }, Object.assign({}, features.cjkTypography, {
    assets: assets.features?.cjkTypography || {}
  }));
  addFeature(entries, runtimeModules.feature, "swiper", true, { selector: "#swiper-api" }, { assets: assets.features?.swiper || {} });

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
