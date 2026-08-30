/**
 * https://github.com/wzpan/hexo-generator-search
 */
/* global hexo */
"use strict";

const { normalize_path } = require("../lib/path_utils");
const { buildSearchIndex } = require("../lib/search_index");
const { indexDomains } = require("../lib/search-domain");
const { isSearchable } = require("../lib/content-config");
const { getPageConfig } = require("../lib/page-view-model-registry");

hexo.extend.generator.register("search_json_generator", function(locals) {
  if (this.stellar.config.search.provider !== "local") return {};
  const { root } = this.config;
  const cfg = this.stellar.config.search.local;
  const sort = "-date";
  const scope = cfg.scope.trim();

  var posts, pages;
  if (scope === "post") {
    posts = locals.posts?.filter(p => p.content?.length > 0).sort(sort);
  } else if (scope === "page") {
    pages = locals.pages?.filter(p => p.content?.length > 0);
  } else {
    posts = locals.posts?.filter(p => p.content?.length > 0).sort(sort);
    pages = locals.pages?.filter(p => p.content?.length > 0);
  }

  var res = [];

  function generateJson(post, config) {
    var temp_post = {};
    if (post.title) {
      temp_post.title = post.title.trim();
    }
    if (post.path) {
      const path = normalize_path(root + post.path);
      temp_post.path = path === "/" ? "/" : path + "/";
    }
    if (cfg.includeContent !== false && post.content) {
      const { content, anchors } = buildSearchIndex(post.content);
      temp_post.content = content;
      if (anchors.length > 0) {
        temp_post.anchors = anchors;
      }
    }
    if (post.tags && post.tags.length > 0) {
      var tags = [];
      post.tags.forEach(function(tag) {
        tags.push(tag.name);
      });
      temp_post.tags = tags;
    }
    if (post.categories && post.categories.length > 0) {
      var categories = [];
      post.categories.forEach(function(cate) {
        categories.push(cate.name);
      });
      temp_post.categories = categories;
    }
    const domains = indexDomains(post, config);
    if (domains.length > 0) temp_post.domains = domains;
    return temp_post;
  }

  if (posts) {
    posts.each(function(post) {
      var layouts = ["post"];
      if (!layouts.includes(post.layout)) return;
      const config = getPageConfig(post);
      if (!config || !isSearchable(config)) return;
      const item = generateJson(post, config);
      res.push(item);
    });
  }
  if (pages) {
    pages.each(function(page) {
      var layouts = ["page", "wiki"];
      if (!layouts.includes(page.layout)) return;
      const config = getPageConfig(page);
      if (!config || !isSearchable(config)) return;
      const item = generateJson(page, config);
      res.push(item);
    });
  }
  return {
    path: "search.json",
    data: JSON.stringify(res)
  };
});
