"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseStellarConfig } = require("../scripts/lib/config-schema");

function loadGenerator(modulePath, registeredName) {
  let callback;
  global.hexo = {
    extend: {
      generator: {
        register(name, generator) {
          assert.equal(name, registeredName);
          callback = generator;
        }
      }
    }
  };
  delete require.cache[require.resolve(modulePath)];
  require(modulePath);
  return callback;
}

function context(data, themeConfig = {}) {
  return Object.assign(global.hexo, {
    stellar: {
      config: parseStellarConfig({ themeConfig }),
      data
    }
  });
}

test("Collection generators project sorted and filtered indexes into routes", () => {
  const topicGenerator = loadGenerator("../scripts/generators/topic", "index_topic");
  const topicRoutes = topicGenerator.call(context({
    topicIndex: {
      items: [
        { id: "older", listed: true, sortDate: "2026-01-01" },
        { id: "hidden", listed: false, sortDate: "2026-03-01" },
        { id: "newer", listed: true, sortDate: "2026-02-01" }
      ]
    }
  }));
  assert.deepEqual(topicRoutes[0].data.topicIndex.items.map(item => item.id), ["newer", "older"]);

  const wikiGenerator = loadGenerator("../scripts/generators/wiki", "wiki");
  const wikiRoutes = wikiGenerator.call(context({
    wiki: {
      tree: { docs: {} },
      index: {
        items: [
          { id: "visible", listed: true },
          { id: "tagged", listed: true }
        ],
        tags: [{ name: "guide", itemIds: ["tagged"], path: "wiki/tags/guide" }]
      },
      all_tags: { guide: { name: "guide", path: "wiki/tags/guide" } }
    }
  }));
  assert.deepEqual(wikiRoutes[1].data.wikiIndex.items.map(item => item.id), ["tagged"]);
  assert.deepEqual(wikiRoutes[1].data.wikiIndex.allItems.map(item => item.id), ["visible", "tagged"]);

  const disabledWikiRoutes = wikiGenerator.call(context({
    wiki: {
      tree: { docs: {} },
      index: { items: [], tags: [] },
      all_tags: {}
    }
  }, { profiles: { wiki_index: { path: null } } }));
  assert.deepEqual(disabledWikiRoutes, []);
});

test("Notebook generator projects collection ownership through notebookIndex", () => {
  const generator = loadGenerator("../scripts/generators/notebooks", "notebooks");
  const note = Object.freeze({ id: "note", listed: true });
  const notebook = Object.freeze({
    id: "dev",
    listed: true,
    order: 0,
    navigation: Object.freeze({}),
    tags: Object.freeze([
      Object.freeze({ id: "", path: "notes/dev", itemIds: Object.freeze(["note"]) })
    ]),
    items: Object.freeze([note]),
    perPage: 10
  });
  const routes = generator.call(context({
    notebookIndex: Object.freeze({
      items: Object.freeze([notebook]),
      recentItems: Object.freeze([note])
    })
  }), {});
  const noteRoute = routes.find(route => route.layout?.includes("notes"));
  assert.equal(noteRoute.data.stellarConfig, undefined);
  assert.equal(noteRoute.data.notebookIndex.collection.id, "dev");
  assert.deepEqual(noteRoute.data.notebookIndex.items.map(item => item.id), ["note"]);
  assert.equal(Object.isFrozen(noteRoute.data.notebookIndex), true);
});
