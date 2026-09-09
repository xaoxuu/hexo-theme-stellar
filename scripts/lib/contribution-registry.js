/* global hexo */

"use strict";

const { defineContributions } = require("./contribution-contract");
const { splitResources } = require("./resource-assets");
const { CONFIG_DEFAULTS } = require("../schema/config-schema");
const INTERNAL = require("./internal-constants");

const PLUGIN_SYSTEM_DOC = "docs/knowledge/07-外部集成/plugin-system.md";
const RUNTIME_TEST = "test/browser-runtime-manifest.test.js";
const RUNTIME_CONSUMPTION_TEST = "test/browser-runtime-consumption.test.js";
const CONFIG_OWNER = path => `_config.yml#${path}`;

function featureEntry(id) {
  return runtimeEntry(`/js/runtime/extensions/${id}.js`);
}

function runtimeEntry(path) {
  return { type: "browser-module", path };
}

function selector(value) {
  return { type: "selector", value };
}

function configResult(config, when) {
  return { config, ...(when ? { when } : {}) };
}

const CONTRIBUTIONS = defineContributions([
  {
    id: "page-controls",
    scope: "region",
    kind: "component",
    entry: featureEntry("page-controls"),
    resources: ["runtime.searchHighlight", "runtime.tagtree"],
    activation: { type: "always" },
    schema: null,
    i18n: null,
    docs: { category: "Components", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: null,
    project: context => configResult({ highlight: context.assets.runtime?.searchHighlight, tagtree: context.assets.runtime?.tagtree })
  },
  {
    id: "partial-navigation",
    scope: "document",
    kind: "feature",
    entry: featureEntry("partial-navigation"),
    resources: [],
    activation: { type: "always" },
    schema: "features.partial_navigation.enabled",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.partial_navigation.enabled"),
    project: context => context.features.partialNavigation?.enabled === true ? configResult({}) : null
  },
  {
    id: "runtime-bootstrap",
    scope: "document",
    kind: "component",
    entry: { type: "template", path: "layout/_partial/scripts/runtime.ejs" },
    resources: ["runtime.bootstrap"],
    activation: { type: "always" },
    schema: null,
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST],
    defaultsOwner: null,
    project: null
  },
  {
    id: "color-scheme-switch",
    scope: "document",
    kind: "feature",
    entry: runtimeEntry(INTERNAL.assets.runtime.colorSchemeSwitch),
    resources: ["runtime.colorSchemeSwitch"],
    activation: { type: "always" },
    schema: "features.color_scheme_switch.enabled",
    i18n: {
      namespace: "color-scheme-switch",
      keys: [
        "message.color_scheme_switched.light",
        "message.color_scheme_switched.dark",
        "message.color_scheme_switched.auto"
      ]
    },
    docs: { category: "Extensions", path: "docs/knowledge/05-前端交互/client-side-overview.md" },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.color_scheme_switch.enabled"),
    project(context) {
      if (context.features.colorSchemeSwitch?.enabled !== true) return null;
      return configResult({
        messages: context.plainObject(context.messages.colorScheme, "messages.colorScheme")
      });
    }
  },
  {
    id: "search",
    scope: "document",
    kind: "extension",
    entry: runtimeEntry("/js/runtime/extensions/search.js"),
    resources: ["search"],
    activation: selector(".search-input"),
    schema: "search.provider",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("search.provider"),
    project(context) {
      const search = context.plainObject(context.extensions.search, "extensions.search");
      if (typeof search.provider !== "string" || search.provider.length === 0) return null;
      const provider = context.plainObject(search[search.provider], `search.${search.provider}`);
      const resolved = splitResources(provider, CONFIG_DEFAULTS.search[search.provider], ["js"]);
      return configResult({
        provider: search.provider,
        options: resolved.options,
        assets: {
          client: search.provider === "algolia" ? resolved.assets.js : null,
          provider: context.assets.search?.providers?.[search.provider] || null,
          shortcut: context.assets.search?.shortcut || null
        }
      });
    }
  },
  {
    id: "hero-effect",
    scope: "region",
    kind: "feature",
    entry: runtimeEntry(INTERNAL.assets.runtime.heroEffect),
    resources: ["runtime.heroEffect", "heroEffects"],
    activation: selector("canvas[data-hero-effect]"),
    schema: null,
    i18n: null,
    docs: { category: "Components", path: "docs/knowledge/03-内容系统/wiki-docs.md" },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: null,
    project: () => configResult({})
  },
  {
    id: "lazy-loading",
    scope: "document",
    kind: "feature",
    entry: featureEntry("lazy-loading"),
    resources: [],
    activation: { type: "always" },
    schema: "features.lazy_loading.transition",
    i18n: null,
    docs: { category: "Extensions", path: "docs/knowledge/07-外部集成/lazy-loading-images.md" },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.lazy_loading.transition"),
    project: context => configResult({ asset: splitResources(context.features.lazyLoading, CONFIG_DEFAULTS.features.lazy_loading, ["js"]).assets.js })
  },
  {
    id: "deferred-icons",
    scope: "region",
    kind: "component",
    entry: runtimeEntry(INTERNAL.assets.runtime.deferredIcons),
    resources: ["runtime.deferredIcons"],
    activation: selector("svg.icon[data-icon]"),
    schema: null,
    i18n: null,
    docs: { category: "Components", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: null,
    project: () => configResult({})
  },
  {
    id: "dropdown",
    scope: "region",
    kind: "component",
    entry: runtimeEntry(INTERNAL.assets.runtime.dropdown),
    resources: ["runtime.dropdown"],
    activation: selector("details.dropdown"),
    schema: null,
    i18n: null,
    docs: { category: "Components", path: "docs/knowledge/04-标签插件/note-container-tags.md" },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: null,
    project: () => configResult({})
  },
  {
    id: "services",
    scope: "region",
    kind: "extension",
    entry: runtimeEntry("/js/runtime/extensions/services.js"),
    resources: ["services"],
    activation: selector("#artalk_container, #twikoo_container, #waline_container, .data-service, [class*='ds-'], a[cardlink], a[data-md-link][data-siteinfo-api], .site-card [data-siteinfo-api], .voice>audio, .video>video, .chat-file"),
    schema: "services.site_info.provider",
    i18n: null,
    docs: { category: "Extensions", path: "docs/knowledge/06-数据服务与组件/data-service-apis.md" },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("services.site_info.provider"),
    project(context) {
      return configResult({
        marked: splitResources(context.extensions.services?.markdown, CONFIG_DEFAULTS.services.markdown, ["js"]).assets.js
      });
    }
  },
  {
    id: "comments",
    scope: "region",
    kind: "extension",
    entry: runtimeEntry("/js/runtime/extensions/comments.js"),
    resources: ["comments"],
    activation: selector("#comments"),
    schema: "comments.provider",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("comments.provider"),
    project(context) {
      if (context.comments.enabled !== true || typeof context.comments.service !== "string" || context.comments.service.length === 0) return null;
      return configResult({
        provider: context.comments.service,
        options: context.comments.options || {},
        pageTitle: context.comments.pageTitle || "",
        assets: context.comments.assets || {}
      });
    }
  },
  {
    id: "settings",
    scope: "region",
    kind: "component",
    entry: runtimeEntry(INTERNAL.assets.runtime.settings),
    resources: ["runtime.settings"],
    activation: selector(".settings-page"),
    schema: null,
    i18n: null,
    docs: { category: "Components", path: "docs/knowledge/02-布局系统/sidebar-system.md" },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: null,
    project: context => configResult({})
  },
  {
    id: "link-prefetch",
    scope: "document",
    kind: "feature",
    entry: featureEntry("link-prefetch"),
    resources: [],
    activation: { type: "always" },
    schema: "features.link_prefetch.enabled",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.link_prefetch.enabled"),
    project(context) {
      if (context.features.linkPrefetch?.enabled !== true) return null;
      return configResult({ asset: splitResources(context.features.linkPrefetch, CONFIG_DEFAULTS.features.link_prefetch, ["js"]).assets.js });
    }
  },
  {
    id: "lightbox",
    scope: "region",
    kind: "feature",
    entry: featureEntry("lightbox"),
    resources: ["features.lightbox"],
    activation: selector("[data-fancybox]:not(.error), .with-fancybox, .ds-memos"),
    schema: "features.lightbox.enabled",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.lightbox.enabled"),
    project(context) {
      if (context.features.lightbox?.enabled !== true) return null;
      const dynamicSelector = [this.activation.value, context.features.lightbox?.selector].filter(Boolean).join(", ");
      const resolved = splitResources(context.features.lightbox, CONFIG_DEFAULTS.features.lightbox, ["js", "css"]);
      return configResult(Object.assign({}, resolved.options, {
        assets: { ...context.assets.features?.lightbox, ...resolved.assets }
      }), { selector: dynamicSelector });
    }
  },
  {
    id: "reveal",
    scope: "region",
    kind: "feature",
    entry: runtimeEntry(INTERNAL.assets.runtime.reveal),
    resources: ["runtime.reveal"],
    activation: selector(".slide-up"),
    schema: "features.reveal.enabled",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.reveal.enabled"),
    project(context) {
      if (context.features.reveal?.enabled !== true) return null;
      return configResult(Object.assign({}, context.features.reveal));
    }
  },
  {
    id: "mathjax",
    scope: "region",
    kind: "feature",
    entry: featureEntry("mathjax"),
    resources: [],
    activation: selector(".has-jax, script[type^='math/tex']"),
    schema: "features.math.provider",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.math.provider"),
    project(context) {
      const provider = context.render.math || context.features.math?.provider;
      if (provider !== "mathjax") return null;
      const resolved = splitResources(context.features.math?.mathjax, CONFIG_DEFAULTS.features.math.mathjax, ["js"]);
      return configResult({
        options: resolved.options,
        asset: resolved.assets.js
      });
    }
  },
  {
    id: "katex-stylesheet",
    scope: "document",
    kind: "component",
    entry: { type: "template", path: "layout/_partial/scripts/runtime.ejs" },
    resources: [],
    activation: { type: "server", value: "render.math or features.math.provider is katex" },
    schema: "features.math.provider",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST],
    defaultsOwner: CONFIG_OWNER("features.math.provider"),
    project: null
  },
  {
    id: "diagrams",
    scope: "region",
    kind: "feature",
    entry: featureEntry("diagrams"),
    resources: [],
    activation: selector(".mermaid"),
    schema: "features.diagrams.provider",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.diagrams.provider"),
    project(context) {
      const override = context.render.diagrams;
      const provider = override === false
        ? null
        : typeof override === "string"
          ? override
          : (override && typeof override === "object" ? "mermaid" : context.features.diagrams?.provider);
      if (provider !== "mermaid") return null;
      const options = override && typeof override === "object" ? override : {};
      const resolved = splitResources(context.features.diagrams?.mermaid, CONFIG_DEFAULTS.features.diagrams.mermaid, ["js"]);
      const content = splitResources(options, {}, ["js"]).options;
      return configResult(Object.assign({}, resolved.options, content, {
        provider,
        assets: resolved.assets,
        colorScheme: context.colorScheme || "auto"
      }));
    }
  },
  {
    id: "code-copy",
    scope: "region",
    kind: "feature",
    entry: featureEntry("code-copy"),
    resources: ["features.codeCopy"],
    activation: selector(".code"),
    schema: null,
    i18n: {
      namespace: "copy-code",
      keys: ["btn.copy", "message.copied", "message.copy_denied", "message.copy_unsupported"]
    },
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: null,
    project: context => configResult({
      assets: context.assets.features?.codeCopy || {},
      messages: context.plainObject(context.messages.copy, "messages.copy")
    })
  },
  {
    id: "adaptive-text",
    scope: "region",
    kind: "feature",
    entry: featureEntry("adaptive-text"),
    resources: ["features.adaptiveText"],
    activation: selector("[data-text-adaptive]"),
    schema: null,
    i18n: null,
    docs: { category: "Components", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: null,
    project: context => configResult({ assets: context.assets.features?.adaptiveText || {} })
  },
  {
    id: "card-hover",
    scope: "region",
    kind: "feature",
    entry: runtimeEntry("/js/runtime/extensions/card-hover.js"),
    resources: ["features.cardHover"],
    activation: selector(".card-hover"),
    schema: "features.card_hover.spotlight",
    i18n: null,
    docs: { category: "Components", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.card_hover.spotlight"),
    project(context) {
      const { spotlight = false, tilt = false } = context.features.cardHover || {};
      if (!spotlight && !tilt) return null;
      return configResult({ spotlight, tilt, assets: context.assets.features?.cardHover || {} });
    }
  },
  {
    id: "heti",
    scope: "region",
    kind: "feature",
    entry: featureEntry("heti"),
    resources: [],
    activation: selector(".heti"),
    schema: "features.heti.enabled",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.heti.enabled"),
    project(context) {
      if (context.features.heti?.enabled !== true) return null;
      return configResult({ assets: splitResources(context.features.heti, CONFIG_DEFAULTS.features.heti, ["js", "css"]).assets });
    }
  },
  {
    id: "swiper",
    scope: "region",
    kind: "component",
    entry: featureEntry("swiper"),
    resources: ["features.swiper"],
    activation: selector("#swiper-api"),
    schema: "features.swiper.js",
    i18n: null,
    docs: { category: "Components", path: "docs/knowledge/04-标签插件/timeline-media-tags.md" },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.swiper.js"),
    project: context => configResult({ assets: { ...context.assets.features?.swiper, ...splitResources(context.features.swiper, CONFIG_DEFAULTS.features.swiper, ["js", "css"]).assets } })
  }
]);

function activationWhen(activation) {
  if (activation.type === "always") return { always: true };
  if (activation.type === "selector") return { selector: activation.value };
  throw new TypeError(`[stellar contributions] ${activation.type} activation cannot be projected to Runtime Manifest`);
}

function buildContributionEntries(context) {
  const entries = [];
  for (const contribution of CONTRIBUTIONS) {
    if (contribution.project === null) continue;
    const projected = contribution.project.call(contribution, context);
    if (projected === null) continue;
    const config = projected.config || {};
    entries.push({
      id: contribution.id,
      module: contribution.entry.path,
      scope: contribution.scope,
      when: projected.when || activationWhen(contribution.activation),
      config
    });
  }
  return entries;
}

function contributionSchemaIds(prefix) {
  const head = `${prefix}.`;
  return [...new Set(CONTRIBUTIONS
    .map(contribution => contribution.schema)
    .filter(schema => typeof schema === "string" && schema.startsWith(head))
    .map(schema => schema.slice(head.length).split(".")[0]))];
}

module.exports = {
  CONTRIBUTIONS,
  buildContributionEntries,
  contributionSchemaIds
};
