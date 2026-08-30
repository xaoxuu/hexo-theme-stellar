"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { UI_CAPABILITIES, composeUiClasses } = require("../scripts/lib/ui-capabilities");

test("UI capability registry is frozen and composes unique class tokens", () => {
  assert.equal(Object.isFrozen(UI_CAPABILITIES), true);
  assert.ok(Object.keys(UI_CAPABILITIES).length > 0);
  for (const value of Object.values(UI_CAPABILITIES)) {
    const tokens = value.trim().split(/\s+/);
    assert.ok(tokens.length > 0);
    assert.equal(new Set(tokens).size, tokens.length);
  }

  const capability = Object.keys(UI_CAPABILITIES)[0];
  const output = composeUiClasses("base duplicate", capability, "duplicate modifier").split(/\s+/);
  assert.equal(output[0], "base");
  assert.equal(output.includes("modifier"), true);
  assert.equal(new Set(output).size, output.length);
  assert.throws(() => composeUiClasses("control", "unknown"), /unknown UI capability/);
});

test("ui_classes helper delegates every capability to the shared registry", () => {
  const registered = new Map();
  global.hexo = {
    extend: {
      helper: {
        register(name, helper) {
          registered.set(name, helper);
        }
      }
    }
  };
  const helperPath = path.resolve(__dirname, "../scripts/helpers/ui_classes.js");
  delete require.cache[helperPath];
  require(helperPath);
  delete global.hexo;

  assert.deepEqual(Array.from(registered.keys()).sort(), ["ui_capabilities", "ui_classes"]);
  for (const capability of Object.keys(UI_CAPABILITIES)) {
    assert.equal(
      registered.get("ui_classes")("base", capability, "modifier"),
      composeUiClasses("base", capability, "modifier")
    );
  }
  assert.equal(registered.get("ui_capabilities")(), UI_CAPABILITIES);
});
