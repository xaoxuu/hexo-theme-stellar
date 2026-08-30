"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");

test("搜索域与 Radio 标签复用浅色模式可见的通用单选样式", () => {
  const inputStyles = read("source/css/_common/input.styl");
  const searchStyles = read("source/css/_components/sidebar/search.styl");
  const searchDialog = read("layout/_partial/search/dialog.ejs");
  const tagRenderer = read("scripts/tags/lib/checkbox.js");

  assert.match(inputStyles, /\.ui-radio[\s\S]*?appearance: none/);
  assert.match(inputStyles, /\.ui-radio[\s\S]*?border: 2px solid var\(--text-p3\)/);
  assert.match(inputStyles, /&:checked[\s\S]*?border-color: var\(--theme\)/);
  assert.match(inputStyles, /&:checked:before[\s\S]*?background: var\(--theme\)[\s\S]*?transform: scale\(1\)/);
  assert.match(searchDialog, /<input class="ui-radio" type="radio"/);
  assert.match(tagRenderer, /type === 'radio' \? 'ui-radio' : ''/);
  assert.doesNotMatch(searchStyles, /input\[type=['"]radio['"]\]/);
});
