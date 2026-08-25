"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { escapeHTML } = require("hexo-util");

let renderer;
global.hexo = {
  extend: { renderer: { register(_extension, _output, registered) { renderer = registered; } } }
};
require("hexo-renderer-ejs");
delete global.hexo;

const ROOT = path.resolve(__dirname, "..");
const file = path.join(ROOT, "layout/_partial/dropdown.ejs");

function render(item) {
  return renderer({ path: file, text: fs.readFileSync(file, "utf8") }, {
    item,
    escape_html: escapeHTML,
    url_for: value => value,
    icon: value => `<svg data-icon="${value}"></svg>`
  }).trim();
}

test("Footer Dropdown 分别渲染 link 与 button 子项并转义 onclick", () => {
  const html = render({
    type: "dropdown",
    icon: "default:theme",
    title: "Color Scheme",
    items: [
      { type: "link", title: "Docs", url: "/wiki/" },
      { type: "button", title: "Dark", onclick: "window.setColorScheme?.('dark')" }
    ]
  });

  assert.match(html, /<a class="dropdown-item[^>]+href="&#x2F;wiki&#x2F;"/);
  assert.match(html, /<button type="button" class="dropdown-item/);
  assert.match(html, /onclick="window\.setColorScheme\?\.\(&#39;dark&#39;\)"/);
  assert.match(html, /<span class="ui-collection__title">Dark<\/span>/);
});

test("Footer Dropdown 不渲染缺少判别类型或目标的子项", () => {
  const html = render({
    type: "dropdown",
    icon: "default:theme",
    title: "Color Scheme",
    items: [
      { title: "Legacy", url: "/legacy/" },
      { type: "button", title: "Missing handler" },
      { type: "link", title: "Missing URL" },
      { type: "button", title: "Auto", onclick: "setColorScheme('auto')" }
    ]
  });
  assert.doesNotMatch(html, /Legacy|Missing/);
  assert.match(html, />Auto<\/span>/);
});
