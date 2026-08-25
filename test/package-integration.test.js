/* global hexo */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { hasProfileOutput } = require("../ci/check-package-integration");

function page(layout, extra) {
  return `<meta property="og:type" content="article"><div class="l_body content" id="start" layout="${layout}" type="tech">${extra}</div>`;
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
  assert.equal(hasProfileOutput('<div class="l_body index" id="start">Classic Blog</div>', "post"), false);
});
