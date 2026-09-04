"use strict";

const REGION_PRESENTATIONS = Object.freeze({
  topbar: "topbar",
  leftbar: "leftbar",
  rightbar: "rightbar"
});

const DEFAULT_PRESENTATIONS = Object.freeze(["leftbar", "rightbar", "drawer"]);

const PRESENTATIONS_BY_LAYOUT = Object.freeze({
  menu: Object.freeze(["topbar", "leftbar", "leftbarRail", "drawer"]),
  settings: Object.freeze(["topbar", "leftbar", "leftbarRail", "drawer"]),
  spacer: Object.freeze(["topbar"]),
  toc: Object.freeze(["topbar", "leftbar", "rightbar", "drawer"]),
  tree: Object.freeze(["leftbar", "rightbar", "drawer"]),
  tagtree: Object.freeze(["leftbar", "rightbar", "drawer"]),
  recent: Object.freeze(["leftbar", "rightbar", "drawer"]),
  related: Object.freeze(["leftbar", "rightbar", "drawer"]),
  ghrepo: Object.freeze(["leftbar", "rightbar", "drawer"]),
  ghissues: Object.freeze(["leftbar", "rightbar", "drawer"]),
  ghuser: Object.freeze(["leftbar", "rightbar", "drawer"]),
  author: Object.freeze(["leftbar", "rightbar", "drawer"]),
  timeline: Object.freeze(["leftbar", "rightbar", "drawer"]),
  markdown: Object.freeze(["leftbar", "rightbar", "drawer"])
});

const SYSTEM_WIDGETS = Object.freeze({
  menu: Object.freeze({ layout: "menu", system: true }),
  settings: Object.freeze({ layout: "settings", system: true }),
  spacer: Object.freeze({ layout: "spacer", system: true })
});

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value == null || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
}

function freeze(value) {
  if (value == null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(freeze);
  return Object.freeze(value);
}

function normalizedPresentations(descriptor, layout) {
  if (Array.isArray(descriptor?.presentations)) return Object.freeze(descriptor.presentations.slice());
  return PRESENTATIONS_BY_LAYOUT[layout] || DEFAULT_PRESENTATIONS;
}

function leftbarZone(layout) {
  if (layout === "search") return "top";
  if (layout === "settings") return "system";
  return "body";
}

function widgetSource(specification) {
  if (typeof specification === "string") return { id: specification, override: null };
  if (specification != null && typeof specification === "object") {
    return {
      id: typeof specification.override === "string" ? specification.override : null,
      override: specification
    };
  }
  return { id: null, override: null };
}

function resolveWidget(specification, catalog, context = {}) {
  const region = context.region;
  const index = Number.isInteger(context.index) ? context.index : 0;
  const source = widgetSource(specification);
  const registered = source.id == null
    ? null
    : (SYSTEM_WIDGETS[source.id] || catalog?.[source.id] || null);
  const descriptor = Object.assign({}, registered || {}, source.override || {});
  const layout = typeof descriptor.layout === "string" ? descriptor.layout : source.id;
  if (["brand", "actions"].includes(layout)) {
    return freeze({ instance: null, warning: {
      code: "fixed_region_content",
      widget: source.id || layout,
      layout,
      region,
      supported: []
    } });
  }
  if (layout === "search") {
    return freeze({ instance: null, warning: {
      code: "retired_region_widget",
      widget: source.id || layout,
      layout,
      region,
      supported: []
    } });
  }
  if (!layout || (!registered && source.override == null)) {
    return freeze({ instance: null, warning: {
      code: "unknown_widget",
      widget: source.id || "<invalid>",
      layout: layout || "<unknown>",
      region,
      supported: []
    } });
  }
  if (context.region === "leftbar" && context.contentOnly === true && ["menu", "settings"].includes(layout)) {
    return freeze({ instance: null, warning: {
      code: "fixed_leftbar_widget",
      widget: source.id || layout,
      layout,
      region: context.region,
      supported: ["topbar"]
    } });
  }
  // presentation 是 Widget 类型能力，不允许实例通过内联参数抬高权限。
  const presentations = normalizedPresentations(registered, layout);
  const target = REGION_PRESENTATIONS[region];
  if (!target || !presentations.includes(target)) {
    return freeze({ instance: null, warning: {
      code: "unsupported_widget_presentation",
      widget: source.id || layout,
      layout,
      region,
      supported: presentations.slice()
    } });
  }
  const id = source.id || layout;
  return freeze({
    instance: {
      instanceId: `${region}:${index}:${id}`,
      id,
      layout,
      system: descriptor.system === true,
      presentation: target,
      presentations: presentations.slice(),
      leftbarZone: leftbarZone(layout),
      item: clone(descriptor)
    },
    warning: null
  });
}

function resolveRegionWidgets(widgets, catalog, context = {}) {
  const instances = [];
  const warnings = [];
  for (const [index, specification] of (Array.isArray(widgets) ? widgets : []).entries()) {
    const result = resolveWidget(specification, catalog, { ...context, index });
    if (result.instance) instances.push(result.instance);
    if (result.warning) warnings.push({ ...result.warning, profile: context.profile || null });
  }
  return freeze({ instances, warnings });
}

module.exports = {
  DEFAULT_PRESENTATIONS,
  PRESENTATIONS_BY_LAYOUT,
  REGION_PRESENTATIONS,
  SYSTEM_WIDGETS,
  leftbarZone,
  resolveRegionWidgets,
  resolveWidget
};
