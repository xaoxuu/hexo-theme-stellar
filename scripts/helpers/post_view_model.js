/* global hexo */
"use strict";

const { buildPostViewModelFromData, buildTopicViewModelFromData } = require("../filters/lib/page-view-model");
const {
  getPostViewModelInput,
  getRelatedItems,
  getTopicViewModelBase,
  getTopicViewModelInput
} = require("../lib/page-view-model-registry");

hexo.extend.helper.register("post_view_model", function(post) {
  const input = getPostViewModelInput(post);
  if (input) return buildPostViewModelFromData(post, input, { relatedItems: getRelatedItems(post) });
  const topicInput = getTopicViewModelInput(post);
  if (topicInput) {
    return buildTopicViewModelFromData(post, topicInput, {
      base: getTopicViewModelBase(post),
      relatedItems: getRelatedItems(post)
    });
  }
  throw new Error(`Stellar v2: Post ${post?.source || post?.path || "<unknown>"} 缺少列表 ViewModel 输入`);
});
