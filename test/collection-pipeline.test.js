"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  discoverContent,
  paginateItems,
  runTwoStage,
  selectListingItems,
  stableSort
} = require("../scripts/lib/collection-pipeline/shared");
const {
  PROFILE_IDS,
  getProfileAdapter,
  profileAdapters
} = require("../scripts/lib/collection-pipeline/registry");
const pageRegistry = require("../scripts/lib/page-view-model-registry");

test("Collection Pipeline 注册表封闭四类 profile 与产品差异", () => {
  assert.deepEqual(PROFILE_IDS, ["post", "topic", "wiki", "notebook"]);
  assert.deepEqual(profileAdapters().map(adapter => adapter.contentKind), ["posts", "posts", "pages", "pages"]);
  assert.equal(getProfileAdapter("topic").twoStage, true);
  assert.equal(getProfileAdapter("topic").build, undefined);
  assert.deepEqual(getProfileAdapter("topic").config.collection.listing, ["excerptLength", "sort"]);
  assert.equal(getProfileAdapter("post").twoStage, false);
  assert.throws(() => getProfileAdapter("unknown"), /未登记的 Collection profile unknown/);
});

test("页面配置 registry 通过稳定页面身份保持唯一所有权", () => {
  pageRegistry.resetPageViewModelRegistry();
  const sourcePage = { source: "_posts/post.md", path: "post/", _id: "source" };
  const renderedPage = { source: "_posts/post.md", path: "post/", _id: "rendered" };
  const config = Object.freeze({ comments: Object.freeze({ enabled: false }) });
  pageRegistry.setPageConfig(sourcePage, config);
  assert.equal(pageRegistry.getPageConfig(renderedPage), config);
  assert.equal("getPageViewModel" in pageRegistry, false);
  assert.equal("setPageViewModel" in pageRegistry, false);
});
test("内容发现只访问每个 Post/Page 一次并按 profile 与 collection 分组", () => {
  const post = { _id: "post", source: "_posts/post.md", path: "blog/post/" };
  const topic = { _id: "topic", source: "_posts/topic.md", path: "blog/topic/" };
  const wiki = { _id: "wiki", source: "wiki/docs/index.md", path: "wiki/docs/" };
  const note = { _id: "note", source: "notebooks/dev/note.md", path: "notebooks/dev/note/" };
  const configs = new Map([
    [post, {}],
    [topic, { collection: { profile: "topic", id: "series" } }],
    [wiki, { collection: { profile: "wiki", id: "docs" } }],
    [note, { collection: { profile: "notebook", id: "dev" }, tags: ["Node"] }]
  ]);
  let reads = 0;
  const discovery = discoverContent({
    posts: { data: [post, topic] },
    pages: { each(callback) { [wiki, note].forEach(callback); } },
    configForPage(page) {
      reads += 1;
      return configs.get(page);
    }
  });

  assert.equal(reads, 4);
  assert.equal(discovery.visits, 4);
  assert.deepEqual([...discovery.byProfile.keys()], ["post", "topic", "wiki", "notebook"]);
  assert.deepEqual(discovery.byCollection.get("notebook:dev").map(item => item.page._id), ["note"]);
  assert.equal(Object.isFrozen(discovery.records), true);
  assert.equal(Object.isFrozen(discovery.records[0].snapshot), true);
});

test("共享列表原语保持 stable sort、listed/tag 过滤与空分页", () => {
  const items = [
    { id: "hidden", priority: 9, listed: false },
    { id: "b", priority: 1, listed: true },
    { id: "a", priority: 1, listed: true }
  ];
  assert.deepEqual(stableSort(items, (left, right) => right.priority - left.priority).map(item => item.id), ["hidden", "b", "a"]);
  const selected = selectListingItems(items, {
    tagId: "tools",
    tags: [{ id: "tools", itemIds: ["hidden", "a"] }]
  });
  assert.deepEqual(selected.map(item => item.id), ["a"]);
  assert.deepEqual(paginateItems([1, 2, 3], 2), [[1, 2], [3]]);
  assert.deepEqual(paginateItems([], 10), [[]]);
});

test("Topic/Notebook 可复用同一 two-stage 生命周期协议", () => {
  const calls = [];
  const result = runTwoStage(["a", "b"], {
    buildBase(entry) {
      calls.push(`base:${entry}`);
      return entry.toUpperCase();
    },
    aggregate(entries, bases) {
      calls.push("aggregate");
      return bases.join("");
    },
    complete(entry, base, aggregate) {
      calls.push(`complete:${entry}`);
      return `${base}:${aggregate}`;
    }
  });
  assert.deepEqual(calls, ["base:a", "base:b", "aggregate", "complete:a", "complete:b"]);
  assert.deepEqual(result, ["A:AB", "B:AB"]);
  assert.equal(Object.isFrozen(result), true);
});
