/* global hexo */
"use strict";

const { buildPostViewModelFromData, buildTopicViewModelFromData } = require("../filters/lib/page-view-model");
const { pageViewModelsFor } = require("../lib/page-view-model-registry");

hexo.extend.helper.register("post_view_model", function(post) {
  const cached = pageViewModelsFor(hexo).getPageViewModel(post);
  if (cached) return cached;
  const input = pageViewModelsFor(hexo).getPostViewModelInput(post);
  if (input) {
    const viewModel = buildPostViewModelFromData(post, input, { relatedItems: pageViewModelsFor(hexo).getRelatedItems(post) });
    pageViewModelsFor(hexo).setPageViewModel(post, viewModel);
    return viewModel;
  }
  const topicInput = pageViewModelsFor(hexo).getTopicViewModelInput(post);
  if (topicInput) {
    const viewModel = buildTopicViewModelFromData(post, topicInput, {
      base: pageViewModelsFor(hexo).getTopicViewModelBase(post),
      relatedItems: pageViewModelsFor(hexo).getRelatedItems(post)
    });
    pageViewModelsFor(hexo).setPageViewModel(post, viewModel);
    return viewModel;
  }
  throw new Error(`Stellar v2: Post ${post?.source || post?.path || "<unknown>"} 缺少列表 ViewModel 输入`);
});
