"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  indexDomains,
  resolveSearchScope
} = require("../scripts/lib/search-domain");

test("Local 索引为 Post、Topic、Wiki 与 Notebook 写入内部搜索域", () => {
  assert.deepEqual(indexDomains({ layout: "post" }, {}), ["blog"]);
  assert.deepEqual(indexDomains(
    { layout: "post" },
    { collection: { profile: "topic", id: "stellar" } }
  ), ["blog", "topic:stellar"]);
  assert.deepEqual(indexDomains(
    { layout: "wiki" },
    { collection: { profile: "wiki", id: "stellar" } }
  ), ["wiki:stellar"]);
  assert.deepEqual(indexDomains(
    { layout: "page" },
    { collection: { profile: "notebook", id: "notes" } }
  ), ["notebook:notes"]);
  assert.deepEqual(indexDomains({ layout: "page" }, {}), []);
});

test("搜索入口优先解析具体 Collection，Topic 同时提供博客与专栏", () => {
  assert.deepEqual(resolveSearchScope({
    blogAggregate: true,
    indexScope: "all",
    viewModel: {
      collection: {
        profile: "topic",
        id: "stellar",
        identity: { name: "Stellar 专栏" }
      }
    }
  }), {
    current: "topic:stellar",
    label: "Stellar 专栏",
    options: ["blog", "topic:stellar"]
  });
  assert.deepEqual(resolveSearchScope({
    indexScope: "all",
    viewModel: {
      collection: {
        profile: "wiki",
        id: "stellar",
        identity: { name: "Stellar" }
      }
    }
  }), {
    current: "wiki:stellar",
    label: "Stellar",
    options: ["wiki:stellar"]
  });
});

test("博客聚合页归入 Blog，独立 Page 与 Collection 总索引不提供切换", () => {
  assert.deepEqual(resolveSearchScope({ blogAggregate: true, indexScope: "all" }), {
    current: "blog",
    label: null,
    options: ["blog"]
  });
  assert.deepEqual(resolveSearchScope({
    indexScope: "all",
    viewModel: { collection: { profile: "post" } }
  }), {
    current: "blog",
    label: null,
    options: ["blog"]
  });
  assert.equal(resolveSearchScope({ indexScope: "all" }), null);
  assert.equal(resolveSearchScope({
    indexScope: "all",
    viewModel: { collection: { profile: "wiki_index", id: "all" } }
  }), null);
});

test("Local scope 排除内容类型时不暴露不可用搜索域", () => {
  assert.equal(resolveSearchScope({
    indexScope: "page",
    viewModel: { collection: { profile: "topic", id: "stellar" } }
  }), null);
  assert.equal(resolveSearchScope({
    indexScope: "post",
    viewModel: { collection: { profile: "wiki", id: "stellar" } }
  }), null);
  assert.equal(resolveSearchScope({ blogAggregate: true, indexScope: "page" }), null);
});
