/* global hexo */
"use strict";

const { deepFreeze } = require("./schema-utils");
const { CONFIG_TARGET_FIELDS } = require("./config-target");

function literal(value) {
  return { kind: "literal", value };
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
    ...(options.items ? { items: options.items } : {})
  };
}

function deliveredField(path, options) {
  const target = CONFIG_TARGET_FIELDS.find(item => item.path === path && item.scopes.includes("theme"));
  if (!target || target.status !== "delivered") {
    throw new Error(`配置目标 ${path} 尚未交付`);
  }
  return field(target.type, {
    default: target.default,
    scope: target.scopes[0],
    cascade: target.cascade,
    normalizer: options.normalizer,
    normalization: target.normalization,
    consumers: target.consumers,
    example: options.example,
    migration: target.migration,
    runtimeKey: target.runtimePath.split(".").pop(),
    ...(target.items ? { items: target.items } : {})
  });
}

function object(options) {
  return {
    type: ["object"],
    default: literal({}),
    scope: "theme",
    cascade: ["schema default", "site theme override"],
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
const PRECONNECT_CONSUMERS = Object.freeze(["head renderer", "Reference generator"]);
const INJECT_CONSUMERS = Object.freeze(["head renderer", "script renderer", "Reference generator"]);

const CONFIG_SCHEMA = deepFreeze({
  type: ["object"],
  scope: "theme",
  sealed: false,
  migration: "configuration/v2",
  removedProperties: {
    preconnect: "resources.preconnect",
    canonical: "seo.canonical",
    open_graph: "seo.open_graph",
    structured_data: "seo.structured_data"
  },
  properties: {
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
      consumers: PRECONNECT_CONSUMERS,
      example: { preconnect: ["https://cdn.jsdelivr.net"] },
      migration: "configuration/resources",
      runtimeKey: "resources",
      properties: {
        preconnect: deliveredField("resources.preconnect", {
          normalizer: "origin_list",
          example: ["https://cdn.jsdelivr.net"]
        })
      }
    }),
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
