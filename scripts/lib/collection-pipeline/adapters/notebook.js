"use strict";

const {
  buildNotebookCollectionModel,
  buildNotebookPageViewModelBase
} = require("../../models");
const { pageViewModelsFor } = require("../../page-view-model-registry");
const { sourcePathForData } = require("../../source-config");
const { plainTerms } = require("../shared");

module.exports = {
  id: "notebook",
  config: Object.freeze({
    collection: Object.freeze({
      hero: false,
      routeStart: false,
      navigationTree: false,
      listing: Object.freeze(["order", "excerptLength", "perPage", "sort"])
    }),
    page: Object.freeze({ listingPriority: true })
  }),
  contentKind: "pages",
  twoStage: true,
  prepare(pipeline) {
    const collectionItems = pipeline.members("notebook").map(record => ({
      collection: { profile: "notebook", id: record.collectionId },
      tags: plainTerms(record.config.tags)
    }));
    const collectionModels = new Map();
    for (const [collectionId, collectionConfig] of pipeline.collections("notebook")) {
      collectionModels.set(collectionId, buildNotebookCollectionModel({
        collectionSource: sourcePathForData(`notebooks/${collectionId}`),
        themeSource: pipeline.themeSource,
        siteConfig: pipeline.ctx.config,
        stellarConfig: pipeline.ctx.stellar?.config,
        collectionConfig,
        collectionItems
      }, collectionId));
    }
    pipeline.notebookCollections = collectionModels;
    for (const record of pipeline.members("notebook")) {
      pipeline.capture(() => {
        const collectionId = record.collectionId;
        const input = pipeline.modelInput(record, {
          collectionSource: sourcePathForData(`notebooks/${collectionId}`),
          collectionId,
          collectionConfig: pipeline.collection("notebook", collectionId),
          collectionModel: collectionModels.get(collectionId),
          collectionItems
        });
        const base = buildNotebookPageViewModelBase(input);
        pageViewModelsFor(pipeline.ctx).setProfileViewModelInput("notebook", record.page, input);
        pageViewModelsFor(pipeline.ctx).setProfileViewModelBase("notebook", record.page, base);
      });
    }
  },
  build(pipeline) {
    require("../../../events/lib/notebooks")(pipeline.ctx, pipeline);
  }
};
