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
    "layout/_partial/scripts/runtime.ejs",
    "scripts/lib/browser-runtime.js",
    "source/js/runtime/extensions/feature.mjs",
    "scripts/lib/models/index.js",
    "scripts/schema/model-schema.js",
    "source/css/_custom.styl",
    "source/css/_common/base.styl",
    "source/css/_common/button.styl",
    "source/css/_common/highlight.styl",
    "source/css/_components/main.styl",
    "source/css/_components/sidebar/brand.styl",
    "source/css/_components/sidebar/search.styl",
    "source/css/_components/sidebar/sidebar.styl"
  ].map(read).join("\n");

  assert.match(config, /^appearance:/m);
  assert.doesNotMatch(config, /^(?:style|default):/m);
  assert.match(consumers, /appearance\.typography\.font_family\.body/);
  assert.match(consumers, /appearance\.typography\.font_family\.code/);
  assert.match(consumers, /appearance\.typography\.content_align/);
  assert.match(consumers, /appearance\.colors\.primary/);
  assert.match(consumers, /appearance\.backgrounds\.sidebar/);
  assert.equal(fs.existsSync(path.join(ROOT, "source/css/_components/page-transition.styl")), false);
  assert.doesNotMatch(config, /page_transition/);
  assert.doesNotMatch(consumers, /page_transition|view-transition/);
  assert.doesNotMatch(consumers, /theme\.style|themeConfig\.style|hexo-config\('style\./);
  assert.doesNotMatch(consumers, /appearance\.gradients\.angle|highlightTheme|backgrounds\.(?:sidebar|page)\.blur/);
  assert.match(sidebar, /sidebar-background-filter\(\$opacity\)[\s\S]*--background-opacity: \$opacity/);
  assert.match(sidebar, /sidebar-background-(?:gradient|image)\([^\n]*hexo-config\('appearance\.backgrounds\.sidebar\.opacity'\)/);
  assert.doesNotMatch(sidebar, /if hexo-config\('appearance\.backgrounds\.sidebar\.opacity'\)/);
});

test("资源兜底消费链只读取三个公开 fallback，固定资源来自内部常量", () => {
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
  assert.match(consumers, /INTERNAL\.resources/);
  assert.match(read("layout/404.ejs"), /resources\.errorPage\.image/);
  assert.doesNotMatch(consumers, /fallbacks\.(?:projectIcon|banner|topicCover|image|errorPage)/);
  assert.doesNotMatch(consumers, /theme\.default|config\.default/);
  assert.match(read("source/css/_common/loading.styl"), /var\(--text-loading\)/);
  assert.doesNotMatch(read("source/css/_common/loading.styl"), /style\.loading/);
  for (const language of ["en", "zh-CN", "zh-TW"]) {
    const source = read(`languages/${language}.yml`);
    assert.match(source, /^ {2}loading:/m);
    assert.match(source, /^ {2}loading_failed:/m);
  }
});
