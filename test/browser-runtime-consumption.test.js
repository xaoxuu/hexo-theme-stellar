"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { CONTRIBUTIONS } = require("../scripts/lib/contribution-registry");

test("registered browser modules load and export the runtime mount entry", async () => {
  for (const contribution of CONTRIBUTIONS) {
    if (contribution.entry.type !== "browser-module") continue;
    const file = path.join(__dirname, "../source", contribution.entry.path);
    const module = await import(pathToFileURL(file).href);
    assert.equal(typeof module.mount, "function", contribution.id);
  }
});
