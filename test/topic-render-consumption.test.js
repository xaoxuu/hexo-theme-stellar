"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseStellarConfig } = require("../scripts/lib/config-schema");

const ROOT = path.resolve(__dirname, "..");

function source(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

let generator;
global.hexo = {
  extend: {
    generator: {
      register(name, callback) {
        assert.equal(name, "index_topic");
        generator = callback;
      }
    }
  }
};
require("../scripts/generators/topic");

test("Topic 生成器只向索引模板提供显式且已排序的 listing", () => {
  const newer = {
    id: "newer",
    name: "Newer",
    headline: "Newer Topic",
    description: "Newer description",
    cover: "/newer.webp",
    href: "blog/newer",
    latest: { title: "Newer", path: "blog/newer", date: "2026-08-23T00:00:00.000Z" },
    items: [],
    sortDate: "2026-08-23T00:00:00.000Z",
    listed: true
  };
  const older = {
    ...newer,
    id: "older",
    name: "Older",
    href: "blog/older",
    sortDate: "2026-08-20T00:00:00.000Z"
  };
  const hidden = { ...newer, id: "hidden", listed: false };
  const context = Object.assign(global.hexo, {
    stellar: {
      config: parseStellarConfig({ themeConfig: {} }),
      data: { topicIndex: { items: [older, hidden, newer] } }
    }
  });

  const routes = generator.call(context);
  assert.deepEqual(routes[0].data.topicIndex.items.map(item => item.id), ["newer", "older"]);
  assert.equal(routes[0].data.navigation.menu, "post");
});

test("Topic 索引、卡片、博客列表与置顶不再读取原始 Topic tree", () => {
  for (const relative of [
    "layout/index_topic.ejs",
    "layout/_partial/main/post_list/topic_card.ejs"
  ]) {
    assert.doesNotMatch(source(relative), /stellar_data\(['\"]topic['\"]\)/, relative);
  }
  assert.match(source("layout/index_topic.ejs"), /page\.topicIndex\.items/);
  assert.match(source("layout/_partial/main/post_list/topic_card.ejs"), /viewModel\.render\.listing/);
  assert.doesNotMatch(source("layout/index.ejs"), /post_card_legacy/);
  assert.doesNotMatch(source("layout/_partial/main/pin_slider.ejs"), /legacyPost/);
  assert.match(source("layout/archive.ejs"), /\['post', 'topic'\]/);
});

test("Topic 详情页要求合法 render，并与 Notebook 新链隔离", () => {
  const root = source("layout/layout.ejs");
  const page = source("layout/page.ejs");
  assert.match(root, /Topic 页面 .*缺少合法 PageViewModel\.render/);
  assert.match(root, /renderViewModel = \['post', 'wiki', 'topic', 'notebook'\]\.includes\(activeProfile\) \? activeViewModel : null/);
  assert.match(root, /partial\('_partial\/primitives\/shell'/);
  assert.match(page, /registeredProfile === 'topic'/);
  assert.match(page, /post_view_model\(page\)/);
  assert.match(page, /notebookViewModel = page\.viewModel\?\.collection\?\.profile === 'notebook'/);
  assert.match(source("layout/_partial/head.ejs"), /\['post', 'wiki', 'topic', 'notebook'\]/);
});

test("Topic 导航、Region 和辅助 partial 优先消费显式 ViewModel", () => {
  assert.match(source("layout/_partial/main/navbar/article_banner.ejs"), /\['post', 'wiki', 'topic', 'notebook'\]/);
  assert.match(source("layout/_partial/main/navbar/breadcrumb/blog.ejs"), /postViewModel\.collection\.profile === 'topic'/);
  assert.match(source("layout/_partial/widgets/related.ejs"), /topicViewModel\.collection\.navigation\.series/);
  assert.match(source("layout/layout.ejs"), /var regionState = render\.layout\.regions \|\| \{\}/);
  assert.match(source("layout/_partial/regions/widgets.ejs"), /activeViewModel/);
  assert.doesNotMatch(source("layout/_partial/regions/widgets.ejs"), /presentation\.sidebar|sidebar\?\.left|sidebar\?\.right/);
  const dateInfo = source("layout/_partial/main/navbar/dateinfo.ejs");
  assert.match(dateInfo, /postViewModel\.render\.listing\.authorId/);
  assert.match(dateInfo, /: content_config\(page\)\.article\?\.author/);
});
