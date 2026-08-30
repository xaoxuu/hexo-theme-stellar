/* global hexo */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { INSTALL_PACKAGES, PREVIEW_COMMAND, hasProfileOutput } = require("../ci/check-package-integration");

function page(layout, extra) {
  return `<meta property="og:type" content="article"><body data-page-type="content" data-page-layout="${layout}" data-article-style="tech"><div class="site-shell" id="start" data-regions="leftbar rightbar">${extra}</div></body>`;
}

test("包集成标志区分 post/wiki/topic/notebook 的 ViewModel 输出", () => {
  const outputs = {
    post: page("post", ""),
    topic: page("post", '<a class="cap breadcrumb" id="proj" href="/topic/">Integration Topic</a>'),
    wiki: page("page", '<a class="cap breadcrumb" id="proj" href="/wiki/docs-reference/">Product Docs</a>'),
    notebook: page("page", '<a class="cap breadcrumb" href="/notes/integration/">Integration Notebook</a>')
  };
  for (const [profile, html] of Object.entries(outputs)) {
    assert.equal(hasProfileOutput(html, profile), true, profile);
  }
  assert.equal(hasProfileOutput(outputs.post, "topic"), false);
  assert.equal(hasProfileOutput('<body data-page-layout="index"><div class="site-shell" id="start">Classic Blog</div></body>', "post"), false);
});

test("人工验收站点安装固定的 Hexo 预览服务器", () => {
  assert.equal(INSTALL_PACKAGES.includes("hexo-server@3.0.0"), true);
  assert.equal(PREVIEW_COMMAND, "npx hexo server --ip 127.0.0.1");
});
