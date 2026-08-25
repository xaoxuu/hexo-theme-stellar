/* global hexo */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { compareVersions, shouldNotifyUpgrade } = require("../scripts/events/lib/version-check");

test("版本检查遵循 SemVer 顺序且不把 v2 候选提示降级到 v1 latest", () => {
  assert.equal(compareVersions("2.0.0-alpha.1", "1.44.0") > 0, true);
  assert.equal(shouldNotifyUpgrade("2.0.0-alpha.1", "1.44.0"), false);
  assert.equal(shouldNotifyUpgrade("1.43.0", "1.44.0"), true);
  assert.equal(shouldNotifyUpgrade("2.0.0-alpha.1", "2.0.0-alpha.2"), true);
  assert.equal(shouldNotifyUpgrade("2.0.0-alpha.2", "2.0.0-alpha.1"), false);
  assert.equal(shouldNotifyUpgrade("2.0.0-alpha.2", "2.0.0"), true);
  assert.equal(shouldNotifyUpgrade("2.0.0", "2.0.0"), false);
  assert.equal(shouldNotifyUpgrade("invalid", "2.0.0"), false);
});
