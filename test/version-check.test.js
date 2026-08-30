/* global hexo */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { compareVersions, shouldNotifyUpgrade } = require("../scripts/events/lib/version-check");

test("版本检查遵循 SemVer 顺序并忽略无效本地版本", () => {
  assert.equal(compareVersions("2.0.0-alpha.1", "1.9.0") > 0, true);
  assert.equal(shouldNotifyUpgrade("1.0.0", "1.1.0"), true);
  assert.equal(shouldNotifyUpgrade("2.0.0-alpha.1", "2.0.0-alpha.2"), true);
  assert.equal(shouldNotifyUpgrade("2.0.0-alpha.2", "2.0.0-alpha.1"), false);
  assert.equal(shouldNotifyUpgrade("2.0.0", "2.0.0"), false);
  assert.equal(shouldNotifyUpgrade("invalid", "2.0.0"), false);
});
