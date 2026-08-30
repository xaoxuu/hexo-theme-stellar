"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

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

const ROOT = path.resolve(__dirname, "..");
const PRIMITIVES = path.join(ROOT, "layout/_partial/primitives");

function source(name) {
  return fs.readFileSync(path.join(PRIMITIVES, `${name}.ejs`), "utf8");
}

function render(name, locals) {
  return renderer({
    path: path.join(PRIMITIVES, `${name}.ejs`),
    text: source(name)
  }, locals).trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

test("五类布局原语只消费显式 locals，并封闭 slot 与 kind", () => {
  for (const name of ["shell", "region", "section", "item", "navigation"]) {
    assert.doesNotMatch(source(name), /\b(?:page|theme|site|config)\s*[.[]/);
  }
  assert.throws(() => render("item", { kind: "unknown", body: "x" }), /未知 kind unknown/);
  assert.throws(() => render("section", { slot: "unknown", items: [] }), /未知 slot unknown/);
  assert.throws(() => render("region", { slot: "unknown", body: "" }), /未知 slot unknown/);
  assert.throws(() => render("navigation", {
    placement: "unknown",
    entries: [],
    partial() { return ""; }
  }), /未知 placement unknown/);
});

test("Item 与 Section 透传受信任 body，不进行二次转义", () => {
  const body = '<strong data-value="trusted">Body</strong>';
  assert.equal(render("item", { kind: "content", body }), body);
  assert.equal(render("section", { slot: "content", items: ["<i>A</i>", "<b>B</b>"] }), "<i>A</i><b>B</b>");
});

test("Region 输出 Topbar、Leftbar 与 Rightbar 语义 DOM", () => {
  assert.equal(
    render("region", { slot: "topbar", body: "<span>Top</span>" }),
    '<header id="topbar-region" class="site-region site-region--topbar ui-surface" data-region="topbar"><div class="site-region__viewport"><span>Top</span></div></header>'
  );
  assert.equal(
    render("region", { slot: "leftbar", body: "<span>Left</span>" }),
    '<aside id="leftbar-region" class="site-region site-region--leftbar" data-region="leftbar" aria-label="Leftbar"><div class="site-region__surface ui-surface"><div class="site-region__decoration" aria-hidden="true"></div><div class="site-region__viewport"><span>Left</span></div></div></aside>'
  );
  assert.equal(
    render("region", { slot: "rightbar", body: "<span>Right</span>" }),
    '<aside id="rightbar-region" class="site-region site-region--rightbar" data-region="rightbar" aria-label="Rightbar"><div class="site-region__surface ui-drawer-surface"><div class="site-region__viewport"><span>Right</span></div></div></aside>'
  );
  assert.throws(() => render("region", { slot: "main", body: "" }), /未知 slot main/);
});

test("Shell 转义属性、保留根布局契约并透传受信任区域", () => {
  const html = render("shell", {
    documentModel: { language: 'zh-CN" data-x="1', preferredTheme: 'dark" data-x="1' },
    pageModel: { pageType: "content", layout: 'post" data-x="1', articleStyle: 'story" data-x="1', indent: true },
    head: "<head></head>",
    siteBackground: "<div class=\"sitebg\"></div>",
    cover: "<div id=\"site-cover\"></div>",
    regions: { topbar: "<header>Top</header>", leftbar: "<aside>Left</aside>", rightbar: "<aside>Right</aside>" },
    main: "<article>Main</article>",
    controls: "<button>Menu</button>",
    scripts: "<script>trusted()</script>",
    escape_html: escapeHtml
  });

  assert.match(html, /^<!DOCTYPE html><html lang="zh-CN&quot; data-x=&quot;1" data-theme="dark&quot; data-x=&quot;1">/);
  assert.doesNotMatch(html, /data-appearance/);
  assert.match(html, /<body data-page-type="content" data-page-layout="post&quot; data-x=&quot;1" data-article-style="story&quot; data-x=&quot;1" data-text-indent>/);
  assert.match(html, /<div class="site-shell" id="start" data-regions="topbar leftbar rightbar"><header>Top<\/header><div class="site-workspace"><aside>Left<\/aside><main class="site-main" id="main"><article>Main<\/article><\/main><aside>Right<\/aside><\/div>/);
  assert.match(html, /<div class="site-scripts"><script>trusted\(\)<\/script><\/div>/);
});

test("Navigation 只接受显式条目并保持菜单激活 class", () => {
  const html = render("navigation", {
    placement: "leftbar",
    entries: [
      { title: "Blog", active: true },
      { title: "Wiki", active: false }
    ],
    partial(name, locals) {
      assert.equal(name, "_partial/components/collection");
      return locals.options.items.map(item => (
        `<a class="${item.active ? "active" : ""}">${item.title}</a>`
      )).join("");
    }
  });
  assert.equal(html, '<nav class="menu dis-select"><a class="active">Blog</a><a class="">Wiki</a></nav>');
});
