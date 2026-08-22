"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function source(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

test("普通 Post 详情 partial 只消费显式 locals", () => {
  for (const relative of [
    "layout/_partial/main/article/post_tags.ejs",
    "layout/_partial/main/article/post_footer.ejs",
    "layout/_partial/main/article/post_read_next.ejs",
    "layout/_partial/main/article/post_related.ejs"
  ]) {
    assert.doesNotMatch(source(relative), /\b(?:page|theme|site)\s*[.[]/, relative);
  }
  const pageTemplate = source("layout/page.ejs");
  assert.match(pageTemplate, /postViewModel\.render\.article/);
  assert.match(pageTemplate, /post_footer'.*footer: article\.footer/);
  assert.match(pageTemplate, /comments\/layout'.*comments: article\.comments/);
});

test("Post 卡片与归档条目优先消费 render.listing", () => {
  const card = source("layout/_partial/main/post_list/post_card.ejs");
  const archive = source("layout/_partial/main/post_list/archive_item.ejs");
  assert.doesNotMatch(card, /\bpost\s*[.[]/);
  assert.match(card, /viewModel\.render\.listing/);
  assert.match(archive, /postViewModel\.render\.listing/);
  assert.match(source("layout/index.ejs"), /requirePostViewModel\(post\)\.render\.listing/);
  assert.match(source("layout/_partial/main/pin_slider.ejs"), /viewModel\.render\.listing/);
});

test("Post 列表保留 flat 排序去重，并把 Topic Post 隔离到旧分支", () => {
  const index = source("layout/index.ejs");
  const slider = source("layout/_partial/main/pin_slider.ejs");
  assert.match(index, /flatPins\.sort/);
  assert.match(index, /pinWeight\(b\.post\) - pinWeight\(a\.post\)/);
  assert.match(index, /pinnedPaths\[item\.post\.path\]/);
  assert.match(index, /post_card_legacy/);
  assert.match(index, /post\?\.collection\?\.type === 'topic'/);
  assert.match(slider, /legacyPost/);
  assert.doesNotMatch(source("layout/_partial/main/post_list/post_card.ejs"), /legacyPost/);
});

test("评论 Post 分支从 ViewModel 向服务 partial 传递参数袋", () => {
  const layout = source("layout/_partial/comments/layout.ejs");
  const script = source("layout/_partial/comments/script.ejs");
  assert.match(layout, /explicitComments/);
  assert.match(layout, /\{comments: commentModel\}/);
  assert.match(script, /viewModel\.render\.article\.comments/);
  assert.match(script, /\{comments: postComments\}/);
});
