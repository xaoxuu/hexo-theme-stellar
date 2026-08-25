"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  createCollectionRegistry,
  resolveContentMembership
} = require("../scripts/lib/content-membership");

function registry(entries = []) {
  return createCollectionRegistry(new Map(entries));
}

test("Collection 归属从 Wiki tree、Topic start 与 Notebook 源路径唯一推断", () => {
  const collections = registry([
    ["wiki/docs", { route: { path: "wiki/docs" }, navigation: { tree: { Start: ["index", "intro"] } } }],
    ["topic/alpha", { route: { start: "alpha-topic" } }],
    ["notebooks/dev", {}]
  ]);
  const wiki = resolveContentMembership({
    kind: "pages",
    source: "source/wiki/docs/intro.md",
    pagePath: "wiki/docs/intro/",
    config: { title: "Intro" },
    registry: collections
  });
  const topic = resolveContentMembership({
    kind: "posts",
    source: "source/_posts/alpha-topic.md",
    pagePath: "blog/2026/alpha-topic/",
    config: { title: "Alpha" },
    registry: collections
  });
  const notebook = resolveContentMembership({
    kind: "pages",
    source: "source/notebooks/dev/note.md",
    pagePath: "notebooks/dev/note/",
    config: { title: "Note" },
    registry: collections
  });

  assert.deepEqual(wiki.config.collection, { profile: "wiki", id: "docs" });
  assert.deepEqual(topic.config.collection, { profile: "topic", id: "alpha" });
  assert.deepEqual(notebook.config.collection, { profile: "notebook", id: "dev" });
  assert.equal(wiki.inferred && topic.inferred && notebook.inferred, true);
  assert.equal(Object.isFrozen(wiki.config), true);
});

test("普通 Post/Page 零候选时保持普通内容，Collection 命名空间零候选时报错", () => {
  const collections = registry([]);
  for (const [kind, source] of [["posts", "source/_posts/plain.md"], ["pages", "source/about/index.md"]]) {
    const result = resolveContentMembership({ kind, source, config: { title: "Plain" }, registry: collections });
    assert.deepEqual(result.issues, []);
    assert.equal(result.config.collection, undefined);
  }
  const missing = resolveContentMembership({
    kind: "pages",
    source: "source/notebooks/missing/note.md",
    config: { title: "Missing" },
    registry: collections
  });
  assert.equal(missing.issues[0].code, "collection_not_found");
  assert.match(missing.issues[0].source, /notebooks\/missing/);
  assert.match(missing.issues[0].expected, /candidates=<none>.*create source\/_data\/notebooks\/missing\.yml/);
});

test("多重匹配拒绝猜测，显式声明可消歧但不能与成员关系冲突", () => {
  const collections = registry([
    ["wiki/a", { route: { path: "guide" }, navigation: { tree: ["intro"] } }],
    ["wiki/b", { route: { path: "guide" }, navigation: { tree: ["intro"] } }]
  ]);
  const ambiguous = resolveContentMembership({
    kind: "pages",
    source: "source/guide/intro.md",
    pagePath: "guide/intro/",
    config: { title: "Intro" },
    registry: collections
  });
  assert.equal(ambiguous.issues[0].code, "collection_ambiguous");
  assert.match(ambiguous.issues[0].expected, /candidates=wiki:a, wiki:b.*add collection\.profile/);

  const explicit = resolveContentMembership({
    kind: "pages",
    source: "source/guide/intro.md",
    pagePath: "guide/intro/",
    config: { collection: { profile: "wiki", id: "b" } },
    registry: collections
  });
  assert.deepEqual(explicit.issues, []);
  assert.equal(explicit.inferred, false);

  const conflictCollections = registry([
    ["wiki/a", { route: { path: "wiki/a" }, navigation: { tree: ["index"] } }],
    ["wiki/b", {}]
  ]);
  const conflict = resolveContentMembership({
    kind: "pages",
    source: "source/wiki/a/index.md",
    pagePath: "wiki/a/",
    config: { collection: { profile: "wiki", id: "b" } },
    registry: conflictCollections
  });
  assert.equal(conflict.issues[0].code, "collection_conflict");
  assert.match(conflict.issues[0].expected, /candidates=wiki:a.*move the source file/);
});

test("显式注册归属可覆盖不同名的 Wiki 物理目录", () => {
  const collections = registry([
    ["wiki/resume", {}],
    ["wiki/hexo-resume", {}]
  ]);
  const result = resolveContentMembership({
    kind: "pages",
    source: "source/wiki/resume/index.md",
    pagePath: "wiki/resume/",
    config: { collection: { profile: "wiki", id: "hexo-resume" } },
    registry: collections
  });

  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.config.collection, { profile: "wiki", id: "hexo-resume" });
});

test("Notebook 明确命名空间不能被显式归属改写", () => {
  const collections = registry([
    ["notebooks/a", {}],
    ["notebooks/b", {}]
  ]);
  const result = resolveContentMembership({
    kind: "pages",
    source: "source/notebooks/a/note.md",
    config: { collection: { profile: "notebook", id: "b" } },
    registry: collections
  });

  assert.equal(result.issues[0].code, "collection_conflict");
  assert.match(result.issues[0].expected, /candidates=notebook:a/);
});

test("显式归属必须已注册且与 Post/Page 内容类型匹配", () => {
  const collections = registry([
    ["wiki/docs", {}],
    ["topic/alpha", {}]
  ]);
  for (const input of [
    { kind: "pages", source: "source/custom.md", collection: { profile: "wiki", id: "missing" } },
    { kind: "posts", source: "source/_posts/custom.md", collection: { profile: "wiki", id: "docs" } }
  ]) {
    const result = resolveContentMembership({
      kind: input.kind,
      source: input.source,
      config: { collection: input.collection },
      registry: collections
    });
    assert.equal(result.issues[0].code, "collection_not_found");
    assert.match(result.issues[0].expected, /valid for this content source/);
  }
});
