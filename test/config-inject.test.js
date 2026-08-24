"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { mergeTrustedInject, pageInjectText } = require("../scripts/lib/config-inject");

test("页面注入只接受最终字符串并原样保留", () => {
  assert.equal(pageInjectText(["<meta name=\"a\">", "  <meta name=\"b\">"]), "");
  assert.equal(pageInjectText("<script>\n  run()\n</script>"), "<script>\n  run()\n</script>");
  assert.equal(pageInjectText(["a", null, 2, "b"]), "");
});

test("站点注入在前、页面注入在后且只追加一个换行", () => {
  assert.equal(mergeTrustedInject("site", "page-a\npage-b"), "site\npage-a\npage-b");
  assert.equal(mergeTrustedInject("site\n", "\npage"), "site\n\n\npage");
  assert.equal(mergeTrustedInject("", "page"), "page");
  assert.equal(mergeTrustedInject("site", []), "site");
});
