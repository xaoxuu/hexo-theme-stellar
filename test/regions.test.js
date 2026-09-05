"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { cascadeRegion, resolveLeftbar, resolveRegions } = require("../scripts/lib/regions");
const { resolveWidget } = require("../scripts/lib/widget-registry");

test("Region uses the last explicit widget list while omitted fields inherit", () => {
  const layers = [
    { leftbar: { widgets: ["first"], brand: { name: "Site", image: { variant: "avatar" } } } },
    { leftbar: { brand: false } },
    { leftbar: { widgets: ["second"] } }
  ];

  assert.deepEqual(cascadeRegion(layers, "leftbar"), ["second"]);
  assert.deepEqual(cascadeRegion([...layers, { leftbar: { widgets: [] } }], "leftbar"), []);
});

test("Region fixed fields cascade independently and enabled false closes rendering", () => {
  const resolved = resolveLeftbar([
    { leftbar: { enabled: true, brand: { name: "Site", image: { src: "/site.png", variant: "avatar" } }, menu: [{ id: "home" }], footer: { actions: [{ type: "link" }] }, widgets: ["first"] } },
    { leftbar: { brand: { name: null, image: { variant: "icon" } }, menu: [], widgets: ["second"], footer: { actions: [] } } }
  ]);
  assert.deepEqual(resolved, {
    enabled: true,
    brand: { name: null, image: { src: "/site.png", variant: "icon" } },
    menu: [],
    footer: { actions: [] },
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
  assert.deepEqual(disabled.leftbar.menu, []);
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
    layers: [{ topbar: { enabled: true, widgets: [{ layout: "timeline" }] } }]
  });

  assert.deepEqual(result.topbar, { enabled: true, brand: false, menu: [], widgets: [] });
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].code, "unsupported_widget_presentation");
  assert.equal(result.warnings[0].region, "topbar");
  assert.equal(result.warnings[0].profile, "blog_index");
});

test("Widget registry reports generic warnings for unknown and fixed content", () => {
  const unknown = resolveWidget("missing", {}, { region: "rightbar" });
  assert.equal(unknown.instance, null);
  assert.equal(unknown.warning.code, "unknown_widget");

  const fixed = resolveWidget({ layout: "brand" }, {}, { region: "topbar" });
  assert.equal(fixed.instance, null);
  assert.equal(fixed.warning.code, "fixed_region_content");

  const fixedLeftbar = resolveWidget("menu", {}, { region: "leftbar", contentOnly: true });
  assert.equal(fixedLeftbar.instance, null);
  assert.equal(fixedLeftbar.warning.code, "fixed_leftbar_widget");
});

test("Custom Widgets default to content regions and cannot elevate inline capabilities", () => {
  const catalog = { custom: { layout: "custom" } };
  assert.equal(resolveWidget("custom", catalog, { region: "leftbar" }).instance.presentation, "leftbar");
  assert.equal(resolveWidget("custom", catalog, { region: "topbar" }).instance, null);

  const attemptedOverride = resolveWidget({ layout: "timeline", presentations: ["topbar"] }, {}, { region: "topbar" });
  assert.equal(attemptedOverride.instance, null);
  assert.equal(attemptedOverride.warning.code, "unsupported_widget_presentation");
});
