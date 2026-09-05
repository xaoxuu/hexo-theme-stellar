"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveCommentsModel } = require("../scripts/lib/comments");

function config(overrides = {}) {
  return {
    appearance: { colorScheme: "dark" },
    comments: {
      enabled: true,
      title: "Comments",
      provider: "giscus",
      giscus: {
        "data-repo": "owner/repo",
        "data-theme": "preferred_color_scheme"
      },
      ...overrides
    }
  };
}

test("评论模型一次性解析 provider、页面覆盖与配色", () => {
  const model = resolveCommentsModel(config(), {
    id: "post-id",
    options: { "data-category": "General" }
  }, "Post");
  assert.deepEqual(model, {
    enabled: true,
    title: "Comments",
    id: "post-id",
    service: "giscus",
    options: {
      "data-repo": "owner/repo",
      "data-theme": "dark",
      "data-category": "General"
    },
    pageTitle: "Post"
  });
  assert.equal(Object.isFrozen(model), true);
  assert.equal(Object.isFrozen(model.options), true);
});

test("评论模型关闭时仍保留唯一的 Runtime provider 投影", () => {
  const model = resolveCommentsModel(config(), { enabled: false }, "Page");
  assert.equal(model.enabled, false);
  assert.equal(model.service, "giscus");
  assert.equal("giscus" in model, false);
});
