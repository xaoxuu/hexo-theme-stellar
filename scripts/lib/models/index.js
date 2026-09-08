"use strict";

const post = require("./post");
const wiki = require("./wiki");
const topic = require("./topic");
const notebook = require("./notebook");

module.exports = {
  buildWikiCollectionModel: wiki.buildWikiCollectionModel,
  buildTopicCollectionModel: topic.buildTopicCollectionModel,
  buildNotebookCollectionModel: notebook.buildNotebookCollectionModel,
  buildNotebookPageViewModelBase: notebook.buildNotebookPageViewModelBase,
  buildNotebookPageViewModel: notebook.buildNotebookPageViewModel,
  buildPostCollectionModel: post.buildPostCollectionModel,
  buildPostPageViewModel: post.buildPostPageViewModel,
  buildTopicIndexRender: topic.buildTopicIndexRender,
  buildTopicPageViewModel: topic.buildTopicPageViewModel,
  buildTopicPageViewModelBase: topic.buildTopicPageViewModelBase,
  buildWikiListingRender: wiki.buildWikiListingRender,
  buildWikiPageViewModel: wiki.buildWikiPageViewModel,
  buildWikiPageViewModelBase: wiki.buildWikiPageViewModelBase,
  buildWikiRelated: wiki.buildWikiRelated,
  completeNotebookPageViewModel: notebook.completeNotebookPageViewModel,
  completeTopicPageViewModel: topic.completeTopicPageViewModel,
  completeWikiPageViewModel: wiki.completeWikiPageViewModel
};
