/* global hexo */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { shortSha } = require("../ci/check-release-docs");

test("提交登记固定使用七位 SHA，不受 Git 自动缩写长度影响", () => {
  assert.equal(shortSha("5b27db67d4fe"), "5b27db6");
  assert.equal(shortSha("11B637BC"), "11b637b");
});
