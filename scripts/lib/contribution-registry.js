/* global hexo */

"use strict";

const { defineContributions } = require("./contribution-contract");
const INTERNAL = require("./internal-constants");

const FEATURE_ENTRY = "/js/runtime/extensions/feature.mjs";
const PLUGIN_SYSTEM_DOC = "docs/knowledge/07-外部集成/plugin-system.md";
const RUNTIME_TEST = "test/browser-runtime-manifest.test.js";
const RUNTIME_CONSUMPTION_TEST = "test/browser-runtime-consumption.test.js";
const CONFIG_OWNER = path => `_config.yml#${path}`;

function featureEntry() {
  return { type: "browser-module", path: FEATURE_ENTRY, adapter: "feature" };
}

function runtimeEntry(path, adapter) {
  return { type: "browser-module", path, ...(adapter ? { adapter } : {}) };
}

function selector(value) {
  return { type: "selector", value };
}

function configResult(config, when) {
  return { config, ...(when ? { when } : {}) };
}

const CONTRIBUTIONS = defineContributions([
  {
    id: "runtime-bootstrap",
    kind: "component",
    entry: { type: "template", path: "layout/_partial/scripts/runtime.ejs" },
    resources: ["runtime.bootstrap"],
    activation: { type: "always" },
    schema: null,
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: null,
    project: null
  },
  {
    id: "color-scheme-switch",
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
    tests: ["test/color-scheme-switch.test.js", RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
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
    kind: "extension",
    entry: runtimeEntry("/js/runtime/extensions/search.mjs"),
    resources: ["search"],
    activation: selector(".search-input"),
    schema: "search.provider",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST],
    defaultsOwner: CONFIG_OWNER("search.provider"),
    project(context) {
      const search = context.plainObject(context.extensions.search, "extensions.search");
      if (typeof search.provider !== "string" || search.provider.length === 0) return null;
      const provider = context.plainObject(search[search.provider], `search.${search.provider}`);
      return configResult({
        provider: search.provider,
        options: provider,
        assets: {
          client: search.provider === "algolia" ? context.assets.search?.algolia || null : null,
          provider: context.assets.search?.providers?.[search.provider] || null,
          shortcut: context.assets.search?.shortcut || null
        }
      });
    }
  },
  {
    id: "lazy-loading",
    kind: "feature",
    entry: featureEntry(),
    resources: ["dependencies.lazyLoading"],
    activation: selector(".lazy, .data-service, [class*='ds-']"),
    schema: "features.lazy_loading.transition",
    i18n: null,
    docs: { category: "Extensions", path: "docs/knowledge/07-外部集成/lazy-loading-images.md" },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.lazy_loading.transition"),
    project: context => configResult({ asset: context.assets.dependencies?.lazyLoading || null })
  },
  {
    id: "deferred-icons",
    kind: "component",
    entry: featureEntry(),
    resources: ["features.deferredIcons"],
    activation: selector("svg.icon[data-icon]"),
    schema: null,
    i18n: null,
    docs: { category: "Components", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: null,
    project: context => configResult({ asset: context.assets.features?.deferredIcons?.js || null })
  },
  {
    id: "dropdown",
    kind: "component",
    entry: featureEntry(),
    resources: ["features.dropdown"],
    activation: selector("details.dropdown"),
    schema: null,
    i18n: null,
    docs: { category: "Components", path: "docs/knowledge/04-标签插件/note-container-tags.md" },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: null,
    project: context => configResult({ asset: context.assets.features?.dropdown?.js || null })
  },
  {
    id: "services",
    kind: "extension",
    entry: runtimeEntry("/js/runtime/extensions/services.mjs"),
    resources: ["services", "dependencies.marked"],
    activation: selector(".data-service, [class*='ds-'], a[cardlink], .site-card [data-siteinfo-api], .voice>audio, .video>video, .chat-file"),
    schema: "services.site_info.provider",
    i18n: null,
    docs: { category: "Extensions", path: "docs/knowledge/06-数据服务与组件/data-service-apis.md" },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("services.site_info.provider"),
    project(context) {
      const siteInfo = context.resolveServiceProvider(context.extensions.services?.siteInfo);
      return configResult({
        services: context.assets.services || {},
        siteInfoEndpoint: siteInfo?.endpoint || null,
        marked: context.assets.dependencies?.marked || null
      });
    }
  },
  {
    id: "comments",
    kind: "extension",
    entry: runtimeEntry("/js/runtime/extensions/comments.mjs"),
    resources: ["comments"],
    activation: selector("#comments"),
    schema: "comments.provider",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("comments.provider"),
    project(context) {
      if (typeof context.comments.service !== "string" || context.comments.service.length === 0) return null;
      return configResult({
        provider: context.comments.service,
        options: context.comments.options || {},
        pageTitle: context.comments.pageTitle || "",
        assets: context.assets.comments?.[context.comments.service] || {}
      });
    }
  },
  {
    id: "settings",
    kind: "component",
    entry: runtimeEntry(INTERNAL.assets.runtime.settings),
    resources: ["runtime.settings"],
    activation: selector(".settings-page"),
    schema: null,
    i18n: null,
    docs: { category: "Components", path: "docs/knowledge/02-布局系统/sidebar-system.md" },
    tests: ["test/settings.test.js", RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: null,
    project: context => configResult({})
  },
  {
    id: "link-prefetch",
    kind: "feature",
    entry: featureEntry(),
    resources: ["features.linkPrefetch"],
    activation: { type: "always" },
    schema: "features.link_prefetch.enabled",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.link_prefetch.enabled"),
    project(context) {
      if (context.features.linkPrefetch?.enabled !== true) return null;
      return configResult({ asset: context.assets.features?.linkPrefetch || null });
    }
  },
  {
    id: "lightbox",
    kind: "feature",
    entry: featureEntry(),
    resources: ["features.lightbox"],
    activation: selector("[data-fancybox]:not(.error), .with-fancybox, .ds-memos"),
    schema: "features.lightbox.enabled",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST],
    defaultsOwner: CONFIG_OWNER("features.lightbox.enabled"),
    project(context) {
      if (context.features.lightbox?.enabled !== true) return null;
      const dynamicSelector = [this.activation.value, context.features.lightbox?.selector].filter(Boolean).join(", ");
      return configResult(Object.assign({}, context.features.lightbox, {
        assets: context.assets.features?.lightbox || {}
      }), { selector: dynamicSelector });
    }
  },
  {
    id: "reveal",
    kind: "feature",
    entry: runtimeEntry(INTERNAL.assets.runtime.reveal),
    resources: ["runtime.reveal"],
    activation: selector(".slide-up"),
    schema: "features.reveal.enabled",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: ["test/reveal.test.js", RUNTIME_TEST, RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.reveal.enabled"),
    project(context) {
      if (context.features.reveal?.enabled !== true) return null;
      return configResult(Object.assign({}, context.features.reveal));
    }
  },
  {
    id: "mathjax",
    kind: "feature",
    entry: featureEntry(),
    resources: ["features.mathjax"],
    activation: selector(".has-jax, script[type^='math/tex']"),
    schema: "features.math.provider",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST],
    defaultsOwner: CONFIG_OWNER("features.math.provider"),
    project(context) {
      const provider = context.render.math || context.features.math?.provider;
      if (provider !== "mathjax") return null;
      return configResult({
        options: context.features.math?.mathjax || {},
        asset: context.assets.features?.mathjax || null
      });
    }
  },
  {
    id: "katex-stylesheet",
    kind: "component",
    entry: { type: "template", path: "layout/_partial/scripts/runtime.ejs" },
    resources: ["features.katexCss"],
    activation: { type: "server", value: "render.math or features.math.provider is katex" },
    schema: "features.math.provider",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.math.provider"),
    project: null
  },
  {
    id: "diagrams",
    kind: "feature",
    entry: featureEntry(),
    resources: ["features.diagrams"],
    activation: selector(".mermaid"),
    schema: "features.diagrams.provider",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST],
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
      return configResult(Object.assign({}, context.features.diagrams?.mermaid, options, {
        provider,
        assets: context.assets.features?.diagrams || {},
        colorScheme: context.colorScheme || "auto"
      }));
    }
  },
  {
    id: "code-copy",
    kind: "feature",
    entry: featureEntry(),
    resources: ["features.codeCopy"],
    activation: selector(".code"),
    schema: null,
    i18n: {
      namespace: "copy-code",
      keys: ["btn.copy", "message.copied", "message.copy_denied", "message.copy_unsupported"]
    },
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_TEST],
    defaultsOwner: null,
    project: context => configResult({
      assets: context.assets.features?.codeCopy || {},
      messages: context.plainObject(context.messages.copy, "messages.copy")
    })
  },
  {
    id: "adaptive-text",
    kind: "feature",
    entry: featureEntry(),
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
    kind: "feature",
    entry: runtimeEntry("/js/runtime/extensions/card-hover.mjs"),
    resources: ["features.cardHover"],
    activation: selector(".card-hover"),
    schema: "features.card_hover.enabled",
    i18n: null,
    docs: { category: "Components", path: PLUGIN_SYSTEM_DOC },
    tests: ["test/card_hover_client.test.js", RUNTIME_TEST],
    defaultsOwner: CONFIG_OWNER("features.card_hover.enabled"),
    project(context) {
      if (context.features.cardHover?.enabled !== true) return null;
      return configResult({ assets: context.assets.features?.cardHover || {} });
    }
  },
  {
    id: "heti",
    kind: "feature",
    entry: featureEntry(),
    resources: ["features.heti"],
    activation: selector(".heti"),
    schema: "features.heti.enabled",
    i18n: null,
    docs: { category: "Extensions", path: PLUGIN_SYSTEM_DOC },
    tests: [RUNTIME_CONSUMPTION_TEST],
    defaultsOwner: CONFIG_OWNER("features.heti.enabled"),
    project(context) {
      if (context.features.heti?.enabled !== true) return null;
      return configResult({ assets: context.assets.features?.heti || {} });
    }
  },
  {
    id: "swiper",
    kind: "component",
    entry: featureEntry(),
    resources: ["features.swiper"],
    activation: selector("#swiper-api"),
    schema: null,
    i18n: null,
    docs: { category: "Components", path: "docs/knowledge/04-标签插件/timeline-media-tags.md" },
    tests: [RUNTIME_TEST],
    defaultsOwner: null,
    project: context => configResult({ assets: context.assets.features?.swiper || {} })
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
    const config = contribution.kind === "feature" || contribution.entry.adapter === "feature"
      ? Object.assign({ feature: contribution.id }, projected.config || {})
      : (projected.config || {});
    entries.push({
      id: contribution.id,
      module: contribution.entry.path,
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
