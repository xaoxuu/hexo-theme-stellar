"use strict";

const { buildNotebookPageViewModelBase } = require("../../models");
const {
  setProfileViewModelBase,
  setProfileViewModelInput
} = require("../../page-view-model-registry");
const { sourcePathForData } = require("../../source-config");
const { plainTerms } = require("../shared");

module.exports = {
  id: "notebook",
  contentKind: "pages",
  twoStage: true,
  prepare(pipeline) {
    const collectionItems = pipeline.members("notebook").map(record => ({
      collection: { profile: "notebook", id: record.collectionId },
      tags: plainTerms(record.config.tags)
    }));
    for (const record of pipeline.members("notebook")) {
      pipeline.capture(() => {
        const collectionId = record.collectionId;
        const input = pipeline.modelInput(record, {
          collectionSource: sourcePathForData(`notebooks/${collectionId}`),
          collectionId,
          collectionConfig: pipeline.collection("notebook", collectionId),
          collectionItems
        });
        const base = buildNotebookPageViewModelBase(input);
        setProfileViewModelInput("notebook", record.page, input);
        setProfileViewModelBase("notebook", record.page, base);
      });
    }
  },
  build(pipeline) {
    require("../../../events/lib/notebooks")(pipeline.ctx, pipeline);
  }
};
