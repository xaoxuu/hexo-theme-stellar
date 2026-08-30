"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { mergeTrustedInject, pageInjectText } = require("../scripts/lib/config-inject");

test("页面注入只接受最终字符串并原样保留", () => {
  assert.equal(pageInjectText(["<meta name=\"a\">", "  <meta name=\"b\">"]), "");
  assert.equal(pageInjectText("<script>\n  run()\n</script>"), "<script>\n  run()\n</script>");
  assert.equal(pageInjectText(["a", null, 2, "b"]), "");
});

test("合并注入时保留内容并维持站点在前、页面在后的顺序", () => {
  const merged = mergeTrustedInject("site", "page-a\npage-b");
  assert.ok(merged.includes("site"));
  assert.ok(merged.includes("page-a\npage-b"));
  assert.ok(merged.indexOf("site") < merged.indexOf("page-a"));
  assert.equal(mergeTrustedInject("", "page"), "page");
  assert.equal(mergeTrustedInject("site", []), "site");
});
