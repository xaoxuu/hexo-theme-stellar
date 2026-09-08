"use strict";

const { buildPostCollectionModel } = require("../../models");
const { pageViewModelsFor } = require("../../page-view-model-registry");

module.exports = {
  id: "post",
  config: Object.freeze({
    collection: null,
    page: Object.freeze({ listingPriority: true })
  }),
  contentKind: "posts",
  twoStage: false,
  prepare(pipeline) {
    const collectionModel = buildPostCollectionModel(pipeline.ctx.stellar?.config);
    for (const record of pipeline.members("post")) {
      pageViewModelsFor(pipeline.ctx).setProfileViewModelInput("post", record.page, pipeline.modelInput(record, {
        collectionModel,
        isBackup: process.env.IS_BACKUP === "true"
      }));
    }
  }
};
