"use strict";

const { buildPostCollectionModel } = require("../../models");
const { setProfileViewModelInput } = require("../../page-view-model-registry");

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
      setProfileViewModelInput("post", record.page, pipeline.modelInput(record, {
        collectionModel,
        isBackup: process.env.IS_BACKUP === "true"
      }));
    }
  }
};
