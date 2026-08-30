"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

test("Layout Profile 消费链只读取冻结的顶层 profiles 配置", () => {
  const consumers = [
    "scripts/generators/404.js",
    "scripts/generators/author.js",
    "scripts/generators/notebooks.js",
    "scripts/generators/topic.js",
    "scripts/generators/wiki.js",
    "scripts/events/lib/authors.js",
    "scripts/events/lib/doc_tree.js",
    "scripts/lib/doc_tree.js",
    "scripts/lib/models/index.js",
    "scripts/lib/notebooks.js",
    "layout/index.ejs",
    "layout/archive.ejs",
    "layout/categories.ejs",
    "layout/tags.ejs",
    "layout/page.ejs",
    "layout/_partial/sidebar/brand.ejs",
    "layout/_partial/regions/widgets.ejs",
    "layout/_partial/main/listing_nav/blog.ejs",
    "layout/_partial/main/listing_nav/wiki.ejs",
    "layout/_partial/main/navbar/breadcrumb/blog.ejs",
    "layout/_partial/main/navbar/breadcrumb/note.ejs",
    "layout/_partial/main/navbar/breadcrumb/wiki.ejs"
  ].map(read).join("\n");

  assert.match(consumers, /stellarConfig\?\.profiles|stellar_config\(['"]profiles\./);
  assert.doesNotMatch(consumers, /(?:theme|config)\.site_tree|site_tree\s*\[/);
  assert.match(read("layout/index.ejs"), /profiles\.home\.activeMenu/);
  assert.match(read("layout/archive.ejs"), /profiles\.blogIndex\.activeMenu/);
  assert.match(read("layout/categories.ejs"), /profiles\.blogIndex\.activeMenu/);
  assert.match(read("layout/tags.ejs"), /profiles\.blogIndex\.activeMenu/);
  assert.match(read("layout/page.ejs"), /profiles\.(?:page|note)\.activeMenu/);
  assert.match(read("scripts/generators/notebooks.js"), /notebook\.navigation\.menu \?\? profiles\.noteIndex\.activeMenu/);
  assert.doesNotMatch(read("scripts/lib/notebooks.js"), /navigation\.menu \?\?=/);
});

test("主题默认配置只声明最终 Profile ID 与字段名", () => {
  const config = read("_config.yml");

  assert.match(config, /^topbar:/m);
  assert.match(config, /^leftbar:/m);
  assert.match(config, /^rightbar:/m);
  assert.doesNotMatch(config, /^regions:/m);
  assert.match(config, /^profiles:/m);
  assert.match(config, /^ {2}blog_index:/m);
  assert.match(config, /^ {4}path: \/blog\//m);
  assert.match(config, /^ {4}active_menu: post/m);
  assert.match(config, /^ {4}listing_nav:/m);
  assert.match(config, /^ {6}tabs: \[\]/m);
  assert.doesNotMatch(config, /^site_tree:/m);
  assert.doesNotMatch(config, /^ {2}(?:index_blog|index_topic|index_wiki|notebooks|notes):/m);
  assert.doesNotMatch(config, /^ {4}(?:base_dir|404):/m);
  assert.doesNotMatch(config, /^ {6}navigation:/m);
});
