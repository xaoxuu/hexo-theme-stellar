"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const { resolveMenuActiveByPath } = require("../scripts/lib/menu");

let renderer;
global.hexo = {
  extend: { renderer: { register(_extension, _output, registered) { renderer = registered; } } }
};
require("hexo-renderer-ejs");
delete global.hexo;

const MENU_PATH = path.resolve(__dirname, "../layout/_partial/sidebar/menu.ejs");
const MENU_SOURCE = fs.readFileSync(MENU_PATH, "utf8");
const DEFAULT_ITEMS = yaml.load(fs.readFileSync(path.resolve(__dirname, "../_config.yml"), "utf8")).menu.items;
const LANGUAGE_MENUS = Object.fromEntries(["en", "zh-CN", "zh-TW"].map(language => [
  language,
  yaml.load(fs.readFileSync(path.resolve(__dirname, `../languages/${language}.yml`), "utf8")).menu
]));

function activeEntry({ pagePath, activeMenu = "post", explicitMenu, items = DEFAULT_ITEMS }) {
  let entries = [];
  const urlFor = value => {
    const source = String(value || "/");
    return source.startsWith("/") ? source : `/${source}`;
  };
  renderer({ path: MENU_PATH, text: MENU_SOURCE }, {
    page: { path: pagePath, navigation: { menu: activeMenu } },
    where: "leftbar",
    activeMenu,
    content_config() {
      return { navigation: explicitMenu == null ? {} : { menu: explicitMenu } };
    },
    menu_active_by_path(value) {
      return resolveMenuActiveByPath(items, value, urlFor);
    },
    stellar_config(key) {
      if (key === "menu.items") return items;
      if (key === "search.provider") return null;
      return null;
    },
    pretty_url: urlFor,
    __: key => key,
    partial(name, locals) {
      assert.equal(name, "_partial/primitives/navigation");
      entries = locals.entries;
      return "";
    }
  });
  return entries.find(entry => entry.active)?.title || null;
}

test("默认菜单按最长规范化路径精确高亮栏目", () => {
  const cases = [
    ["/index.html", "menu.blog"],
    ["/blog/categories/index.html", "menu.categories"],
    ["/blog/categories/design/index.html", "menu.categories"],
    ["/blog/tags/stellar/", "menu.tags"],
    ["/topic/index.html", "menu.topic"],
    ["/blog/archives/2026/", "menu.archives"],
    ["/friends/index.html", "menu.friends"],
    ["/about/", "menu.about"]
  ];
  for (const [pagePath, title] of cases) {
    assert.equal(activeEntry({ pagePath }), title, pagePath);
  }
});

test("默认菜单文案在三种语言中保持同构且简体中文使用指定名称", () => {
  const keys = ["blog", "categories", "tags", "topic", "archives", "friends", "about"];
  for (const menu of Object.values(LANGUAGE_MENUS)) assert.deepEqual(Object.keys(menu), keys);
  assert.deepEqual(LANGUAGE_MENUS["zh-CN"], {
    blog: "博客",
    categories: "分类",
    tags: "标签",
    topic: "专栏",
    archives: "归档",
    friends: "友链",
    about: "关于"
  });
});

test("显式 navigation.menu 优先于 URL，高亮解析只消费当前自定义菜单", () => {
  assert.equal(activeEntry({ pagePath: "/about/", explicitMenu: "post" }), "menu.blog");

  const customItems = [
    { id: "post", title: "Blog", url: "/" },
    { id: "journal", title: "Journal", url: "/journal/" }
  ];
  assert.equal(activeEntry({ pagePath: "/journal/entry/", items: customItems }), "Journal");
  assert.equal(activeEntry({ pagePath: "/elsewhere/", items: customItems }), "Blog");
});

test("菜单路径解析支持站点子目录并忽略外部链接", () => {
  const items = [
    { id: "root", url: "/" },
    { id: "docs", url: "/docs/" },
    { id: "external", url: "https://example.com/docs/" }
  ];
  const urlFor = value => {
    if (/^https?:/.test(value)) return value;
    return `/subsite/${String(value).replace(/^\/+/, "")}`;
  };
  assert.equal(resolveMenuActiveByPath(items, "/docs/start/index.html", urlFor), "docs");
  assert.equal(resolveMenuActiveByPath(items, "/index.html", urlFor), "root");
});
