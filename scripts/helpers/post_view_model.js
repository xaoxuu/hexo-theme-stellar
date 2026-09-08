/* global hexo */
"use strict";

const { buildPostViewModelFromData, buildTopicViewModelFromData } = require("../filters/lib/page-view-model");
const {
  getPostViewModelInput,
  getPageViewModel,
  getRelatedItems,
  getTopicViewModelBase,
  getTopicViewModelInput,
  setPageViewModel
} = require("../lib/page-view-model-registry");

hexo.extend.helper.register("post_view_model", function(post) {
  const cached = getPageViewModel(post);
  if (cached) return cached;
  const input = getPostViewModelInput(post);
  if (input) {
    const viewModel = buildPostViewModelFromData(post, input, { relatedItems: getRelatedItems(post) });
    setPageViewModel(post, viewModel);
    return viewModel;
  }
  const topicInput = getTopicViewModelInput(post);
  if (topicInput) {
    const viewModel = buildTopicViewModelFromData(post, topicInput, {
      base: getTopicViewModelBase(post),
      relatedItems: getRelatedItems(post)
    });
    setPageViewModel(post, viewModel);
    return viewModel;
  }
  throw new Error(`Stellar v2: Post ${post?.source || post?.path || "<unknown>"} 缺少列表 ViewModel 输入`);
});
