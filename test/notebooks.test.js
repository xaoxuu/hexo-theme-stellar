'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { getNotebooksObject, groupPagesByNotebook, NotePage } = require("../scripts/lib/notebooks");
const { parseStellarConfig } = require("../scripts/lib/config-schema");

test('groupPagesByNotebook 按 notebook 分组且保持顺序、跳过无 notebook 页面', () => {
  const pages = [
    { _id: 'a1', collection: { type: 'notebook', id: 'alpha' } },
    { _id: 'x', collection: null },
    { _id: 'a2', collection: { type: 'notebook', id: 'alpha' } },
    { _id: 'b1', collection: { type: 'notebook', id: 'beta' } },
    { _id: 'y' }
  ];
  const map = groupPagesByNotebook(pages);
  assert.deepStrictEqual([...map.keys()], ['alpha', 'beta']);
  assert.deepStrictEqual(map.get('alpha').map(p => p._id), ['a1', 'a2']);
  assert.deepStrictEqual(map.get('beta').map(p => p._id), ['b1']);
  assert.equal(map.has(''), false);
});

test('groupPagesByNotebook 空数组返回空 Map', () => {
  const map = groupPagesByNotebook([]);
  assert.equal(map.size, 0);
});

test('NotePage 使用 listing.priority 与 updated 回退', () => {
  assert.equal(new NotePage({ _id: 'n1', listing: { priority: 1 } }).priority, 1);
  assert.equal(new NotePage({ _id: 'n2', listing: { priority: 0 } }).priority, 0);
  assert.equal(new NotePage({ _id: 'n3', listing: { priority: 3 } }).priority, 3);
  assert.equal(new NotePage({ _id: 'n4' }).priority, 0);
  assert.equal(new NotePage({ _id: 'n6', updated: 'x', date: 'y' }).updated, 'x');
  assert.equal(new NotePage({ _id: 'n7', date: 'y' }).updated, 'y');
  assert.equal(new NotePage({ _id: 'n8' }).updated, undefined);
});

test("Notebook 集合只保留显式菜单覆盖，不用 note_index 默认遮蔽 note Profile", () => {
  const themeConfig = {
    notebook: { listing: {}, footer: {} },
    layout: { profiles: {
      notebook_index: { path: "/notebooks/" },
      note_index: { navigation: { active_menu: "notebooks" } },
      note: { navigation: { active_menu: "notes" } }
    } }
  };
  const data = {
    "notebooks/default": { name: "默认笔记本" },
    "notebooks/custom": { name: "覆盖笔记本", navigation: { menu: "custom" } }
  };
  const notebooks = getNotebooksObject({
    config: { per_page: 10 },
    theme: { config: themeConfig },
    stellar: { config: parseStellarConfig({ themeConfig }) },
    locals: { get: key => key === "data" ? data : { data: [] } }
  });

  assert.equal(notebooks.tree.default.navigation.menu, undefined);
  assert.equal(notebooks.tree.custom.navigation.menu, "custom");
});
