"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

test("主题默认、模板、模型与 Stylus 只消费最终 Appearance 路径", () => {
  const config = read("_config.yml");
  const sidebar = read("source/css/_components/sidebar/sidebar.styl");
  const consumers = [
    "layout/layout.ejs",
    "layout/_partial/head.ejs",
    "layout/_partial/sidebar/brand.ejs",
    "layout/_partial/sidebar/grad-def.ejs",
    "layout/_plugins/mermaid.ejs",
    "scripts/lib/models/index.js",
    "scripts/schema/model-schema.js",
    "source/css/_custom.styl",
    "source/css/_common/base.styl",
    "source/css/_common/button.styl",
    "source/css/_common/highlight.styl",
    "source/css/_components/main.styl",
    "source/css/_components/page-transition.styl",
    "source/css/_components/sidebar/brand.styl",
    "source/css/_components/sidebar/search.styl",
    "source/css/_components/sidebar/sidebar.styl"
  ].map(read).join("\n");

  assert.match(config, /^appearance:/m);
  assert.doesNotMatch(config, /^(?:style|default):/m);
  assert.match(consumers, /appearance\.typography\.font_family\.body/);
  assert.match(consumers, /appearance\.backgrounds\.sidebar/);
  assert.match(consumers, /appearance\.motion\.page_transition/);
  assert.doesNotMatch(consumers, /theme\.style|themeConfig\.style|hexo-config\('style\./);
  assert.match(sidebar, /--background-opacity: hexo-config\('appearance\.backgrounds\.sidebar\.opacity'\)/);
  assert.doesNotMatch(sidebar, /if hexo-config\('appearance\.backgrounds\.sidebar\.opacity'\)/);
});

test("资源兜底消费链只读取 resources.fallbacks 并内部化加载文案", () => {
  const consumers = [
    "layout/404.ejs",
    "layout/_partial/scripts/defines.ejs",
    "layout/_partial/main/notebook/notebook_card.ejs",
    "layout/_partial/main/post_list/latest_post_card.ejs",
    "layout/_partial/main/post_list/topic_card.ejs",
    "scripts/helpers/brand.js",
    "scripts/helpers/json_ld.js",
    "scripts/filters/lib/img_onerror.js",
    "scripts/tags/lib/albums.js",
    "scripts/tags/lib/banner.js",
    "scripts/tags/lib/chat.js",
    "scripts/tags/lib/friends.js",
    "scripts/tags/lib/image.js",
    "scripts/tags/lib/link.js",
    "scripts/tags/lib/posters.js",
    "scripts/tags/lib/sites.js"
  ].map(read).join("\n");

  assert.match(consumers, /resources\.fallbacks/);
  assert.doesNotMatch(consumers, /theme\.default|config\.default/);
  assert.match(read("source/css/_common/loading.styl"), /var\(--text-loading\)/);
  assert.doesNotMatch(read("source/css/_common/loading.styl"), /style\.loading/);
  for (const language of ["en", "zh-CN", "zh-TW"]) {
    const source = read(`languages/${language}.yml`);
    assert.match(source, /^ {2}loading:/m);
    assert.match(source, /^ {2}loading_failed:/m);
  }
});
