/* global hexo */
"use strict";

const { deepFreeze } = require("./schema-utils");

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

const CANONICAL_CONSUMERS = Object.freeze([
  "Post PageViewModel",
  "canonical head renderer",
  "browser canonical check",
  "Reference generator"
]);

const CONFIG_SCHEMA = deepFreeze({
  type: ["object"],
  scope: "theme",
  sealed: false,
  properties: {
    canonical: {
      type: ["object"],
      default: literal({}),
      scope: "theme",
      cascade: ["theme default", "site theme override"],
      normalizer: "object",
      normalization: "parse child fields into a frozen JavaScript object",
      consumers: CANONICAL_CONSUMERS,
      example: {
        original_host: "example.com",
        official_hosts: ["mirror.example.com"]
      },
      migration: "configuration/canonical",
      runtimeKey: "canonical",
      sealed: true,
      removedProperties: {
        originalHost: "original_host",
        officialHosts: "official_hosts"
      },
      properties: {
        original_host: field(["string", "null"], {
          default: literal(null),
          scope: "theme",
          cascade: ["theme default", "site theme override"],
          normalizer: "nullable_host",
          normalization: "trim; null becomes an empty string",
          consumers: CANONICAL_CONSUMERS,
          example: "example.com",
          migration: "configuration/canonical#original-host",
          runtimeKey: "originalHost"
        }),
        official_hosts: field("array", {
          default: literal(["localhost"]),
          scope: "theme",
          cascade: ["theme default", "site theme override"],
          normalizer: "host_list",
          normalization: "trim strings, remove empty values, stable deduplicate",
          consumers: CANONICAL_CONSUMERS,
          example: ["mirror.example.com", "localhost"],
          migration: "configuration/canonical#official-hosts",
          runtimeKey: "officialHosts",
          items: { type: ["string"] }
        })
      }
    }
  }
});

module.exports = {
  CONFIG_SCHEMA,
  literal
};
