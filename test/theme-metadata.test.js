"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const metadata = require("../scripts/lib/theme-metadata");
const pkg = require("../package.json");

test("主题元数据来自 package.json 且核心资源由内部清单固定", () => {
  assert.equal(metadata.name, "Stellar");
  assert.equal(metadata.version, pkg.version);
  assert.equal(metadata.homepage, pkg.homepage);
  assert.equal(metadata.repository, "https://github.com/xaoxuu/hexo-theme-stellar");
  assert.deepEqual(metadata.assets, { mainCss: "/css/main.css", mainJs: "/js/main.js" });
  assert.equal(Object.isFrozen(metadata), true);
  assert.equal(Object.isFrozen(metadata.assets), true);
});
