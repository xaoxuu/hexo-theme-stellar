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
  return renderer({ path: path.join(PRIMITIVES, `${name}.ejs`), text: source(name) }, locals).trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

test("Layout primitives consume explicit locals and reject unknown variants", () => {
  for (const name of ["shell", "region", "section", "item", "navigation"]) {
    assert.doesNotMatch(source(name), /\b(?:page|theme|site|config)\s*[.[]/);
  }
  assert.throws(() => render("item", { kind: "unknown", body: "x" }), /未知 kind unknown/);
  assert.throws(() => render("section", { slot: "unknown", items: [] }), /未知 slot unknown/);
  assert.throws(() => render("region", { slot: "unknown", body: "" }), /未知 slot unknown/);
});

test("Layout primitives preserve trusted slots without a second escape pass", () => {
  const body = '<strong data-value="trusted">Body</strong>';
  assert.equal(render("item", { kind: "content", body }), body);
  assert.equal(render("section", { slot: "content", items: [body] }), body);
});

test("Shell escapes document attributes while preserving trusted render slots", () => {
  const html = render("shell", {
    documentModel: { language: 'zh-CN" data-x="1', preferredTheme: "dark" },
    pageModel: { pageType: "content", layout: "post", articleStyle: "tech", indent: false },
    head: "<head></head>",
    siteBackground: "",
    cover: "",
    regions: { topbar: "", leftbar: "", rightbar: "" },
    main: "<article>trusted</article>",
    controls: "",
    scripts: "",
    escape_html: escapeHtml
  });
  assert.match(html, /lang="zh-CN&quot; data-x=&quot;1"/);
  assert.match(html, /<article>trusted<\/article>/);
  assert.doesNotMatch(html, /<html lang="zh-CN" data-x="1"/);
});
