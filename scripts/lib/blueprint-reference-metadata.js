/* global hexo */
"use strict";

const { loadCatalog } = require("./blueprints");
const { BLUEPRINT_IDS, CLI_CONTRACT, VISUAL_STYLE_IDS } = require("../schema/blueprint-schema");

function generateBlueprintReferenceMetadata(options = {}) {
  const catalog = options.catalog || loadCatalog(options);
  return {
    schemaVersion: 1,
    source: [
      "scripts/schema/blueprint-schema.js",
      "blueprints/*/manifest.json",
      "blueprints/styles/*/manifest.json"
    ],
    status: "delivered",
    manifestContract: {
      schemaVersion: 1,
      sealed: true,
      blueprintIds: BLUEPRINT_IDS,
      visualStyleIds: VISUAL_STYLE_IDS,
      paths: "safe non-empty relative path",
      uniqueBlueprintTargets: true,
      physicalContainment: "theme and site roots, including symlink resolution"
    },
    blueprints: BLUEPRINT_IDS.map(id => {
      const blueprint = catalog.blueprints[id];
      return {
        id: blueprint.id,
        name: blueprint.name,
        description: blueprint.description,
        defaultStyle: blueprint.defaultStyle,
        files: blueprint.files.map(file => file.target)
      };
    }),
    visualStyles: VISUAL_STYLE_IDS.map(id => {
      const style = catalog.styles[id];
      return {
        id: style.id,
        name: style.name,
        description: style.description
      };
    }),
    cli: CLI_CONTRACT
  };
}

function stringifyBlueprintReferenceMetadata(options = {}) {
  return `${JSON.stringify(generateBlueprintReferenceMetadata(options), null, 2)}\n`;
}

module.exports = {
  generateBlueprintReferenceMetadata,
  stringifyBlueprintReferenceMetadata
};
