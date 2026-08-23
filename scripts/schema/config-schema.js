/* global hexo */
"use strict";

const { deepFreeze } = require("./schema-utils");
const {
  CONFIG_TARGET_FIELDS,
  PROFILE_ID_MIGRATIONS,
  PROFILE_IDS
} = require("./config-target");

function literal(value) {
  return { kind: "literal", value };
}

function structuralOptions(options) {
  const result = {};
  for (const key of [
    "items",
    "values",
    "properties",
    "additionalProperties",
    "additionalPropertyKey",
    "allowedPropertyKeys",
    "minimum",
    "maximum",
    "exclusiveMinimum",
    "externalProperties",
    "removedProperties",
    "requiredProperties",
    "sealed"
  ]) {
    if (options[key] !== undefined) result[key] = options[key];
  }
  return result;
}

function field(type, options) {
  return {
    type: Array.isArray(type) ? type : [type],
    default: options.default,
    scope: options.scope,
    cascade: options.cascade,
    normalizer: options.normalizer,
    normalization: options.normalization,
    consumers: options.consumers,
    example: options.example,
    migration: options.migration,
    runtimeKey: options.runtimeKey,
    validator: options.validator,
    ...structuralOptions(options)
  };
}

function deliveredField(path, options) {
  const target = CONFIG_TARGET_FIELDS.find(item => item.path === path && item.scopes.includes("theme"));
  if (!target || target.status !== "delivered") {
    throw new Error(`配置目标 ${path} 尚未交付`);
  }
  return field(target.type, {
    ...options,
    default: target.default,
    scope: target.scopes[0],
    cascade: target.cascade,
    normalizer: options.normalizer,
    normalization: target.normalization,
    consumers: target.consumers,
    example: options.example,
    migration: target.migration,
    runtimeKey: target.runtimePath.split(".").pop(),
    items: options.items ?? target.items,
    values: target.values,
    minimum: target.minimum,
    maximum: target.maximum,
    exclusiveMinimum: target.exclusiveMinimum
  });
}

function object(options) {
  return {
    type: ["object"],
    default: literal({}),
    scope: "theme",
    cascade: ["schema default", "_config.stellar.yml"],
    normalizer: "object",
    normalization: "merge declared child fields; deep-freeze the normalized JavaScript object",
    sealed: true,
    ...options
  };
}

const SEO_CONSUMERS = Object.freeze([
  "Post PageViewModel",
  "head renderer",
  "JSON-LD helper",
  "browser canonical check",
  "Reference generator"
]);
const SITE_CONSUMERS = Object.freeze([
  "PageViewModel",
  "Shell renderer",
  "menu renderer",
  "footer renderer",
  "Reference generator"
]);
const LAYOUT_CONSUMERS = Object.freeze([
  "CollectionModel",
  "PageViewModel",
  "page generators",
  "navigation renderer",
  "sidebar renderer",
  "Reference generator"
]);
const PRECONNECT_CONSUMERS = Object.freeze(["head renderer", "Reference generator"]);
const INJECT_CONSUMERS = Object.freeze(["head renderer", "script renderer", "Reference generator"]);
const CONTENT_CONSUMERS = Object.freeze([
  "CollectionModel",
  "PageViewModel",
  "article renderer",
  "listing renderer",
  "Reference generator"
]);
const APPEARANCE_CONSUMERS = Object.freeze([
  "PageViewModel",
  "layout renderer",
  "Stylus compiler",
  "browser theme state",
  "Reference generator"
]);
const RESOURCE_CONSUMERS = Object.freeze([
  "PageViewModel",
  "tag renderers",
  "image fallback filters",
  "error renderer",
  "Reference generator"
]);
const EXTENSION_CONSUMERS = Object.freeze([
  "Extension registry",
  "Extension renderer",
  "browser Extension runtime",
  "Reference generator"
]);

const AI_LABEL_DEFAULTS = Object.freeze({
  manual: { color: "#03a9f4", icon: "default:shield-user" },
  reviewed: { color: "#4caf50", icon: "default:shield-check" },
  polished: { color: "#4caf50", icon: "default:shield-up" },
  generated: { color: "#ff9800", icon: "default:shield-warning" }
});

function extensionValue(type, defaultValue, options = {}) {
  const types = Array.isArray(type) ? type : [type];
  const normalizer = options.normalizer || (types.includes("array") ? "array" : (types.includes("object") ? "object" : "identity"));
  return field(type, {
    default: literal(defaultValue),
    scope: "theme",
    cascade: ["schema default", "_config.stellar.yml"],
    normalizer,
    normalization: options.normalization || "validate the declared type; preserve the value; deep-freeze the result",
    consumers: EXTENSION_CONSUMERS,
    example: options.example ?? defaultValue,
    migration: options.migration || "configuration/extensions",
    runtimeKey: options.runtimeKey,
    ...options
  });
}

function extensionObject(properties, defaultValue = {}, options = {}) {
  const runtimeProperties = Object.fromEntries(Object.entries(properties).map(([key, definition]) => [
    key,
    definition.runtimeKey ? definition : {
      ...definition,
      runtimeKey: key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    }
  ]));
  return object({
    default: literal(defaultValue),
    consumers: EXTENSION_CONSUMERS,
    example: options.example ?? defaultValue,
    migration: options.migration || "configuration/extensions",
    runtimeKey: options.runtimeKey,
    properties: runtimeProperties,
    ...options
  });
}

function parameterBag(defaultValue = {}, options = {}) {
  return extensionValue("object", defaultValue, {
    normalizer: "parameter_bag",
    sealed: false,
    ...options
  });
}

function tagExtensionSchemas() {
  const quotVariant = extensionObject({
    prefix: extensionValue(["string", "null"], null),
    suffix: extensionValue(["string", "null"], null)
  });
  const okrStatus = extensionObject({
    color: extensionValue("string", ""),
    label: extensionValue("string", "")
  });
  return {
    note: extensionObject({
      default_color: extensionValue("string", ""),
      border: extensionValue("boolean", true)
    }, { default_color: "", border: true }),
    checkbox: extensionObject({ interactive: extensionValue("boolean", false) }, { interactive: false }),
    quot: extensionObject({}, {
      default: { prefix: "quot:quote-left", suffix: "quot:quote-right" },
      hashtag: { prefix: "quot:hashtag", suffix: null },
      question: { prefix: "quot:question", suffix: null }
    }, {
      sealed: false,
      additionalPropertyKey: "<variant>",
      additionalProperties: quotVariant
    }),
    emoji: extensionObject({}, {
      default: "https://gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/qq/{name}.gif",
      twemoji: "https://gcore.jsdelivr.net/gh/twitter/twemoji/assets/svg/{name}.svg",
      qq: "https://gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/qq/{name}.gif",
      aru: "https://gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/aru/{name}.gif",
      tieba: "https://gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/tieba/{name}.png",
      blobcat: "https://gcore.jsdelivr.net/gh/cdn-x/emoticons@3.1/blobcat/{name}.gif"
    }, {
      sealed: false,
      additionalPropertyKey: "<provider>",
      additionalProperties: extensionValue("string", "")
    }),
    icon: extensionObject({ default_color: extensionValue(["string", "null"], "accent") }, { default_color: "accent" }),
    button: extensionObject({ default_color: extensionValue(["string", "null"], "theme") }, { default_color: "theme" }),
    image: extensionObject({ parse_markdown: extensionValue("boolean", false) }, { parse_markdown: false }),
    copy: extensionObject({ toast: extensionValue("string", "复制成功") }, { toast: "复制成功" }),
    timeline: extensionObject({ max_height: extensionValue("string", "80vh") }, { max_height: "80vh" }, {
      removedProperties: { "max-height": "max_height" }
    }),
    mark: extensionObject({ default_color: extensionValue("string", "yellow") }, { default_color: "yellow" }),
    hashtag: extensionObject({ default_color: extensionValue(["string", "null"], null) }, { default_color: null }),
    okr: extensionObject({
      border: extensionValue("boolean", true),
      status: extensionObject({}, {
        in_track: { color: "blue", label: "正常" },
        at_risk: { color: "yellow", label: "风险" },
        off_track: { color: "orange", label: "延期" },
        finished: { color: "green", label: "已完成" },
        unfinished: { color: "red", label: "未完成" }
      }, {
        sealed: false,
        additionalPropertyKey: "<status>",
        additionalProperties: okrStatus
      })
    }, {
      border: true,
      status: {
        in_track: { color: "blue", label: "正常" },
        at_risk: { color: "yellow", label: "风险" },
        off_track: { color: "orange", label: "延期" },
        finished: { color: "green", label: "已完成" },
        unfinished: { color: "red", label: "未完成" }
      }
    }),
    gallery: extensionObject({
      layout: extensionValue("string", "grid", { values: ["grid", "flow"] }),
      size: extensionValue("string", "mix", { values: ["s", "m", "l", "xl", "mix"] }),
      ratio: extensionValue("string", "square", { values: ["origin", "square"] })
    }, { layout: "grid", size: "mix", ratio: "square" }),
    chat: extensionObject({ endpoint: extensionValue(["string", "null"], "https://siteinfo.listentothewind.cn/api/v1") }, {
      endpoint: "https://siteinfo.listentothewind.cn/api/v1"
    }, { removedProperties: { api: "endpoint" } })
  };
}

function featureExtensionSchemas() {
  return {
    lazy_loading: extensionObject({
      transition: extensionValue("string", "fade", { values: ["blur", "fade"] }),
      fix_ratio: extensionValue("boolean", true)
    }, { transition: "fade", fix_ratio: true }),
    preload: extensionObject({
      enabled: extensionValue("boolean", true),
      provider: extensionValue("string", "flying_pages", { values: ["flying_pages"] })
    }, { enabled: true, provider: "flying_pages" }, { removedProperties: { enable: "enabled", service: "provider", flying_pages: "internalized" } }),
    lightbox: extensionObject({
      enabled: extensionValue("boolean", true),
      provider: deliveredField("extensions.features.lightbox.provider", { normalizer: "identity", example: "fancybox" }),
      mode: extensionValue("string", "auto", { values: ["auto", "global"] }),
      selector: extensionValue("string", ".timenode p>img")
    }, { enabled: true, provider: "fancybox", mode: "auto", selector: ".timenode p>img" }, { removedProperties: { enable: "enabled", js: "internalized", css: "internalized" } }),
    reveal: extensionObject({
      enabled: extensionValue("boolean", true),
      provider: deliveredField("extensions.features.reveal.provider", { normalizer: "identity", example: "scrollreveal" }),
      distance: extensionValue("string", "8px"),
      duration: extensionValue("number", 1000, { minimum: 0 }),
      interval: extensionValue("number", 100, { minimum: 0 }),
      scale: extensionValue("number", 1, { minimum: 0, maximum: 1 })
    }, { enabled: true, provider: "scrollreveal", distance: "8px", duration: 1000, interval: 100, scale: 1 }, { removedProperties: { enable: "enabled", js: "internalized" } }),
    ai_summary: extensionObject({
      enabled: extensionValue("boolean", false),
      provider: deliveredField("extensions.features.ai_summary.provider", { normalizer: "identity", example: "tianli_gpt" }),
      scope: extensionValue("string", "post", { values: ["all", "post", "wiki", "topic"] }),
      key: extensionValue("string", "5Q5mpqRK5DkwT1X9Gi5e"),
      max_length: extensionValue("number", 1000, { minimum: 0, maximum: 5000 }),
      typewriter: extensionValue("boolean", true),
      show_immediately: extensionValue("boolean", true),
      recommendation: extensionValue("string", "all", { values: ["all", "web"] }),
      hide_shuttle: extensionValue("boolean", true),
      summary_toggle: extensionValue("boolean", false),
      interface: extensionObject({
        name: extensionValue("string", "AI摘要"),
        introduce: extensionValue("string", "我是文章辅助AI: QX-AI，点击下方的按钮，让我生成本文简介、推荐相关文章等。"),
        version: extensionValue("string", "TianliGPT"),
        buttons: extensionValue("array", ["介绍自己", "推荐文章", "生成摘要", "矩阵穿梭"], { items: { type: ["string"] } })
      }, {
        name: "AI摘要",
        introduce: "我是文章辅助AI: QX-AI，点击下方的按钮，让我生成本文简介、推荐相关文章等。",
        version: "TianliGPT",
        buttons: ["介绍自己", "推荐文章", "生成摘要", "矩阵穿梭"]
      }, { removedProperties: { button: "buttons" } })
    }, {
      enabled: false,
      provider: "tianli_gpt",
      scope: "post",
      key: "5Q5mpqRK5DkwT1X9Gi5e",
      max_length: 1000,
      typewriter: true,
      show_immediately: true,
      recommendation: "all",
      hide_shuttle: true,
      summary_toggle: false,
      interface: {
        name: "AI摘要",
        introduce: "我是文章辅助AI: QX-AI，点击下方的按钮，让我生成本文简介、推荐相关文章等。",
        version: "TianliGPT",
        buttons: ["介绍自己", "推荐文章", "生成摘要", "矩阵穿梭"]
      }
    }, { removedProperties: { enable: "enabled", js: "internalized", field: "scope", total_length: "max_length", summary_directly: "show_immediately", rec_method: "recommendation" } }),
    math: extensionObject({
      provider: deliveredField("extensions.features.math.provider", { normalizer: "identity", example: null }),
      providers: extensionObject({
        katex: parameterBag({}, { removedProperties: { js: "internalized", css: "internalized", inject: "internalized" } }),
        mathjax: parameterBag({ v3: false }, { removedProperties: { js: "internalized", css: "internalized", inject: "internalized" } })
      }, { katex: {}, mathjax: { v3: false } })
    }, { provider: null, providers: { katex: {}, mathjax: { v3: false } } }, { removedProperties: { katex: "provider", mathjax: "provider" } }),
    diagrams: extensionObject({
      enabled: extensionValue("boolean", false),
      provider: deliveredField("extensions.features.diagrams.provider", { normalizer: "identity", example: "mermaid" }),
      style_optimization: extensionValue("boolean", false),
      theme: extensionValue("string", "neutral", { values: ["default", "dark", "forest", "neutral"] })
    }, { enabled: false, provider: "mermaid", style_optimization: false, theme: "neutral" }, { removedProperties: { enable: "enabled", js: "internalized" } }),
    code_copy: extensionObject({
      enabled: extensionValue("boolean", true),
      idle_text: extensionValue("string", "Copy"),
      success_text: extensionValue("string", "Copied"),
      toast: extensionValue("string", "复制成功")
    }, { enabled: true, idle_text: "Copy", success_text: "Copied", toast: "复制成功" }, { removedProperties: { enable: "enabled", default_text: "idle_text" } }),
    adaptive_text: extensionObject({ enabled: extensionValue("boolean", true) }, { enabled: true }, { removedProperties: { enable: "enabled" } }),
    card_hover: extensionObject({
      enabled: extensionValue("boolean", false),
      spotlight_color: extensionValue("string", "rgba(255, 255, 255, 0.25)"),
      max_tilt: extensionValue("number", 3, { minimum: 0, maximum: 8 })
    }, { enabled: false, spotlight_color: "rgba(255, 255, 255, 0.25)", max_tilt: 3 }, { removedProperties: { enable: "enabled" } }),
    cjk_typography: extensionObject({ enabled: extensionValue("boolean", false) }, { enabled: false }, { removedProperties: { enable: "enabled", css: "internalized", js: "internalized" } })
  };
}

function extensionsSchema() {
  const internalAssetKeys = {
    js: "internalized",
    css: "internalized",
    meta_css: "internalized",
    src: "internalized",
    inject: "internalized"
  };
  const providerBag = defaultValue => parameterBag(defaultValue, { removedProperties: internalAssetKeys });
  const commentProvider = deliveredField("extensions.comments.providers.<provider>", {
    normalizer: "parameter_bag",
    example: {},
    sealed: false,
    removedProperties: internalAssetKeys
  });
  return object({
    consumers: EXTENSION_CONSUMERS,
    example: { search: { provider: "local" }, comments: { provider: "giscus" } },
    migration: "configuration/extensions",
    runtimeKey: "extensions",
    properties: {
      search: extensionObject({
        provider: deliveredField("extensions.search.provider", { normalizer: "identity", example: "local" }),
        providers: extensionObject({
          local: extensionObject({
            scope: deliveredField("extensions.search.providers.local.scope", { normalizer: "identity", example: "all" }),
            index_path: deliveredField("extensions.search.providers.local.index_path", { normalizer: "root_relative_path", example: "/search.json" }),
            include_content: deliveredField("extensions.search.providers.local.include_content", { normalizer: "identity", example: true }),
            lazy: deliveredField("extensions.search.providers.local.lazy", { normalizer: "identity", example: true }),
            cache_ttl: deliveredField("extensions.search.providers.local.cache_ttl", { normalizer: "identity", example: 86400, minimum: 0 }),
            exclude: deliveredField("extensions.search.providers.local.exclude", { normalizer: "array", example: [] })
          }, { scope: "all", index_path: "/search.json", include_content: true, lazy: true, cache_ttl: 86400, exclude: [] }, {
            removedProperties: { field: "scope", path: "index_path", content: "include_content", lazy_load: "lazy", skip_search: "exclude" }
          }),
          algolia: deliveredField("extensions.search.providers.algolia", {
            normalizer: "parameter_bag",
            example: { appId: "", apiKey: "", indexName: "" },
            sealed: false,
            removedProperties: internalAssetKeys,
            default: literal({ appId: null, apiKey: null, indexName: null })
          })
        }, { local: { scope: "all", index_path: "/search.json", include_content: true, lazy: true, cache_ttl: 86400, exclude: [] }, algolia: { appId: null, apiKey: null, indexName: null } })
      }, {}, { removedProperties: { service: "provider", local_search: "providers.local", algolia_search: "providers.algolia" } }),
      comments: extensionObject({
        provider: deliveredField("extensions.comments.provider", { normalizer: "identity", example: null }),
        title: deliveredField("extensions.comments.title", { normalizer: "identity", example: "快来参与讨论吧~" }),
        providers: extensionObject({
          beaudar: providerBag({ repo: "xxx/xxx", "issue-term": "pathname", "issue-number": null, theme: "preferred-color-scheme", label: null, "input-position": "top", "comment-order": "desc", "keep-theme": null, loading: false, branch: "main" }),
          utterances: providerBag({ repo: "xxx/xxx", "issue-term": "pathname", "issue-number": null, theme: "preferred-color-scheme", label: null }),
          giscus: providerBag({ "data-repo": "xxx/xxx", "data-repo-id": null, "data-category": null, "data-category-id": null, "data-mapping": "pathname", "data-strict": 0, "data-reactions-enabled": 1, "data-emit-metadata": 0, "data-input-position": "top", "data-theme": "preferred_color_scheme", "data-lang": "zh-CN", "data-loading": null, crossorigin: "anonymous" }),
          twikoo: providerBag({ envId: "https://xxx" }),
          waline: providerBag({ serverURL: "https://waline.vercel.app", commentCount: true, pageview: false }),
          artalk: providerBag({ server: null, site: "", darkMode: "auto", imageUploader: null })
        }, {}, {
          sealed: false,
          additionalPropertyKey: "<provider>",
          additionalProperties: commentProvider
        })
      }, {}, { removedProperties: { service: "provider", comment_title: "title", custom_css: "removed" } }),
      tags: extensionObject(tagExtensionSchemas(), {}),
      features: extensionObject(featureExtensionSchemas(), {}),
      services: extensionObject({
        site_info: extensionObject({ endpoint: deliveredField("extensions.services.site_info.endpoint", { normalizer: "identity", example: null }) }, { endpoint: null }, { removedProperties: { api: "endpoint" } }),
        rating: extensionObject({ endpoint: deliveredField("extensions.services.rating.endpoint", { normalizer: "identity", example: "https://star-vote.xaox.cc/api/rating" }) }, { endpoint: "https://star-vote.xaox.cc/api/rating" }, { removedProperties: { api: "endpoint" } }),
        vote: extensionObject({ endpoint: deliveredField("extensions.services.vote.endpoint", { normalizer: "identity", example: "https://star-vote.xaox.cc/api/vote" }) }, { endpoint: "https://star-vote.xaox.cc/api/vote" }, { removedProperties: { api: "endpoint" } }),
        contributors: extensionObject({
          edit_page: deliveredField("extensions.services.contributors.edit_page", {
            normalizer: "object",
            example: { "wiki/stellar/": "https://github.com/xaoxuu/hexo-theme-stellar-docs/blob/main/" },
            sealed: false,
            additionalPropertyKey: "<prefix>",
            additionalProperties: deliveredField("extensions.services.contributors.edit_page.<prefix>", { normalizer: "identity", example: "https://github.com/example/repo/blob/main/" })
          })
        }, { edit_page: { "_posts/": null, "wiki/stellar/": "https://github.com/xaoxuu/hexo-theme-stellar-docs/blob/main/" } }, { removedProperties: { edit_this_page: "edit_page", js: "internalized" } }),
        github: extensionObject({
          api_url: deliveredField("extensions.services.github.api_url", { normalizer: "identity", validator: "absolute_http_url", example: "https://api.github.com" }),
          raw_url: deliveredField("extensions.services.github.raw_url", { normalizer: "identity", validator: "absolute_http_url", example: "https://raw.githubusercontent.com" }),
          gist_url: deliveredField("extensions.services.github.gist_url", { normalizer: "identity", validator: "absolute_http_url", example: "https://gist.github.com" }),
          card_url: deliveredField("extensions.services.github.card_url", { normalizer: "identity", validator: "absolute_http_url", example: "https://github-readme-stats.vercel.app" })
        }, { api_url: "https://api.github.com", raw_url: "https://raw.githubusercontent.com", gist_url: "https://gist.github.com", card_url: "https://github-readme-stats.vercel.app" })
      }, {}),
      cache: extensionObject({
        enabled: deliveredField("extensions.cache.enabled", { normalizer: "identity", example: true }),
        default_ttl: deliveredField("extensions.cache.default_ttl", { normalizer: "identity", example: 3600, minimum: 0 }),
        ttl: deliveredField("extensions.cache.ttl", {
          normalizer: "object",
          example: { giscus: 600 },
          sealed: false,
          additionalPropertyKey: "<service>",
          additionalProperties: deliveredField("extensions.cache.ttl.<service>", { normalizer: "identity", example: 600, minimum: 0 })
        }),
        max_entries: deliveredField("extensions.cache.max_entries", { normalizer: "identity", example: 200, minimum: 0 })
      }, { enabled: true, default_ttl: 3600, ttl: { giscus: 600, waline: 600, artalk: 600, memos: 600, "memos-user": 86400, sites: 86400, friends: 86400, friends_and_posts: 86400, siteinfo: 86400 }, max_entries: 200 }, { removedProperties: { enable: "enabled" } })
    }
  });
}

function aiLabelLevelSchema() {
  return object({
    consumers: CONTENT_CONSUMERS,
    example: { color: "#03a9f4", icon: "default:shield-user" },
    migration: "configuration/content",
    runtimeKey: "<level>",
    properties: {
      color: deliveredField("content.article.ai_label.<level>.color", {
        normalizer: "identity",
        example: "#03a9f4"
      }),
      icon: deliveredField("content.article.ai_label.<level>.icon", {
        normalizer: "identity",
        example: "default:shield-user"
      })
    }
  });
}

function runtimeProfileKey(profile) {
  return profile.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function layoutProfileSchema(profile) {
  const base = `layout.profiles.${profile}`;
  const removedProperties = { base_dir: "path" };
  if (profile === "error") removedProperties["404"] = "path";

  const properties = {
    path: deliveredField(`${base}.path`, {
      normalizer: "root_relative_path",
      example: profile === "error" ? "/404.html" : "/blog/"
    }),
    navigation: object({
      consumers: LAYOUT_CONSUMERS,
      example: { active_menu: "post", tabs: {} },
      migration: "configuration/layout",
      runtimeKey: "navigation",
      removedProperties: { menu: "active_menu" },
      properties: {
        active_menu: deliveredField(`${base}.navigation.active_menu`, {
          normalizer: "identity",
          example: "post"
        }),
        tabs: deliveredField(`${base}.navigation.tabs`, {
          normalizer: "object",
          example: { "朋友文章": "/friends/rss/" },
          sealed: false,
          additionalPropertyKey: "<title>",
          additionalProperties: deliveredField(`${base}.navigation.tabs.<title>`, {
            normalizer: "identity",
            example: "/friends/rss/"
          })
        })
      }
    }),
    sidebar: object({
      consumers: LAYOUT_CONSUMERS,
      example: { left: { widgets: ["recent"] }, right: { widgets: ["toc"] } },
      migration: "configuration/layout",
      runtimeKey: "sidebar",
      properties: {
        left: object({
          consumers: LAYOUT_CONSUMERS,
          example: { widgets: ["recent"] },
          migration: "configuration/layout",
          runtimeKey: "left",
          properties: {
            widgets: deliveredField(`${base}.sidebar.left.widgets`, {
              normalizer: "array",
              example: ["recent"]
            })
          }
        }),
        right: object({
          consumers: LAYOUT_CONSUMERS,
          example: { widgets: ["toc"] },
          migration: "configuration/layout",
          runtimeKey: "right",
          properties: {
            widgets: deliveredField(`${base}.sidebar.right.widgets`, {
              normalizer: "array",
              example: ["toc"]
            })
          }
        })
      }
    })
  };

  if (profile === "home") {
    properties.comments = deliveredField("layout.profiles.home.comments", {
      normalizer: "identity",
      example: { enabled: true, provider: "giscus", options: {} },
      properties: {
        enabled: deliveredField("layout.profiles.home.comments.enabled", {
          normalizer: "identity",
          example: true
        }),
        title: deliveredField("layout.profiles.home.comments.title", {
          normalizer: "identity",
          example: "留言"
        }),
        id: deliveredField("layout.profiles.home.comments.id", {
          normalizer: "identity",
          example: "home"
        }),
        provider: deliveredField("layout.profiles.home.comments.provider", {
          normalizer: "identity",
          example: "giscus"
        }),
        options: deliveredField("layout.profiles.home.comments.options", {
          normalizer: "parameter_bag",
          example: { "data-repo": "owner/repo" },
          sealed: false
        })
      }
    });
  }

  return object({
    consumers: LAYOUT_CONSUMERS,
    example: {},
    migration: "configuration/layout",
    runtimeKey: runtimeProfileKey(profile),
    removedProperties,
    properties
  });
}

function layoutProfilesSchema() {
  const properties = Object.fromEntries(PROFILE_IDS.map(profile => [profile, layoutProfileSchema(profile)]));
  const removedProperties = Object.fromEntries(
    Object.entries(PROFILE_ID_MIGRATIONS).filter(([legacy, target]) => legacy !== target)
  );
  return deliveredField("layout.profiles", {
    normalizer: "object",
    example: { blog_index: { path: "/blog/" } },
    sealed: true,
    removedProperties,
    properties
  });
}

const CONFIG_SCHEMA = deepFreeze({
  type: ["object"],
  scope: "theme",
  sealed: true,
  migration: "configuration/v2",
  removedProperties: {
    brand: "site.brand",
    menubar: "site.menu",
    footer: "site.footer",
    site_tree: "layout.profiles",
    preconnect: "resources.preconnect",
    canonical: "seo.canonical",
    open_graph: "seo.open_graph",
    structured_data: "seo.structured_data",
    article: "content.article",
    notebook: "content.notebook",
    style: "appearance",
    default: "resources.fallbacks",
    search: "extensions.search",
    comments: "extensions.comments",
    tag_plugins: "extensions.tags",
    dependencies: "extensions.features",
    data_services: "extensions.services",
    data_cache: "extensions.cache",
    plugins: "extensions.features",
    api_host: "extensions.services.github"
  },
  properties: {
    site: object({
      consumers: SITE_CONSUMERS,
      example: {
        brand: { name: "Stellar", tagline: "每个人的独立博客", url: "/" },
        menu: { items: [{ id: "post", title: "博客", icon: "default:documents", url: "/", accent: "#1BCDFC" }] },
        footer: {
          actions: {},
          sections: [],
          content: "本站由 [{author.name}](/) 使用 [{theme.name} {theme.version}]({theme.tree}) 主题创建。"
        }
      },
      migration: "configuration/site",
      runtimeKey: "site",
      properties: {
        brand: object({
          consumers: SITE_CONSUMERS,
          example: {
            image: { src: "/avatar.webp", variant: "avatar", url: "/about/" },
            name: "Stellar",
            tagline: "每个人的独立博客",
            url: "/"
          },
          migration: "configuration/site",
          runtimeKey: "brand",
          properties: {
            image: object({
              consumers: SITE_CONSUMERS,
              example: { src: "/avatar.webp", variant: "avatar", url: "/about/" },
              migration: "configuration/site",
              runtimeKey: "image",
              removedProperties: { style: "variant" },
              properties: {
                src: deliveredField("site.brand.image.src", { normalizer: "identity", example: "/avatar.webp" }),
                variant: deliveredField("site.brand.image.variant", { normalizer: "identity", example: "avatar" }),
                url: deliveredField("site.brand.image.url", { normalizer: "identity", example: "/about/" }),
                background: deliveredField("site.brand.image.background", { normalizer: "identity", example: "var(--block)" })
              }
            }),
            name: deliveredField("site.brand.name", { normalizer: "identity", example: "Stellar" }),
            tagline: deliveredField("site.brand.tagline", { normalizer: "identity", example: "每个人的独立博客" }),
            url: deliveredField("site.brand.url", { normalizer: "identity", example: "/" })
          }
        }),
        menu: object({
          consumers: SITE_CONSUMERS,
          example: { items: [{ id: "post", title: "博客", icon: "default:documents", url: "/", accent: "#1BCDFC" }] },
          migration: "configuration/site",
          runtimeKey: "menu",
          properties: {
            items: deliveredField("site.menu.items", {
              normalizer: "array",
              example: [{ id: "post", title: "博客", icon: "default:documents", url: "/", accent: "#1BCDFC" }],
              items: object({
                consumers: SITE_CONSUMERS,
                example: { id: "post", title: "博客", icon: "default:documents", url: "/", accent: "#1BCDFC" },
                migration: "configuration/site",
                removedProperties: { theme: "accent" },
                properties: {
                  id: deliveredField("site.menu.items[].id", { normalizer: "identity", example: "post" }),
                  title: deliveredField("site.menu.items[].title", { normalizer: "identity", example: "博客" }),
                  icon: deliveredField("site.menu.items[].icon", { normalizer: "identity", example: "default:documents" }),
                  url: deliveredField("site.menu.items[].url", { normalizer: "identity", example: "/" }),
                  accent: deliveredField("site.menu.items[].accent", { normalizer: "identity", example: "#1BCDFC" })
                }
              })
            })
          }
        }),
        footer: object({
          consumers: SITE_CONSUMERS,
          example: { actions: {}, sections: [], content: "" },
          migration: "configuration/site",
          runtimeKey: "footer",
          removedProperties: { social: "actions", sitemap: "sections" },
          properties: {
            actions: deliveredField("site.footer.actions", {
              normalizer: "object",
              example: { github: { icon: "default:github", title: "GitHub", url: "https://github.com/" } },
              sealed: false,
              additionalPropertyKey: "<id>",
              additionalProperties: deliveredField("site.footer.actions.<id>", {
                normalizer: "object",
                example: { icon: "default:github", title: "GitHub", url: "https://github.com/" },
                sealed: true,
                properties: {
                  variant: deliveredField("site.footer.actions.<id>.variant", { normalizer: "identity", example: "dropdown" }),
                  icon: deliveredField("site.footer.actions.<id>.icon", { normalizer: "identity", example: "default:github" }),
                  title: deliveredField("site.footer.actions.<id>.title", { normalizer: "identity", example: "GitHub" }),
                  url: deliveredField("site.footer.actions.<id>.url", { normalizer: "identity", example: "https://github.com/" }),
                  action: deliveredField("site.footer.actions.<id>.action", { normalizer: "trusted_text", example: "window.example()" }),
                  items: deliveredField("site.footer.actions.<id>.items", {
                    normalizer: "array",
                    example: [{ icon: "default:github", title: "GitHub", url: "https://github.com/" }],
                    items: object({
                      consumers: SITE_CONSUMERS,
                      example: { icon: "default:github", title: "GitHub", url: "https://github.com/" },
                      migration: "configuration/site",
                      properties: {
                        icon: deliveredField("site.footer.actions.<id>.items[].icon", { normalizer: "identity", example: "default:github" }),
                        title: deliveredField("site.footer.actions.<id>.items[].title", { normalizer: "identity", example: "GitHub" }),
                        url: deliveredField("site.footer.actions.<id>.items[].url", { normalizer: "identity", example: "https://github.com/" })
                      }
                    })
                  })
                },
                removedProperties: { type: "variant", onclick: "action" }
              })
            }),
            sections: deliveredField("site.footer.sections", {
              normalizer: "array",
              example: [{ title: "博客", items: ["[归档](/blog/archives/)"] }],
              items: object({
                consumers: SITE_CONSUMERS,
                example: { title: "博客", items: ["[归档](/blog/archives/)"] },
                migration: "configuration/site",
                properties: {
                  title: deliveredField("site.footer.sections[].title", { normalizer: "identity", example: "博客" }),
                  items: deliveredField("site.footer.sections[].items", { normalizer: "identity", example: ["[归档](/blog/archives/)"] })
                }
              })
            }),
            content: deliveredField("site.footer.content", {
              normalizer: "trusted_text",
              example: "本站由 [{author.name}](/) 使用 [{theme.name} {theme.version}]({theme.tree}) 主题创建。"
            })
          }
        })
      }
    }),
    layout: object({
      consumers: LAYOUT_CONSUMERS,
      example: { profiles: { blog_index: { path: "/blog/" } } },
      migration: "configuration/layout",
      runtimeKey: "layout",
      properties: {
        profiles: layoutProfilesSchema()
      }
    }),
    content: object({
      consumers: CONTENT_CONSUMERS,
      example: { article: { listing: { card_layout: "hero" } }, notebook: { listing: { order_by: "-updated" } } },
      migration: "configuration/content",
      runtimeKey: "content",
      properties: {
        article: object({
          consumers: CONTENT_CONSUMERS,
          example: { type: "tech", listing: { pinned_layout: "carousel", card_layout: "hero" } },
          migration: "configuration/content",
          runtimeKey: "article",
          removedProperties: {
            pin_style: "listing.pinned_layout",
            cover_ratio: "listing.cover_ratio",
            card_style: "listing.card_layout",
            banner_ratio: "banner.ratio",
            auto_excerpt: "listing.excerpt_length",
            category_color: "category_colors",
            license: "footer.license",
            share: "footer.share",
            reading_time: "show_reading_time",
            card_tags: "listing.show_tags",
            tags: "show_tags"
          },
          properties: {
            type: deliveredField("content.article.type", { normalizer: "identity", example: "tech" }),
            indent: deliveredField("content.article.indent", { normalizer: "identity", example: null }),
            listing: object({
              consumers: CONTENT_CONSUMERS,
              example: { pinned_layout: "carousel", card_layout: "hero", cover_ratio: 2, excerpt_length: 128, show_tags: false },
              migration: "configuration/content",
              runtimeKey: "listing",
              removedProperties: { pin_style: "pinned_layout", card_style: "card_layout", auto_excerpt: "excerpt_length", card_tags: "show_tags" },
              properties: {
                pinned_layout: deliveredField("content.article.listing.pinned_layout", { normalizer: "identity", example: "carousel" }),
                card_layout: deliveredField("content.article.listing.card_layout", { normalizer: "identity", example: "hero" }),
                cover_ratio: deliveredField("content.article.listing.cover_ratio", { normalizer: "identity", example: 2, exclusiveMinimum: 0 }),
                excerpt_length: deliveredField("content.article.listing.excerpt_length", { normalizer: "identity", example: 128, minimum: 0 }),
                show_tags: deliveredField("content.article.listing.show_tags", { normalizer: "identity", example: false })
              }
            }),
            banner: object({
              consumers: CONTENT_CONSUMERS,
              example: { ratio: 2.5 },
              migration: "configuration/content",
              runtimeKey: "banner",
              properties: {
                ratio: deliveredField("content.article.banner.ratio", { normalizer: "identity", example: 2.5, exclusiveMinimum: 0 })
              }
            }),
            category_colors: deliveredField("content.article.category_colors", {
              normalizer: "object",
              example: { "探索号": "#f44336" },
              sealed: false,
              additionalPropertyKey: "<category>",
              additionalProperties: deliveredField("content.article.category_colors.<category>", {
                normalizer: "identity",
                example: "#f44336"
              })
            }),
            ai_label: object({
              default: literal({ default: null, ...AI_LABEL_DEFAULTS }),
              consumers: CONTENT_CONSUMERS,
              example: { default: null, manual: AI_LABEL_DEFAULTS.manual },
              migration: "configuration/content",
              runtimeKey: "aiLabel",
              sealed: false,
              allowedPropertyKeys: ["default", "manual", "reviewed", "polished", "generated"],
              properties: {
                default: deliveredField("content.article.ai_label.default", { normalizer: "identity", example: null })
              },
              additionalPropertyKey: "<level>",
              additionalProperties: aiLabelLevelSchema()
            }),
            footer: object({
              consumers: CONTENT_CONSUMERS,
              example: { license: true, share: ["wechat", "link"] },
              migration: "configuration/content",
              runtimeKey: "footer",
              properties: {
                license: deliveredField("content.article.footer.license", { normalizer: "identity", example: true }),
                share: deliveredField("content.article.footer.share", { normalizer: "identity", example: ["wechat", "link"] })
              }
            }),
            related_posts: object({
              consumers: CONTENT_CONSUMERS,
              example: { enabled: false, limit: 5 },
              migration: "configuration/content",
              runtimeKey: "relatedPosts",
              removedProperties: { enable: "enabled", max_count: "limit" },
              properties: {
                enabled: deliveredField("content.article.related_posts.enabled", { normalizer: "identity", example: false }),
                limit: deliveredField("content.article.related_posts.limit", { normalizer: "identity", example: 5, minimum: 0 })
              }
            }),
            show_reading_time: deliveredField("content.article.show_reading_time", { normalizer: "identity", example: false }),
            show_tags: deliveredField("content.article.show_tags", { normalizer: "identity", example: true })
          }
        }),
        notebook: object({
          consumers: CONTENT_CONSUMERS,
          example: { listing: { excerpt_length: 128, per_page: null, order_by: "-updated" }, tag_icons: {} },
          migration: "configuration/content",
          runtimeKey: "notebook",
          properties: {
            listing: object({
              consumers: CONTENT_CONSUMERS,
              example: { excerpt_length: 128, per_page: null, order_by: "-updated" },
              migration: "configuration/content",
              runtimeKey: "listing",
              properties: {
                excerpt_length: deliveredField("content.notebook.listing.excerpt_length", { normalizer: "identity", example: 128, minimum: 0 }),
                per_page: deliveredField("content.notebook.listing.per_page", { normalizer: "identity", example: null, minimum: 0 }),
                order_by: deliveredField("content.notebook.listing.order_by", { normalizer: "identity", example: "-updated" })
              }
            }),
            tag_icons: deliveredField("content.notebook.tag_icons", {
              normalizer: "object",
              example: { "": "quot:hashtag" },
              sealed: false,
              additionalPropertyKey: "<tag>",
              additionalProperties: deliveredField("content.notebook.tag_icons.<tag>", {
                normalizer: "identity",
                example: "quot:hashtag"
              })
            }),
            footer: object({
              consumers: CONTENT_CONSUMERS,
              example: { license: false, share: false },
              migration: "configuration/content",
              runtimeKey: "footer",
              properties: {
                license: deliveredField("content.notebook.footer.license", { normalizer: "identity", example: false }),
                share: deliveredField("content.notebook.footer.share", { normalizer: "identity", example: false })
              }
            })
          }
        })
      }
    }),
    appearance: object({
      consumers: APPEARANCE_CONSUMERS,
      example: { color_scheme: "auto", shape: { radius: { card: "16px" } } },
      migration: "configuration/appearance",
      runtimeKey: "appearance",
      removedProperties: {
        prefers_theme: "color_scheme",
        "font-size": "typography.font_size",
        "font-family": "typography.font_family",
        "text-align": "typography.text_align",
        prefix: "removed",
        "border-radius": "shape.radius",
        "corner-shape": "shape.corner",
        color: "colors",
        animated_avatar: "motion.avatar",
        codeblock: "code_block",
        loading: "language files",
        gradient: "gradients",
        leftbar: "backgrounds.sidebar",
        site: "backgrounds.page",
        header_prefix: "typography.heading_prefixes",
        error_page: "resources.fallbacks.error_page"
      },
      properties: {
        color_scheme: deliveredField("appearance.color_scheme", { normalizer: "identity", example: "auto" }),
        typography: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { font_size: { root: "16px" }, text_align: "left", heading_prefixes: { h2: "#" } },
          migration: "configuration/appearance#typography",
          runtimeKey: "typography",
          removedProperties: { "font-size": "font_size", "font-family": "font_family", "text-align": "text_align", header_prefix: "heading_prefixes" },
          properties: {
            font_size: object({
              consumers: APPEARANCE_CONSUMERS,
              example: { root: "16px", inline_code: "85%", code_block: "0.8125rem" },
              migration: "configuration/appearance#typography",
              runtimeKey: "fontSize",
              removedProperties: { code: "inline_code", codeblock: "code_block" },
              properties: {
                root: deliveredField("appearance.typography.font_size.root", { normalizer: "identity", example: "16px" }),
                inline_code: deliveredField("appearance.typography.font_size.inline_code", { normalizer: "identity", example: "85%" }),
                code_block: deliveredField("appearance.typography.font_size.code_block", { normalizer: "identity", example: "0.8125rem" })
              }
            }),
            font_family: object({
              consumers: APPEARANCE_CONSUMERS,
              example: { body: "system-ui, sans-serif", inline_code: "Menlo, monospace", code_block: "Menlo, monospace" },
              migration: "configuration/appearance#typography",
              runtimeKey: "fontFamily",
              removedProperties: { code: "inline_code", codeblock: "code_block" },
              properties: {
                body: deliveredField("appearance.typography.font_family.body", { normalizer: "identity", example: "system-ui, sans-serif" }),
                inline_code: deliveredField("appearance.typography.font_family.inline_code", { normalizer: "identity", example: "Menlo, monospace" }),
                code_block: deliveredField("appearance.typography.font_family.code_block", { normalizer: "identity", example: "Menlo, monospace" })
              }
            }),
            text_align: deliveredField("appearance.typography.text_align", { normalizer: "identity", example: "left" }),
            heading_prefixes: deliveredField("appearance.typography.heading_prefixes", {
              normalizer: "object",
              example: { h2: "#", h3: "=", h4: "|", h5: ":" },
              sealed: true,
              properties: {
                h2: deliveredField("appearance.typography.heading_prefixes.h2", { normalizer: "identity", example: "#" }),
                h3: deliveredField("appearance.typography.heading_prefixes.h3", { normalizer: "identity", example: "=" }),
                h4: deliveredField("appearance.typography.heading_prefixes.h4", { normalizer: "identity", example: "|" }),
                h5: deliveredField("appearance.typography.heading_prefixes.h5", { normalizer: "identity", example: ":" })
              }
            })
          }
        }),
        shape: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { corner: "superellipse(1.25)", radius: { card: "16px" } },
          migration: "configuration/appearance#shape",
          runtimeKey: "shape",
          removedProperties: { "corner-shape": "corner", "border-radius": "radius" },
          properties: {
            corner: deliveredField("appearance.shape.corner", { normalizer: "identity", example: "superellipse(1.25)" }),
            radius: object({
              consumers: APPEARANCE_CONSUMERS,
              example: { card_large: "24px", card: "16px", card_small: "12px" },
              migration: "configuration/appearance#shape",
              runtimeKey: "radius",
              removedProperties: { "card-l": "card_large", "card-s": "card_small", "image-l": "image_large", "image-s": "image_small" },
              properties: {
                card_large: deliveredField("appearance.shape.radius.card_large", { normalizer: "identity", example: "24px" }),
                card: deliveredField("appearance.shape.radius.card", { normalizer: "identity", example: "16px" }),
                card_small: deliveredField("appearance.shape.radius.card_small", { normalizer: "identity", example: "12px" }),
                bar: deliveredField("appearance.shape.radius.bar", { normalizer: "identity", example: "12px" }),
                image_large: deliveredField("appearance.shape.radius.image_large", { normalizer: "identity", example: "24px" }),
                image: deliveredField("appearance.shape.radius.image", { normalizer: "identity", example: "16px" }),
                image_small: deliveredField("appearance.shape.radius.image_small", { normalizer: "identity", example: "8px" })
              }
            })
          }
        }),
        colors: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { theme: "hsl(192 98% 55%)", accent: "hsl(14 100% 57%)", link: "hsl(207 90% 54%)" },
          migration: "configuration/appearance#colors",
          runtimeKey: "colors",
          properties: {
            theme: deliveredField("appearance.colors.theme", { normalizer: "identity", example: "hsl(192 98% 55%)" }),
            accent: deliveredField("appearance.colors.accent", { normalizer: "identity", example: "hsl(14 100% 57%)" }),
            link: deliveredField("appearance.colors.link", { normalizer: "identity", example: "hsl(207 90% 54%)" })
          }
        }),
        gradients: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { primary_action: "linear-gradient(to right, #00f, #0ff)", angle: "210deg" },
          migration: "configuration/appearance#gradients",
          runtimeKey: "gradients",
          removedProperties: { start: "primary_action", searchbar: "search_bar", avatar: "avatar_ring" },
          properties: {
            primary_action: deliveredField("appearance.gradients.primary_action", { normalizer: "identity", example: "linear-gradient(to right, #00f, #0ff)" }),
            search_bar: deliveredField("appearance.gradients.search_bar", { normalizer: "identity", example: "linear-gradient(to right, #0ff, #f0f)" }),
            avatar_ring: deliveredField("appearance.gradients.avatar_ring", { normalizer: "identity", example: "conic-gradient(from 0deg, #0ff, #f0f, #0ff)" }),
            angle: deliveredField("appearance.gradients.angle", { normalizer: "identity", example: "210deg" })
          }
        }),
        motion: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { page_transition: true, avatar: "auto" },
          migration: "configuration/appearance#motion",
          runtimeKey: "motion",
          removedProperties: { animated_avatar: "avatar" },
          properties: {
            page_transition: deliveredField("appearance.motion.page_transition", { normalizer: "identity", example: true }),
            avatar: deliveredField("appearance.motion.avatar", { normalizer: "identity", example: "auto" })
          }
        }),
        code_block: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { scrollbar_width: "4px", highlight_theme: "https://example.com/highlight.css" },
          migration: "configuration/appearance#code-block",
          runtimeKey: "codeBlock",
          removedProperties: { scrollbar: "scrollbar_width", highlightjs_theme: "highlight_theme" },
          properties: {
            scrollbar_width: deliveredField("appearance.code_block.scrollbar_width", { normalizer: "identity", example: "4px" }),
            highlight_theme: deliveredField("appearance.code_block.highlight_theme", { normalizer: "identity", example: "https://example.com/highlight.css" })
          }
        }),
        backgrounds: object({
          consumers: APPEARANCE_CONSUMERS,
          example: { sidebar: { surface: "card", opacity: 0.8 }, page: { image: null } },
          migration: "configuration/appearance#backgrounds",
          runtimeKey: "backgrounds",
          removedProperties: { leftbar: "sidebar", site: "page" },
          properties: {
            sidebar: object({
              consumers: APPEARANCE_CONSUMERS,
              example: { surface: "card", color: { light: "var(--card)", dark: "var(--card)" }, opacity: 0.8 },
              migration: "configuration/appearance#backgrounds",
              runtimeKey: "sidebar",
              removedProperties: {
                "ui-style": "surface",
                "background-color-light": "color.light",
                "background-color-dark": "color.dark",
                "background-image": "image",
                "background-opacity": "opacity",
                "blur-px": "blur.radius",
                "blur-bg": "blur.overlay"
              },
              properties: {
                surface: deliveredField("appearance.backgrounds.sidebar.surface", { normalizer: "identity", example: "card" }),
                color: object({
                  consumers: APPEARANCE_CONSUMERS,
                  example: { light: "var(--card)", dark: "var(--card)" },
                  migration: "configuration/appearance#backgrounds",
                  runtimeKey: "color",
                  properties: {
                    light: deliveredField("appearance.backgrounds.sidebar.color.light", { normalizer: "identity", example: "var(--card)" }),
                    dark: deliveredField("appearance.backgrounds.sidebar.color.dark", { normalizer: "identity", example: "var(--card)" })
                  }
                }),
                image: deliveredField("appearance.backgrounds.sidebar.image", { normalizer: "identity", example: "url(/sidebar.webp)" }),
                opacity: deliveredField("appearance.backgrounds.sidebar.opacity", { normalizer: "identity", example: 0.8, minimum: 0, maximum: 1 }),
                blur: object({
                  consumers: APPEARANCE_CONSUMERS,
                  example: { radius: "100px", overlay: "var(--bg-a60)" },
                  migration: "configuration/appearance#backgrounds",
                  runtimeKey: "blur",
                  properties: {
                    radius: deliveredField("appearance.backgrounds.sidebar.blur.radius", { normalizer: "identity", example: "100px" }),
                    overlay: deliveredField("appearance.backgrounds.sidebar.blur.overlay", { normalizer: "identity", example: "var(--bg-a60)" })
                  }
                })
              }
            }),
            page: object({
              consumers: APPEARANCE_CONSUMERS,
              example: { image: null, blur: { radius: "100px", overlay: "var(--bg-a75)", saturation: "300%" } },
              migration: "configuration/appearance#backgrounds",
              runtimeKey: "page",
              removedProperties: { "background-image": "image", "blur-px": "blur.radius", "blur-bg": "blur.overlay", "blur-sat": "blur.saturation" },
              properties: {
                image: deliveredField("appearance.backgrounds.page.image", { normalizer: "identity", example: null }),
                blur: object({
                  consumers: APPEARANCE_CONSUMERS,
                  example: { radius: "100px", overlay: "var(--bg-a75)", saturation: "300%" },
                  migration: "configuration/appearance#backgrounds",
                  runtimeKey: "blur",
                  properties: {
                    radius: deliveredField("appearance.backgrounds.page.blur.radius", { normalizer: "identity", example: "100px" }),
                    overlay: deliveredField("appearance.backgrounds.page.blur.overlay", { normalizer: "identity", example: "var(--bg-a75)" }),
                    saturation: deliveredField("appearance.backgrounds.page.blur.saturation", { normalizer: "identity", example: "300%" })
                  }
                })
              }
            })
          }
        })
      }
    }),
    seo: object({
      consumers: SEO_CONSUMERS,
      example: {
        canonical: { host: "example.com", allowed_hosts: ["mirror.example.com"] },
        open_graph: { enabled: true, twitter_id: "stellar" },
        structured_data: { same_as: ["https://github.com/xaoxuu"] }
      },
      migration: "configuration/seo",
      runtimeKey: "seo",
      properties: {
        canonical: object({
          consumers: SEO_CONSUMERS,
          example: { host: "example.com", allowed_hosts: ["mirror.example.com"] },
          migration: "configuration/seo#canonical",
          runtimeKey: "canonical",
          removedProperties: {
            original_host: "host",
            official_hosts: "allowed_hosts",
            originalHost: "host",
            officialHosts: "allowed_hosts"
          },
          properties: {
            host: deliveredField("seo.canonical.host", {
              normalizer: "nullable_host",
              example: "example.com"
            }),
            allowed_hosts: deliveredField("seo.canonical.allowed_hosts", {
              normalizer: "host_list",
              example: ["mirror.example.com", "localhost"]
            })
          }
        }),
        open_graph: object({
          consumers: SEO_CONSUMERS,
          example: { enabled: true, twitter_id: "stellar" },
          migration: "configuration/seo#open-graph",
          runtimeKey: "openGraph",
          removedProperties: { enable: "enabled", twitterId: "twitter_id" },
          properties: {
            enabled: deliveredField("seo.open_graph.enabled", {
              normalizer: "identity",
              example: true
            }),
            twitter_id: deliveredField("seo.open_graph.twitter_id", {
              normalizer: "identity",
              example: "stellar"
            })
          }
        }),
        structured_data: object({
          consumers: SEO_CONSUMERS,
          example: { same_as: ["https://github.com/xaoxuu"] },
          migration: "configuration/seo#structured-data",
          runtimeKey: "structuredData",
          removedProperties: { links: "same_as", sameAs: "same_as" },
          properties: {
            same_as: deliveredField("seo.structured_data.same_as", {
              normalizer: "trimmed_string_list",
              example: ["https://github.com/xaoxuu"]
            })
          }
        })
      }
    }),
    resources: object({
      consumers: [...PRECONNECT_CONSUMERS, ...RESOURCE_CONSUMERS],
      example: { preconnect: ["https://cdn.jsdelivr.net"], fallbacks: { cover: "/cover.svg" } },
      migration: "configuration/resources",
      runtimeKey: "resources",
      properties: {
        preconnect: deliveredField("resources.preconnect", {
          normalizer: "origin_list",
          example: ["https://cdn.jsdelivr.net"]
        }),
        fallbacks: object({
          consumers: RESOURCE_CONSUMERS,
          example: { avatar: "/avatar.svg", link_card: "/link.svg", cover: "/cover.svg", image: { content: "/image.svg", tag_plugin: "/error.svg" } },
          migration: "configuration/resources#fallbacks",
          runtimeKey: "fallbacks",
          removedProperties: { link: "link_card", project: "project_icon", topic: "topic_cover", image_onerror: "image.tag_plugin" },
          properties: {
            avatar: deliveredField("resources.fallbacks.avatar", { normalizer: "identity", example: "/avatar.svg" }),
            link_card: deliveredField("resources.fallbacks.link_card", { normalizer: "identity", example: "/link.svg" }),
            cover: deliveredField("resources.fallbacks.cover", { normalizer: "identity", example: "/cover.svg" }),
            project_icon: deliveredField("resources.fallbacks.project_icon", { normalizer: "identity", example: "/project.png" }),
            banner: deliveredField("resources.fallbacks.banner", { normalizer: "identity", example: "/banner.jpg" }),
            topic_cover: deliveredField("resources.fallbacks.topic_cover", { normalizer: "identity", example: "/topic.png" }),
            image: object({
              consumers: RESOURCE_CONSUMERS,
              example: { content: "/image.svg", tag_plugin: "/error.svg" },
              migration: "configuration/resources#fallbacks",
              runtimeKey: "image",
              properties: {
                content: deliveredField("resources.fallbacks.image.content", { normalizer: "identity", example: "/image.svg" }),
                tag_plugin: deliveredField("resources.fallbacks.image.tag_plugin", { normalizer: "identity", example: "/error.svg" })
              }
            }),
            error_page: deliveredField("resources.fallbacks.error_page", { normalizer: "identity", example: "/404.svg" })
          }
        })
      }
    }),
    extensions: extensionsSchema(),
    inject: object({
      consumers: INJECT_CONSUMERS,
      example: { head: "<meta name=\"example\" content=\"stellar\">", script: "<script>console.log('stellar')</script>" },
      migration: "configuration/inject",
      runtimeKey: "inject",
      properties: {
        head: deliveredField("inject.head", {
          normalizer: "trusted_text",
          example: "<meta name=\"example\" content=\"stellar\">"
        }),
        script: deliveredField("inject.script", {
          normalizer: "trusted_text",
          example: "<script>console.log('stellar')</script>"
        })
      }
    })
  }
});

module.exports = {
  CONFIG_SCHEMA,
  literal
};
