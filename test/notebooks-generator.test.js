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

test("Notebook 聚合页输出最终 collection.profile 到冻结配置入口", () => {
  const pageQuery = {
    data: [],
    length: 0,
    filter() { return this; },
    sort() { return this; }
  };
  const context = Object.assign(global.hexo, {
    stellar: { config: parseStellarConfig({ themeConfig: {} }) },
    theme: {
      config: {
        notebooks: {
          tree: {
            dev: {
              id: "dev",
              listing: { order_by: "-updated", per_page: 10 },
              navigation: {},
              noteMap: new Map(),
              tagTree: new Map([["", { id: "", path: "notes/dev", noteSet: new Set() }]])
            }
          }
        }
      }
    }
  });

  const routes = generator.call(context, { pages: pageQuery });
  const noteRoute = routes.find(route => route.layout?.includes("notes"));
  assert.deepEqual(noteRoute.data.stellarConfig.collection, {
    profile: "notebook",
    id: "dev"
  });
  assert.equal(noteRoute.data.collection, undefined);
});
