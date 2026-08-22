"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { mergeTrustedInject, pageInjectText } = require("../scripts/lib/config-inject");

test("页面注入兼容当前数组输入并原样保留字符串", () => {
  assert.equal(pageInjectText(["<meta name=\"a\">", "  <meta name=\"b\">"]), "<meta name=\"a\">\n  <meta name=\"b\">");
  assert.equal(pageInjectText("<script>\n  run()\n</script>"), "<script>\n  run()\n</script>");
  assert.equal(pageInjectText(["a", null, 2, "b"]), "a\nb");
});

test("站点注入在前、页面注入在后且只追加一个换行", () => {
  assert.equal(mergeTrustedInject("site", ["page-a", "page-b"]), "site\npage-a\npage-b");
  assert.equal(mergeTrustedInject("site\n", "\npage"), "site\n\n\npage");
  assert.equal(mergeTrustedInject("", "page"), "page");
  assert.equal(mergeTrustedInject("site", []), "site");
});
