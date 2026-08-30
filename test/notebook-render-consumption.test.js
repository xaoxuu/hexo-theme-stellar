"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function source(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

test("Notebook 详情页要求合法 render 并进入统一原语 Shell", () => {
  const root = source("layout/layout.ejs");
  const page = source("layout/page.ejs");
  assert.match(root, /Notebook 页面 .*缺少合法 PageViewModel\.render/);
  assert.match(root, /renderViewModel = \['post', 'wiki', 'topic', 'notebook'\]\.includes\(activeProfile\) \? activeViewModel : null/);
  assert.match(root, /partial\('_partial\/primitives\/shell'/);
  assert.match(page, /notebookViewModel\.render\.article/);
  assert.doesNotMatch(page, /stellar_data\(['"]notebooks['"]\)/);
});

test("Notebook 总索引、Note 卡片与标签分页只消费生成器显式投影", () => {
  assert.doesNotMatch(source("layout/notebooks.ejs"), /stellar_data\(['"]notebooks['"]\)/);
  assert.match(source("layout/notebooks.ejs"), /page\.notebookIndex\.items/);
  assert.doesNotMatch(source("layout/_partial/main/notebook/notebook_card.ejs"), /stellar_config\(['"]resources\.fallbacks\.projectIcon/);
  assert.doesNotMatch(source("layout/_partial/main/notebook/note_card.ejs"), /stellar_data\(['"]notebooks['"]\)|content_config\(note\)/);
  assert.match(source("layout/notes.ejs"), /page\.notebookIndex\.items/);
  assert.match(source("layout/_partial/main/notebook/note_card.ejs"), /render\.listing/);
});

test("Notebook Brand、搜索、标签树、面包屑与日期只消费显式 ViewModel 或索引 locals", () => {
  for (const relative of [
    "layout/_partial/regions/widgets.ejs",
    "layout/_partial/sidebar/search.ejs",
    "layout/_partial/widgets/tagtree.ejs",
    "layout/_partial/main/navbar/breadcrumb/note.ejs"
  ]) {
    assert.doesNotMatch(source(relative), /stellar_data\(['"]notebooks['"]\)/, relative);
  }
  assert.match(source("layout/layout.ejs"), /topbar: render\.layout\.topbar/);
  assert.match(source("layout/layout.ejs"), /leftbar: render\.layout\.leftbar/);
  assert.match(source("layout/layout.ejs"), /rightbar: render\.layout\.rightbar/);
  assert.match(source("layout/_partial/regions/widgets.ejs"), /activeViewModel\?\.render\?\.layout\?\.brands/);
  assert.match(source("layout/_partial/sidebar/search.ejs"), /notebookViewModel\.render\.layout\.algoliaFilterPath/);
  assert.match(source("layout/_partial/widgets/tagtree.ejs"), /notebookViewModel\.render\.layout\.tagTree/);
  assert.match(source("layout/_partial/main/navbar/breadcrumb/note.ejs"), /notebookViewModel\.render\.layout/);
  assert.match(source("layout/_partial/main/navbar/dateinfo.ejs"), /notebookViewModel\.render\.article/);
});

test("Notebook head、Banner、标签、Footer、评论和脚本只消费显式 render", () => {
  assert.match(source("layout/_partial/head.ejs"), /\['post', 'wiki', 'topic', 'notebook'\]/);
  assert.match(source("layout/_partial/main/navbar/article_banner.ejs"), /\['post', 'wiki', 'topic', 'notebook'\]/);
  assert.match(source("layout/_partial/main/notebook/note_tags.ejs"), /typeof tags !== 'undefined'/);
  assert.doesNotMatch(source("layout/_partial/main/notebook/note_tags.ejs"), /page\.tags|notebook\.tagTree/);
  assert.match(source("layout/page.ejs"), /post_footer'.*footer: article\.footer/);
  assert.match(source("layout/page.ejs"), /comments\/layout'.*comments: article\.comments/);
  assert.match(source("layout/_partial/scripts.ejs"), /\[layout\.topbar, layout\.leftbar, layout\.rightbar\]/);
  assert.doesNotMatch(source("layout/_partial/scripts.ejs"), /layout\.regions/);
});

test("Post、Wiki 与 Topic 的 profile 判定不会误入 Notebook 分支", () => {
  const page = source("layout/page.ejs");
  assert.match(page, /registeredProfile === 'topic'/);
  assert.match(page, /wikiViewModel = page\.viewModel\?\.collection\?\.profile === 'wiki'/);
  assert.match(page, /notebookViewModel = page\.viewModel\?\.collection\?\.profile === 'notebook'/);
});
