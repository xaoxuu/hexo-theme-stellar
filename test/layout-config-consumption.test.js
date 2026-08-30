"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

test("Layout Profile 消费链只读取冻结的 layout.profiles 配置", () => {
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

  assert.match(consumers, /layout\.profiles/);
  assert.doesNotMatch(consumers, /(?:theme|config)\.site_tree|site_tree\s*\[/);
  assert.match(read("layout/index.ejs"), /profiles\.home\.navigation\.activeMenu/);
  assert.match(read("layout/archive.ejs"), /profiles\.blogIndex\.navigation\.activeMenu/);
  assert.match(read("layout/categories.ejs"), /profiles\.blogIndex\.navigation\.activeMenu/);
  assert.match(read("layout/tags.ejs"), /profiles\.blogIndex\.navigation\.activeMenu/);
  assert.match(read("layout/page.ejs"), /profiles\.(?:page|note)\.navigation\.activeMenu/);
  assert.match(read("scripts/generators/notebooks.js"), /notebook\.navigation\.menu \?\? profiles\.noteIndex\.navigation\.activeMenu/);
  assert.doesNotMatch(read("scripts/lib/notebooks.js"), /navigation\.menu \?\?=/);
});

test("主题默认配置只声明最终 Profile ID 与字段名", () => {
  const config = read("_config.yml");

  assert.match(config, /^layout:\n(?: {2}#.*\n)* {2}regions:/m);
  assert.match(config, /^ {2}profiles:/m);
  assert.match(config, /^ {4}blog_index:/m);
  assert.match(config, /^ {6}path: \/blog\//m);
  assert.match(config, /^ {8}active_menu: post/m);
  assert.match(config, /^ {6}listing_nav:\n {8}#.*\n {8}enabled: true/m);
  assert.match(config, /^ {8}tabs: \[\]/m);
  assert.doesNotMatch(config, /^site_tree:/m);
  assert.doesNotMatch(config, /^ {4}(?:index_blog|index_topic|index_wiki|notebooks|notes):/m);
  assert.doesNotMatch(config, /^ {6}(?:base_dir|404):/m);
  assert.doesNotMatch(config, /^ {8}menu:/m);
  assert.doesNotMatch(config, /^ {8}navigation:\n(?: {10}#.*\n)* {10}tabs:/m);
});
