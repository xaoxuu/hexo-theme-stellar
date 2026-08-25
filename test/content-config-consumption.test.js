"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

test("Article 与 Notebook 消费链只读取冻结的 content 配置", () => {
  const consumers = [
    "scripts/lib/models/index.js",
    "scripts/lib/notebooks.js",
    "scripts/filters/lib/page-view-model.js",
    "scripts/helpers/ai_label.js",
    "scripts/helpers/category_color.js",
    "scripts/helpers/related_posts.js",
    "layout/index.ejs",
    "layout/layout.ejs",
    "layout/page.ejs",
    "layout/_partial/main/article/article_footer.ejs",
    "layout/_partial/main/article/related_posts.ejs",
    "layout/_partial/main/navbar/article_banner.ejs",
    "layout/_partial/main/navbar/nav_tabs_blog.ejs",
    "layout/_partial/main/post_list/post_card_legacy.ejs",
    "layout/_partial/widgets/tagtree.ejs"
  ].map(read).join("\n");

  assert.match(consumers, /content\.article/);
  assert.match(consumers, /content\.notebook/);
  assert.doesNotMatch(consumers, /themeConfig\.(?:article|notebook)/);
  assert.doesNotMatch(consumers, /theme\.config\.(?:article|notebook)/);
  assert.doesNotMatch(consumers, /theme\.(?:article|notebook)(?:\.|\?)/);
});

test("Collection / Front Matter 复用声明式解析器且消费链不再读取旧字段", () => {
  const contentConfig = read("scripts/lib/content-config.js");
  const schema = read("scripts/schema/content-config-schema.js");
  const consumers = [
    "scripts/events/lib/content-config.js",
    "scripts/events/lib/doc_tree.js",
    "scripts/events/lib/topic_tree.js",
    "scripts/lib/doc_tree.js",
    "scripts/lib/notebooks.js",
    "scripts/lib/models/index.js",
    "layout/_partial/scripts/runtime.ejs",
    "scripts/lib/browser-runtime.js",
    "layout/layout.ejs",
    "layout/index.ejs",
    "layout/archive.ejs",
    "layout/_partial/main/pin_slider.ejs",
    "layout/_partial/head.ejs",
    "layout/_partial/scripts.ejs"
  ].map(read).join("\n");

  assert.match(contentConfig, /parseConfigSchema\(COLLECTION_CONFIG_SCHEMA/);
  assert.match(contentConfig, /parseConfigSchema\(FRONT_MATTER_CONFIG_SCHEMA/);
  assert.match(schema, /CONFIG_TARGET_FIELDS/);
  assert.doesNotMatch(contentConfig, /function validate(?:Collection|Page|Routing|Comments)/);
  assert.doesNotMatch(consumers, /collection\?*\.type|collectionConfig\.routing|\.routing\?*\.base_dir|collectionConfig\.note\?*\.sidebar|frontMatter\.open_graph|page\.open_graph|page\.inject|page\[id\]/);
});

test("完整内容集合只经过单一 Collection Pipeline 入口", () => {
  const events = read("scripts/events/index.js");
  const adapters = [
    "scripts/lib/collection-pipeline/adapters/wiki.js",
    "scripts/lib/collection-pipeline/adapters/notebook.js"
  ].map(read).join("\n");
  const groupedConsumers = [
    "scripts/events/lib/doc_tree.js",
    "scripts/events/lib/notebooks.js"
  ].map(read).join("\n");
  const pipelineCall = "require(\"../lib/collection-pipeline\").runCollectionPipeline(hexo)";
  assert.equal(events.split(pipelineCall).length - 1, 1);
  assert.doesNotMatch(events, /lib\/(?:content-config|doc_tree|topic_tree|notebooks)\"\)\(hexo\)/);
  assert.match(adapters, /\(pipeline\.ctx, pipeline\)/);
  assert.match(groupedConsumers, /pipeline\.members\(\"wiki\"\)/);
  assert.match(groupedConsumers, /pipeline\.members\(\"notebook\"\)/);
});

test("生成器、helper 与后处理链只消费冻结 Front Matter", () => {
  const consumers = [
    "scripts/generators/notebooks.js",
    "scripts/generators/search.js",
    "scripts/events/lib/merge_posts.js",
    "scripts/helpers/brand.js",
    "scripts/helpers/collection.js",
    "scripts/helpers/json_ld.js",
    "scripts/helpers/mdrender.js",
    "layout/index.ejs",
    "layout/archive.ejs",
    "layout/_partial/main/navbar/ghinfo.ejs",
    "layout/_partial/main/pin_slider.ejs",
    "layout/_partial/main/notebook/note_card.ejs",
    "layout/_partial/main/post_list/post_card_legacy.ejs",
    "layout/_partial/widgets/ghissues.ejs",
    "layout/_partial/widgets/ghrepo.ejs"
  ].map(read).join("\n");

  assert.match(consumers, /stellarConfig/);
  assert.match(consumers, /pageConfigs/);
  assert.match(consumers, /getPageConfig/);
  assert.match(consumers, /content_config\(page\)/);
  assert.doesNotMatch(consumers, /collection:\s*\{\s*type:/);
  assert.doesNotMatch(consumers, /\b(?:post|note)\.(?:collection|visibility|listing|card|article)\b/);
  assert.doesNotMatch(consumers, /(?:getCollectionId|isListed|isSearchable)\((?:page|post),/);
  assert.doesNotMatch(consumers, /page\.source\.repository/);
});

test("主题默认与 Stylus 只声明最终内容路径", () => {
  const config = read("_config.yml");
  const styles = [
    "source/css/_components/list.styl",
    "source/css/_components/pin-slider.styl",
    "source/css/_components/partial/article-banner.styl"
  ].map(read).join("\n");

  assert.match(config, /^content:\n(?: {2}#.*\n)* {2}article:/m);
  assert.match(config, /^ {4}listing:/m);
  assert.match(config, /^ {6}pinned_layout: carousel/m);
  assert.match(config, /^ {2}notebook:/m);
  assert.doesNotMatch(config, /^(?:article|notebook):/m);
  assert.match(styles, /content\.article\.listing\.cover_ratio/);
  assert.match(styles, /content\.article\.banner\.ratio/);
  assert.doesNotMatch(styles, /hexo-config\('article\./);
});
