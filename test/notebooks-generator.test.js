"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseStellarConfig } = require("../scripts/lib/config-schema");

let generator;
global.hexo = {
  extend: {
    generator: {
      register(name, callback) {
        assert.equal(name, "notebooks");
        generator = callback;
      }
    }
  }
};
require("../scripts/generators/notebooks");

test("Notebook 生成器只向总索引和标签分页提供显式冻结投影", () => {
  const note = Object.freeze({
    id: "note",
    href: "notes/dev/node",
    title: "Node.js",
    cover: "",
    excerpt: "Node note",
    tags: Object.freeze(["tools"]),
    date: "2026-08-20T00:00:00.000Z",
    updated: "2026-08-23T00:00:00.000Z",
    priority: 3,
    listed: true
  });
  const hiddenNote = Object.freeze({
    ...note,
    id: "hidden",
    href: "notes/dev/hidden",
    title: "Hidden",
    priority: 9,
    listed: false
  });
  const collection = Object.freeze({
    id: "dev",
    href: "notes/dev",
    name: "Dev Notes",
    headline: "Development Notes",
    description: "Developer notebook",
    icon: "/dev.svg",
    sort: 0,
    listed: true,
    navigation: Object.freeze({ menu: "notes" }),
    layout: Object.freeze({
      brand: Object.freeze({ name: "Dev Notes", url: "notes/dev" }),
      sidebar: Object.freeze({ left: Object.freeze({ widgets: Object.freeze(["tagtree"]) }), right: Object.freeze({ widgets: Object.freeze([]) }) }),
      searchFilter: "notes/dev"
    }),
    tags: Object.freeze([Object.freeze({
      id: "",
      name: "",
      label: "",
      path: "notes/dev",
      parentId: null,
      children: Object.freeze(["tools"]),
      itemIds: Object.freeze(["note", "hidden"])
    }), Object.freeze({
      id: "tools",
      name: "tools",
      label: "tools",
      path: "notes/dev/tags/tools",
      parentId: null,
      children: Object.freeze([]),
      itemIds: Object.freeze(["note", "hidden"])
    })]),
    items: Object.freeze([hiddenNote, note]),
    perPage: 10
  });
  const context = Object.assign(global.hexo, {
    stellar: {
      config: parseStellarConfig({ themeConfig: {} }),
      data: {
        notebookIndex: Object.freeze({
          items: Object.freeze([collection]),
          collections: Object.freeze({ dev: collection })
        })
      }
    }
  });

  const routes = generator.call(context, {});
  const home = routes.find(route => route.layout?.includes("notebooks"));
  const noteRoute = routes.find(route => route.layout?.includes("notes"));
  const tagRoute = routes.find(route => route.data.notebookIndex?.activeTag === "tools");
  assert.deepEqual(home.data.notebookIndex.items.map(item => item.id), ["dev"]);
  assert.deepEqual(noteRoute.data.notebookIndex.items.map(item => item.title), ["Node.js"]);
  assert.equal(noteRoute.data.notebookIndex.collection.id, "dev");
  assert.deepEqual(noteRoute.data.notebookIndex.tags.map(tag => tag.id), ["", "tools"]);
  assert.deepEqual(tagRoute.data.notebookIndex.items.map(item => item.title), ["Node.js"]);
  assert.deepEqual(noteRoute.data.stellarConfig.collection, {
    profile: "notebook",
    id: "dev"
  });
  assert.equal(noteRoute.data.collection, undefined);
});
