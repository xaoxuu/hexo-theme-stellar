"use strict";

const {
  buildTopicIndexRender,
  buildTopicPageViewModelBase,
  completeTopicPageViewModel
} = require("../../models");
const {
  setProfileViewModelBase,
  setProfileViewModelInput
} = require("../../page-view-model-registry");
const { sourcePathForData } = require("../../source-config");
const { runTwoStage } = require("../shared");

module.exports = {
  id: "topic",
  contentKind: "posts",
  twoStage: true,
  prepare(pipeline) {
    const members = pipeline.members("topic");
    const memberSnapshots = Object.freeze(members.map(record => Object.freeze({
      source: pipeline.sourceForPage(record.page),
      frontMatter: record.config,
      page: record.snapshot
    })));
    const publishList = Array.isArray(pipeline.data.topic?.publish_list)
      ? pipeline.data.topic.publish_list
      : null;
    const topicIndexItems = [];
    for (const [collectionId, collectionConfig] of pipeline.collections("topic")) {
      pipeline.capture(() => topicIndexItems.push(buildTopicIndexRender({
        source: sourcePathForData(`topic/${collectionId}`),
        themeSource: pipeline.themeSource,
        collectionSource: sourcePathForData(`topic/${collectionId}`),
        collectionId,
        collectionListed: publishList == null || publishList.includes(collectionId),
        siteConfig: pipeline.ctx.config,
        runtimeData: pipeline.runtimeData,
        stellarConfig: pipeline.ctx.stellar?.config,
        collectionConfig,
        members: memberSnapshots
      })));
    }
    pipeline.runtimeData.topicIndex = Object.freeze({ items: Object.freeze(topicIndexItems) });

    runTwoStage(members, {
      buildBase(record) {
        return pipeline.capture(() => {
          const collectionId = record.collectionId;
          const input = pipeline.modelInput(record, {
            collectionSource: sourcePathForData(`topic/${collectionId}`),
            collectionId,
            collectionListed: publishList == null || publishList.includes(collectionId),
            collectionConfig: pipeline.collection("topic", collectionId),
            members: memberSnapshots
          });
          const base = buildTopicPageViewModelBase(input);
          setProfileViewModelInput("topic", record.page, input);
          setProfileViewModelBase("topic", record.page, base);
          return { input, base };
        });
      },
      aggregate() {
        return pipeline.runtimeData.topicIndex;
      },
      complete(record, prepared) {
        if (!prepared) return null;
        record.page.viewModel = completeTopicPageViewModel(prepared.input, prepared.base);
        return record.page.viewModel;
      }
    });
  },
  build(pipeline) {
    require("../../../events/lib/topic_tree")(pipeline.ctx);
  }
};
