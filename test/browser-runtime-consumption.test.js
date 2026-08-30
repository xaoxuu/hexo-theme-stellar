"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { CONTRIBUTIONS } = require("../scripts/lib/contribution-registry");

const RUNTIME_CONTRIBUTION_IDS = [
  "runtime-bootstrap",
  "color-scheme-switch",
  "search",
  "lazy-loading",
  "deferred-icons",
  "dropdown",
  "services",
  "comments",
  "settings",
  "link-prefetch",
  "lightbox",
  "reveal",
  "mathjax",
  "katex-stylesheet",
  "diagrams",
  "code-copy",
  "adaptive-text",
  "card-hover",
  "heti",
  "swiper"
];

test("registered browser contributions own an auditable runtime boundary", () => {
  const registered = new Map(CONTRIBUTIONS.map(item => [item.id, item]));
  for (const id of RUNTIME_CONTRIBUTION_IDS) {
    const contribution = registered.get(id);
    assert.ok(contribution, id);
    assert.ok(contribution.entry?.path, id);
    assert.ok(contribution.tests?.some(file => file.startsWith("test/")), id);
  }
});
