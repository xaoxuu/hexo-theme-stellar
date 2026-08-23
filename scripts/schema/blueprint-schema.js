/* global hexo */
"use strict";

const { deepFreeze } = require("./schema-utils");

const BLUEPRINT_IDS = Object.freeze(["classic-blog", "minimal-reading", "docs-reference"]);
const VISUAL_STYLE_IDS = Object.freeze(["stellar", "minimal"]);

function literal(value) {
  return { kind: "literal", value };
}

function scalar(type, options = {}) {
  return {
    type: [type],
    default: literal(options.default),
    scope: "blueprint",
    cascade: ["manifest"],
    normalizer: "identity",
    normalization: "validate and preserve the manifest value",
    consumers: ["stellar init", "Blueprint Reference"],
    example: options.example ?? options.default,
    migration: "blueprints/v2",
    runtimeKey: options.runtimeKey,
    ...(options.values ? { values: options.values } : {}),
    ...(options.validator ? { validator: options.validator } : {})
  };
}

function object(properties, requiredProperties) {
  return {
    type: ["object"],
    default: literal({}),
    scope: "blueprint",
    cascade: ["manifest"],
    normalizer: "object",
    normalization: "validate declared fields and deep-freeze the result",
    consumers: ["stellar init", "Blueprint Reference"],
    example: {},
    migration: "blueprints/v2",
    runtimeKey: "manifest",
    sealed: true,
    requiredProperties,
    properties
  };
}

const BLUEPRINT_FILE_SCHEMA = object({
  source: scalar("string", { default: "", example: "_config.stellar.yml", validator: "safe_relative_path" }),
  target: scalar("string", { default: "", example: "_config.stellar.yml", validator: "safe_relative_path" }),
  template: scalar("boolean", { default: false, example: false })
}, ["source", "target", "template"]);

const BLUEPRINT_MANIFEST_SCHEMA = deepFreeze({
  ...object({
    schema_version: scalar("number", { default: 1, example: 1, values: [1], runtimeKey: "schemaVersion" }),
    id: scalar("string", { default: "", example: "classic-blog", values: BLUEPRINT_IDS }),
    name: scalar("string", { default: "", example: "Classic Blog" }),
    description: scalar("string", { default: "", example: "A classic personal blog." }),
    default_style: scalar("string", { default: "stellar", example: "stellar", values: VISUAL_STYLE_IDS, runtimeKey: "defaultStyle" }),
    files: {
      ...scalar("array", { default: [], example: [] }),
      normalizer: "array",
      validator: "unique_blueprint_targets",
      items: BLUEPRINT_FILE_SCHEMA
    }
  }, ["schema_version", "id", "name", "description", "default_style", "files"]),
  applyDefaults: false
});

const VISUAL_STYLE_MANIFEST_SCHEMA = deepFreeze({
  ...object({
    schema_version: scalar("number", { default: 1, example: 1, values: [1], runtimeKey: "schemaVersion" }),
    id: scalar("string", { default: "", example: "stellar", values: VISUAL_STYLE_IDS }),
    name: scalar("string", { default: "", example: "Stellar" }),
    description: scalar("string", { default: "", example: "The expressive Stellar visual language." }),
    fragment: scalar("string", { default: "appearance.yml", example: "appearance.yml", validator: "safe_relative_path" })
  }, ["schema_version", "id", "name", "description", "fragment"]),
  applyDefaults: false
});

const CLI_CONTRACT = deepFreeze({
  command: "stellar",
  subcommands: {
    init: {
      options: ["blueprint", "style", "dry-run", "non-interactive"]
    },
    doctor: {
      formats: ["text", "json"],
      options: ["format"],
      jsonGlobalOptions: ["silent"]
    }
  }
});

module.exports = {
  BLUEPRINT_IDS,
  BLUEPRINT_MANIFEST_SCHEMA,
  CLI_CONTRACT,
  VISUAL_STYLE_IDS,
  VISUAL_STYLE_MANIFEST_SCHEMA
};
