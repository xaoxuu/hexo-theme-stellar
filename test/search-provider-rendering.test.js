"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { composeUiClasses } = require("../scripts/lib/ui-capabilities");

let renderer;
global.hexo = {
  extend: { renderer: { register(_extension, _output, registered) { renderer = registered; } } }
};
require("hexo-renderer-ejs");
delete global.hexo;

const MENU_PATH = path.resolve(__dirname, "../layout/_partial/sidebar/menu.ejs");
const DIALOG_PATH = path.resolve(__dirname, "../layout/_partial/search/dialog.ejs");
const MENU_SOURCE = fs.readFileSync(MENU_PATH, "utf8");
const DIALOG_SOURCE = fs.readFileSync(DIALOG_PATH, "utf8");

function translate(key, value) {
  if (key === "btn.search") return "搜索";
  if (key === "search.search") return "站内搜索";
  if (key === "search.search_in") return `在 ${value} 中搜索`;
  if (key === "search.scope") return "搜索域";
  if (key === "search.scope_all") return "全站";
  if (key === "search.scope_blog") return "博客";
  if (key === "search.close") return "关闭搜索";
  if (key === "search.no_results") return "没有找到内容！";
  return key;
}

function renderMenu(provider) {
  let entries = [];
  renderer({ path: MENU_PATH, text: MENU_SOURCE }, {
    page: {},
    viewModel: {
      collection: { profile: "wiki", identity: { name: "Stellar" } },
      render: { layout: { algoliaFilterPath: "wiki/stellar/" } }
    },
    where: "leftbar",
    activeMenu: null,
    content_config() { return { navigation: {} }; },
    stellar_config(key) {
      if (key === "extensions.search.provider") return provider;
      if (key === "site.menu.items") return [{ type: "search" }];
      return null;
    },
    stellar_data() { return { tree: {} }; },
    search_scope() {
      return {
        current: "wiki:stellar",
        currentLabel: "Stellar",
        currentPlaceholder: "在 Stellar 中搜索",
        hasBlog: false
      };
    },
    collection_id() { return ""; },
    pretty_url(value) { return value; },
    __: translate,
    partial(name, locals) {
      assert.equal(name, "_partial/primitives/navigation");
      entries = locals.entries;
      return "";
    }
  });
  return entries[0];
}

function renderDialog(provider) {
  return renderer({ path: DIALOG_PATH, text: DIALOG_SOURCE }, {
    stellar_config(key) {
      return key === "extensions.search.provider" ? provider : null;
    },
    __: translate,
    ui_classes: composeUiClasses,
    icon() { return "<svg></svg>"; },
    escape_html(value) { return String(value); }
  });
}

test("Algolia Collection 入口保留专用 URL 范围且不渲染搜索域", () => {
  const entry = renderMenu("algolia");
  const dialog = renderDialog("algolia");
  assert.equal(entry.attrs["data-algolia-filter-path"], "/wiki/stellar/");
  assert.equal(Object.hasOwn(entry.attrs, "data-search-filter"), false);
  assert.doesNotMatch(dialog, /search-dialog__scope|site-search-scope/);
  assert.doesNotMatch(dialog, /data-search-blog-placeholder/);
});

test("Local Collection 入口不输出任何路径范围并渲染搜索域", () => {
  const entry = renderMenu("local");
  const dialog = renderDialog("local");
  assert.equal(Object.hasOwn(entry.attrs, "data-algolia-filter-path"), false);
  assert.equal(Object.hasOwn(entry.attrs, "data-search-filter"), false);
  assert.match(dialog, /search-dialog__scope/);
  assert.match(dialog, /site-search-scope/);
});
