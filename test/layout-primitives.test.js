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

test("Region 保持既有 DOM、class 与侧栏表面属性", () => {
  assert.equal(
    render("region", { slot: "cover", body: "<span>Cover</span>" }),
    '<div id="l_cover"><span>Cover</span></div>'
  );
  assert.equal(
    render("region", { slot: "left", body: "<span>Left</span>", surface: "card", blur: true }),
    '<aside class="l_left leftbar-card" data-ui-surface="card"><div class="sidebg"></div><div class="leftbar-container leftbar-blur"><span>Left</span></div></aside>'
  );
  assert.equal(
    render("region", { slot: "main", body: "<article>Main</article>" }),
    '<div class="l_main" id="main" data-ui-surface="content"><article>Main</article></div>'
  );
  assert.equal(
    render("region", { slot: "right", body: "<span>Right</span>" }),
    '<aside class="l_right" data-ui-surface="sidebar"><span>Right</span></aside>'
  );
});

test("Shell 转义属性、保留根布局契约并透传受信任区域", () => {
  const html = render("shell", {
    viewModel: {
      collection: { profile: "post" },
      item: { layout: 'post" data-x="1' },
      render: {
        document: { language: 'zh-CN" data-x="1' },
        layout: { pageType: "content", articleStyle: 'story" data-x="1', indent: true }
      }
    },
    preferredTheme: 'dark" data-x="1',
    head: "<head></head>",
    siteBackground: "<div class=\"sitebg\"></div>",
    cover: "<div id=\"l_cover\"></div>",
    regions: "<aside>Regions</aside>",
    menuButton: "<button>Menu</button>",
    scripts: "<script>trusted()</script>",
    escape_html: escapeHtml
  });

  assert.match(html, /^<!DOCTYPE html><html lang="zh-CN&quot; data-x=&quot;1" data-theme="dark&quot; data-x=&quot;1">/);
  assert.match(html, /<div class="l_body content" id="start" layout="post&quot; data-x=&quot;1" type="story&quot; data-x=&quot;1" text-indent>/);
  assert.match(html, /<aside>Regions<\/aside><button>Menu<\/button>/);
  assert.match(html, /<div class="scripts"><script>trusted\(\)<\/script><\/div>/);
  assert.throws(() => render("shell", {
    viewModel: { collection: { profile: "post" } },
    escape_html: escapeHtml
  }), /缺少合法 PageViewModel\.render/);
});

test("Navigation 只接受显式条目并保持菜单激活 class", () => {
  const html = render("navigation", {
    placement: "sidebar",
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
