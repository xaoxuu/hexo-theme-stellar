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

test("主题 profile 校验不再接受旧内容根，Collection / Front Matter 边界仍保留", () => {
  const contentConfig = read("scripts/lib/content-config.js");
  const themeProfiles = contentConfig.slice(
    contentConfig.indexOf("function validatePostProfileConfig"),
    contentConfig.indexOf("function validateCollectionConfig")
  );
  const collectionAndPage = contentConfig.slice(contentConfig.indexOf("function validateCollectionConfig"));

  assert.doesNotMatch(themeProfiles, /config\.(?:article|notebook)/);
  assert.match(collectionAndPage, /config\.article/);
  assert.doesNotMatch(contentConfig, /function validateNotebookProfileConfig/);
});

test("主题默认与 Stylus 只声明最终内容路径", () => {
  const config = read("_config.yml");
  const styles = [
    "source/css/_components/list.styl",
    "source/css/_components/pin-slider.styl",
    "source/css/_components/partial/article-banner.styl"
  ].map(read).join("\n");

  assert.match(config, /^content:\n {2}article:/m);
  assert.match(config, /^ {4}listing:/m);
  assert.match(config, /^ {6}pinned_layout: carousel/m);
  assert.match(config, /^ {2}notebook:/m);
  assert.doesNotMatch(config, /^(?:article|notebook):/m);
  assert.match(styles, /content\.article\.listing\.cover_ratio/);
  assert.match(styles, /content\.article\.banner\.ratio/);
  assert.doesNotMatch(styles, /hexo-config\('article\./);
});
