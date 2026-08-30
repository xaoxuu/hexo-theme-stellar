"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

test("通用 UI Icon 统一尺寸、透明度与纯色交互状态", () => {
  const css = read("source/css/_common/icon.styl");

  assert.match(css, /\.ui-icon[\s\S]*--ui-icon-size, 1\.5rem/);
  assert.match(css, /--ui-icon-opacity: \.5/);
  assert.match(css, /--ui-icon-color: var\(--item-theme, var\(--theme\)\)/);
  assert.match(css, /--ui-icon-opacity: 1/);
  assert.doesNotMatch(css, /gradient|item-grad/);
});

test("Collection 与 Region 控件的主题图标全部使用 ui-icon 包装", () => {
  const files = [
    "layout/_partial/components/collection-item.ejs",
    "layout/_partial/dropdown.ejs",
    "layout/_partial/regions/widgets.ejs",
    "layout/_partial/sidebar/brand.ejs",
    "layout/_partial/widgets/actions.ejs",
    "layout/_partial/widgets/author.ejs",
    "layout/_partial/widgets/ghrepo.ejs",
    "layout/_partial/widgets/ghuser.ejs",
    "layout/_partial/widgets/recent.ejs",
    "layout/_partial/widgets/toc.ejs",
    "scripts/tags/lib/dropdown.js"
  ];

  for (const file of files) {
    const iconLines = read(file).split("\n").filter(line => /\bicon\(/.test(line));
    assert.ok(iconLines.length > 0, `${file} 应包含图标`);
    assert.equal(iconLines.every(line => line.includes("ui-icon")), true, `${file} 的图标应使用 ui-icon 包装`);
  }
});

test("运行时已移除 Collection 图标渐变基础设施", () => {
  const files = [
    "layout/_partial/components/collection-item.ejs",
    "layout/_partial/sidebar/menu.ejs",
    "layout/_partial/widgets/actions.ejs",
    "layout/_partial/widgets/tree.ejs",
    "layout/_partial/widgets/components/linklist.ejs",
    "source/css/_common/svg.styl",
    "source/css/_components/collection.styl",
    "source/css/_components/sidebar/footer.styl",
    "source/css/_defines/theme_base.styl"
  ];
  const runtime = files.map(read).join("\n");

  assert.doesNotMatch(runtime, /ui-collection__leading|gradientId|gradientRef|item-grad|grad-def/);
  assert.equal(fs.existsSync(path.join(ROOT, "layout/_partial/sidebar/grad-def.ejs")), false);
});
