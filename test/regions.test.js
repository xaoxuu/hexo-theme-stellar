"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { cascadeRegion, resolveLeftbar, resolveRegions } = require("../scripts/lib/regions");
const { resolveWidget } = require("../scripts/lib/widget-registry");

test("Region uses the last explicit widget list while omitted fields inherit", () => {
  const layers = [
    { leftbar: { widgets: ["first"], brand: "site_brand" } },
    { leftbar: { brand: false } },
    { leftbar: { widgets: ["second"] } }
  ];

  assert.deepEqual(cascadeRegion(layers, "leftbar"), ["second"]);
  assert.deepEqual(cascadeRegion([...layers, { leftbar: { widgets: [] } }], "leftbar"), []);
});

test("Leftbar fixed fields cascade independently and enabled false closes the region", () => {
  const resolved = resolveLeftbar([
    { leftbar: { enabled: true, brand: "site_brand", menu: true, footer: { actions: true }, widgets: ["first"] } },
    { leftbar: { brand: false, widgets: ["second"], footer: { actions: false } } }
  ]);
  assert.deepEqual(resolved, {
    enabled: true,
    brand: false,
    menu: true,
    footer: { actions: false },
    widgets: ["second"]
  });

  const disabled = resolveRegions({
    layers: [
      { leftbar: { enabled: true, widgets: ["first"] } },
      { leftbar: { enabled: false } }
    ]
  });
  assert.equal(disabled.leftbar.enabled, false);
  assert.deepEqual(disabled.leftbar.widgets, []);
});

test("Resolved Region instances preserve order, duplicates, and immutability", () => {
  const result = resolveRegions({
    profile: "post",
    catalog: { item: { layout: "item" } },
    layers: [{ leftbar: { widgets: ["item", "item"] } }]
  });

  assert.deepEqual(result.leftbar.widgets.map(widget => widget.id), ["item", "item"]);
  assert.notEqual(result.leftbar.widgets[0].instanceId, result.leftbar.widgets[1].instanceId);
  assert.equal(Object.isFrozen(result.leftbar.widgets), true);
});

test("Unsupported Widget presentations are rejected with a sourced warning", () => {
  const result = resolveRegions({
    profile: "blog_index",
    layers: [{ topbar: { widgets: [{ layout: "timeline" }] } }]
  });

  assert.deepEqual(result.topbar, { widgets: [] });
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].code, "unsupported_widget_presentation");
  assert.equal(result.warnings[0].region, "topbar");
  assert.equal(result.warnings[0].profile, "blog_index");
});

test("Custom Widgets default to content regions and cannot elevate inline capabilities", () => {
  const catalog = { custom: { layout: "custom" } };
  assert.equal(resolveWidget("custom", catalog, { region: "leftbar" }).instance.presentation, "leftbar");
  assert.equal(resolveWidget("custom", catalog, { region: "topbar" }).instance, null);

  const attemptedOverride = resolveWidget({ layout: "timeline", presentations: ["topbar"] }, {}, { region: "topbar" });
  assert.equal(attemptedOverride.instance, null);
  assert.equal(attemptedOverride.warning.code, "unsupported_widget_presentation");
});
