"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { composeUiClasses } = require("../scripts/lib/ui-capabilities");

let renderer;
global.hexo = {
  extend: {
    renderer: {
      register(extension, output, registered) {
        assert.equal(extension, "ejs");
        assert.equal(output, "html");
        renderer = registered;
      }
    }
  }
};
require("hexo-renderer-ejs");
delete global.hexo;

const TEMPLATE = path.resolve(__dirname, "../layout/_partial/components/collection-item.ejs");
const SOURCE = fs.readFileSync(TEMPLATE, "utf8");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function render(item) {
  return renderer({ path: TEMPLATE, text: SOURCE }, {
    item,
    ui_classes: composeUiClasses,
    escape_html: escapeHtml,
    icon(name) { return `<svg data-icon="${escapeHtml(name)}"></svg>`; },
    partial() { return ""; }
  }).trim();
}

test("Collection Item 的 button 类型复用 Link 视觉并只透传安全属性", () => {
  const html = render({
    type: "button",
    title: "Search",
    icon: "default:search",
    iconOnly: true,
    className: "search-trigger",
    attrs: {
      "aria-label": "Search <site>",
      "data-shell-action": "open-search",
      "data-algolia-filter-path": "/wiki/stellar/",
      onclick: "alert(1)",
      style: "display:none"
    }
  });

  assert.match(html, /^<button class="ui-collection__item ui-interactive card-hover card-hover--spotlight is-icon-only search-trigger" type="button"/);
  assert.match(html, /aria-label="Search &lt;site&gt;"/);
  assert.match(html, /data-shell-action="open-search"/);
  assert.match(html, /data-algolia-filter-path="\/wiki\/stellar\/"/);
  assert.doesNotMatch(html, /href=|onclick=|style=/);
  assert.match(html, /class="ui-icon"/);
  assert.doesNotMatch(html, /ui-collection__leading|item-grad|grad-def/);
  assert.doesNotMatch(html, /ui-collection__content/);
});

test("Collection Item 未声明 type 时保持 Link 输出", () => {
  const html = render({ href: "/blog/", title: "Blog" });
  assert.match(html, /^<a class="ui-collection__item ui-interactive/);
  assert.match(html, /href="\/blog\/"/);
  assert.match(html, /ui-collection__content/);
});
