"use strict";

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
    for (const record of pipeline.members("post")) {
      setProfileViewModelInput("post", record.page, pipeline.modelInput(record, {
        isBackup: process.env.IS_BACKUP === "true"
      }));
    }
  }
};
