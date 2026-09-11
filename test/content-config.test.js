"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  ContentConfigError,
  getCollectionId,
  isListed,
  isSearchable,
  parseCollectionConfig,
  parsePageConfig,
  validateCollectionProfileConfig,
  validatePageProfileConfig
} = require("../scripts/lib/content-config");
const { getProfileAdapter } = require("../scripts/lib/collection-pipeline/registry");
const { SHARE_SERVICE_IDS } = require("../scripts/lib/share-services");

test("Collection config normalizes public fields and freezes open parameter bags", () => {
  const parsed = parseCollectionConfig({
    name: "Docs",
    icon: "/docs.svg",
    cover: "/docs.webp",
    route: { path: "/wiki/docs/" },
    topbar: { enabled: true, brand: { name: "Docs", href: "/wiki/docs/" }, menu: [] },
    leftbar: {
      brand: { source: "collection", style: "compact", back_button: false, search: true },
      footer: { actions: [] },
      widgets: ["tree", { layout: "custom", option: true }]
    },
    rightbar: { enabled: false },
    comments: { provider: "custom", options: { nested_value: { enabled: true } } }
  }, "source/_data/wiki/docs.yml");
  assert.equal(parsed.route.path, "wiki/docs/");
  assert.equal(parsed.icon, "/docs.svg");
  assert.equal(parsed.cover, "/docs.webp");
  assert.equal(parsed.topbar.brand.name, "Docs");
  assert.deepEqual(parsed.leftbar.brand, {
    source: "collection",
    style: "compact",
    backButton: false,
    search: true
  });
  assert.equal(parsed.rightbar.enabled, false);
  assert.equal(parsed.comments.options.nested_value.enabled, true);
  assert.equal(Object.isFrozen(parsed), true);
  assert.equal(Object.isFrozen(parsed.comments.options), true);
});

test("Wiki Hero validates registered Light Rays options without changing Galaxy", () => {
  const options = {
    raysOrigin: "top-center",
    raysColor: "#00ffff",
    raysSpeed: 1.5,
    lightSpread: 0.8,
    rayLength: 1.2,
    pulsating: true,
    fadeDistance: 1,
    saturation: 0.9,
    followMouse: true,
    mouseInfluence: 0.1,
    noiseAmount: 0.1,
    distortion: 0.05,
    lightMode: false
  };
  const parsed = parseCollectionConfig({
    name: "Docs",
    hero: {
      enabled: true,
      background: {
        effect: {
          type: "light-rays",
          options,
          runtime: { pause_when_hidden: false, respect_reduced_motion: false }
        }
      }
    }
  }, "source/_data/wiki/docs.yml");
  assert.deepEqual(parsed.hero.background.effect, {
    type: "light-rays",
    options,
    runtime: { pauseWhenHidden: false, respectReducedMotion: false }
  });
  assert.equal(Object.isFrozen(parsed.hero.background.effect.options), true);

  for (const raysOrigin of [
    "top-left", "top-center", "top-right", "left", "right",
    "bottom-left", "bottom-center", "bottom-right"
  ]) {
    assert.doesNotThrow(() => parseCollectionConfig({
      name: "Docs",
      hero: { background: { effect: { type: "light-rays", options: { raysOrigin, raysColor: "00ffff" } } } }
    }, "source/_data/wiki/docs.yml"));
  }

  assert.doesNotThrow(() => parseCollectionConfig({
    name: "Docs",
    hero: { background: { effect: { type: "galaxy", options: { starSpeed: 0.5 } } } }
  }, "source/_data/wiki/docs.yml"));

  assert.throws(
    () => parseCollectionConfig({
      name: "Docs",
      hero: { background: { effect: { type: "unknown" } } }
    }, "source/_data/wiki/docs.yml"),
    /hero\.background\.effect\.type/
  );

  for (const [key, value] of [
    ["raysOrigin", "center"],
    ["raysColor", "cyan"],
    ["raysSpeed", "fast"],
    ["followMouse", "yes"],
    ["unknown", true]
  ]) {
    assert.throws(
      () => parseCollectionConfig({
        name: "Docs",
        hero: { background: { effect: { type: "light-rays", options: { [key]: value } } } }
      }, "source/_data/wiki/docs.yml"),
      new RegExp(`hero\\.background\\.effect\\.options\\.${key}`)
    );
  }
});

test("Wiki Hero validates registered Ferrofluid options", () => {
  const options = {
    colors: ["#ffffff", "06B6D4", "#E0F2FE"],
    backgroundColor: "#03010A",
    speed: 0.75,
    scale: 1.6,
    turbulence: 1.2,
    fluidity: 0.1,
    rimWidth: 0.2,
    sharpness: 2.5,
    shimmer: 1.5,
    glow: 2,
    flowDirection: "left",
    opacity: 0.9,
    mouseInteraction: true,
    mouseStrength: 1,
    mouseRadius: 0.35,
    mouseDampening: 0.15,
    paused: false,
    dpr: null,
    mixBlendMode: "screen"
  };
  const parsed = parseCollectionConfig({
    name: "Docs",
    hero: { background: { effect: { type: "ferrofluid", options } } }
  }, "source/_data/wiki/docs.yml");
  assert.deepEqual(parsed.hero.background.effect, { type: "ferrofluid", options });
  assert.equal(Object.isFrozen(parsed.hero.background.effect.options.colors), true);

  assert.doesNotThrow(() => parseCollectionConfig({
    name: "Docs",
    hero: { background: { effect: { type: "ferrofluid", options: { dpr: 1.5 } } } }
  }, "source/_data/wiki/docs.yml"));

  for (const [key, value] of [
    ["colors", []],
    ["colors", Array(9).fill("#ffffff")],
    ["colors", ["white"]],
    ["backgroundColor", "black"],
    ["flowDirection", "diagonal"],
    ["dpr", 0],
    ["mixBlendMode", ""],
    ["speed", "fast"],
    ["paused", "yes"],
    ["unknown", true]
  ]) {
    assert.throws(
      () => parseCollectionConfig({
        name: "Docs",
        hero: { background: { effect: { type: "ferrofluid", options: { [key]: value } } } }
      }, "source/_data/wiki/docs.yml"),
      new RegExp(`hero\\.background\\.effect\\.options\\.${key}`)
    );
  }
});

test("Front Matter parser preserves Hexo fields and normalizes Stellar fields", () => {
  const parsed = parsePageConfig({
    title: "Page",
    date: "2026-08-23 00:00",
    collection: { profile: "wiki", id: "docs" },
    cover: "/page.webp",
    tagline: "Page tagline",
    render: { math: "katex" },
    seo: { open_graph: { image: "/cover.webp" } },
    inject: {
      head_begin: "<!-- head begin -->",
      head_end: "<meta name=\"example\">",
      body_begin: "<!-- body begin -->",
      body_end: "<script>example()</script>"
    }
  }, "source/wiki/docs/index.md");
  assert.equal(parsed.title, "Page");
  assert.deepEqual(parsed.collection, { profile: "wiki", id: "docs" });
  assert.equal(parsed.cover, "/page.webp");
  assert.equal(parsed.tagline, "Page tagline");
  assert.equal(parsed.seo.openGraph.image, "/cover.webp");
  assert.equal(parsed.inject.headBegin, "<!-- head begin -->");
  assert.equal(parsed.inject.headEnd, "<meta name=\"example\">");
  assert.equal(parsed.inject.bodyBegin, "<!-- body begin -->");
  assert.equal(parsed.inject.bodyEnd, "<script>example()</script>");
  assert.equal(Object.isFrozen(parsed), true);
});

test("Content override navigation is flat across collection and page scopes", () => {
  const collection = parseCollectionConfig({
    name: "Docs",
    active_menu: "wiki",
    breadcrumb: false
  }, "collection.yml");
  const page = parsePageConfig({
    active_menu: "post",
    breadcrumb: true
  }, "page.md");
  assert.equal(collection.activeMenu, "wiki");
  assert.equal(collection.breadcrumb, false);
  assert.equal(page.activeMenu, "post");
  assert.equal(page.breadcrumb, true);
});

test("Content config rejects 1.44 fields with current migration targets", () => {
  assert.throws(
    () => parseCollectionConfig({ name: "Docs", title: "Legacy" }, "collection.yml"),
    /title 已移除，期望 name/
  );
  assert.throws(
    () => parsePageConfig({ wiki: "docs" }, "page.md"),
    /wiki 已移除，期望 collection\.id/
  );
  assert.throws(
    () => parseCollectionConfig({ name: "Docs", available: "Web" }, "collection.yml"),
    /available 已移除，期望 audience/
  );
  assert.throws(
    () => parseCollectionConfig({ name: "Docs", coverpage: true }, "collection.yml"),
    /coverpage 已移除，期望 hero\.enabled/
  );
  assert.throws(
    () => parsePageConfig({ comment_id: "thread" }, "page.md"),
    /comment_id 已移除，期望 comments\.id/
  );
  assert.throws(
    () => parseCollectionConfig({ name: "Docs", sort: 10 }, "collection.yml"),
    /sort 已移除，期望 listing\.order/
  );
  assert.throws(
    () => parsePageConfig({ giscus: { "data-repo": "owner\/repo" } }, "page.md"),
    /giscus 已移除，期望 comments\.options/
  );
});

test("Content footer share accepts only registered service IDs", () => {
  const collection = parseCollectionConfig({ name: "Docs", footer: { share: SHARE_SERVICE_IDS } }, "collection.yml");
  const page = parsePageConfig({ footer: { share: SHARE_SERVICE_IDS } }, "page.md");
  assert.deepEqual(collection.footer.share, SHARE_SERVICE_IDS);
  assert.deepEqual(page.footer.share, SHARE_SERVICE_IDS);
  assert.throws(
    () => parsePageConfig({ footer: { share: ["unknown"] } }, "page.md"),
    error => {
      assert.ok(error instanceof ContentConfigError);
      assert.equal(error.issues.some(issue => issue.path === "footer.share[0]" && issue.code === "invalid_value"), true);
      return true;
    }
  );
});

test("Profile presentation without consumers is omitted with sourced warnings", () => {
  const warnings = [];
  const config = parseCollectionConfig({ name: "Collection", hero: { enabled: true } }, "collection.yml");
  const normalized = validateCollectionProfileConfig(config, "collection.yml", "topic", getProfileAdapter("topic").config, {
    onIssues: issues => warnings.push(...issues)
  });
  assert.equal(normalized.hero, undefined);
  assert.equal(config.hero.enabled, true);
  assert.equal(warnings[0].severity, "warning");
  assert.equal(warnings[0].source, "collection.yml");
  assert.equal(warnings[0].path, "hero");
  const page = validatePageProfileConfig({ listing: { priority: 1 } }, "page.md", "page", null);
  assert.equal(page.listing?.priority, undefined);
});

test("Collection visibility is a shared listed and searchable cascade", () => {
  const parsed = parseCollectionConfig({
    name: "Private notes",
    visibility: { listed: false, searchable: false }
  }, "notebook.yml");
  assert.deepEqual(parsed.visibility, { listed: false, searchable: false });
  validateCollectionProfileConfig(parsed, "notebook.yml", "notebook", getProfileAdapter("notebook").config);
});

test("Content regions distinguish inheritance from explicit empty lists", () => {
  const collection = parseCollectionConfig({ name: "Docs", rightbar: { widgets: ["toc"] } });
  const page = parsePageConfig({ leftbar: { widgets: [] } });
  assert.equal(collection.leftbar, undefined);
  assert.deepEqual(collection.rightbar.widgets, ["toc"]);
  assert.deepEqual(page.leftbar.widgets, []);
  assert.equal(page.rightbar, undefined);
});

test("Content Region schemas enforce fixed field value boundaries", () => {
  for (const [config, pattern] of [
    [{ name: "Docs", leftbar: { brand: "invalid" } }, /leftbar\.brand 应为 object \| boolean \| null/],
    [{ name: "Docs", leftbar: { footer: { actions: true } } }, /leftbar\.footer\.actions 应为 array \| null/]
  ]) {
    assert.throws(() => parseCollectionConfig(config, "collection.yml"), pattern);
  }
  for (const field of ["source", "back_button", "search"]) {
    assert.throws(
      () => parsePageConfig({ leftbar: { brand: { [field]: field === "source" ? "site" : true } } }, "page.md"),
      new RegExp(`leftbar\\.brand\\.${field}`)
    );
  }
  assert.throws(
    () => parseCollectionConfig({ name: "Docs", topbar: { brand: { style: "compact" } } }, "collection.yml"),
    /topbar\.brand\.style/
  );
  for (const [field, value] of [
    ["source", "profile"],
    ["style", "dense"],
    ["back_button", "yes"],
    ["search", "yes"]
  ]) {
    assert.throws(
      () => parseCollectionConfig({ name: "Docs", leftbar: { brand: { [field]: value } } }, "collection.yml"),
      new RegExp(`leftbar\\.brand\\.${field}`)
    );
  }
});

test("Content schemas aggregate unknown, type, enum, and range diagnostics", () => {
  assert.throws(() => parseCollectionConfig({
    name: "Docs",
    mystery: true,
    leftbar: { widgets: "tree" },
    listing: { priority: -1 }
  }, "collection.yml"), error => {
    assert.ok(error instanceof ContentConfigError);
    assert.match(error.message, /未知字段 mystery/);
    assert.match(error.message, /leftbar\.widgets 应为 array/);
    assert.match(error.message, /number >= 0/);
    return true;
  });
  assert.throws(
    () => parsePageConfig({ collection: { profile: "unknown", id: "" } }),
    /collection\.profile.*wiki \| topic \| notebook/
  );
});

test("Content config recovery omits invalid overrides and filters invalid list items", () => {
  const issues = [];
  const collection = parseCollectionConfig({
    name: "Docs",
    mystery: true,
    article: { style: "unsupported" },
    leftbar: { widgets: ["tree", 42] },
    listing: { priority: -1 }
  }, "collection.yml", {
    mode: "recover",
    onIssues: current => issues.push(...current)
  });
  assert.equal(collection.mystery, undefined);
  assert.deepEqual(collection.article, {});
  assert.deepEqual(collection.leftbar.widgets, ["tree"]);
  assert.deepEqual(collection.listing, {});
  assert.equal(issues.some(item => item.path === "leftbar.widgets[1]"), true);

  const allInvalid = parsePageConfig({ leftbar: { widgets: [42] } }, "page.md", { mode: "recover" });
  const explicitEmpty = parsePageConfig({ leftbar: { widgets: [] } }, "page.md", { mode: "recover" });
  assert.deepEqual(allInvalid.leftbar, {});
  assert.deepEqual(explicitEmpty.leftbar.widgets, []);
});

test("Content config recovery keeps structural identity failures fatal", () => {
  const issues = [];
  assert.throws(
    () => parsePageConfig({ collection: { profile: "wiki" }, article: { style: "unsupported" } }, "page.md", {
      mode: "recover",
      onIssues: current => issues.push(...current)
    }),
    error => error instanceof ContentConfigError && error.issues.length === 1 && error.issues[0].path === "collection.id"
  );
  assert.equal(issues.some(item => item.path === "article.style"), true);
  for (const name of [undefined, null, "", "   ", 42, {}]) {
    const warnings = [];
    const collection = parseCollectionConfig({ name }, "collection.yml", {
      mode: "recover", collectionId: "docs", onIssues: issues => warnings.push(...issues)
    });
    assert.equal(collection.name, "docs");
    assert.ok(warnings.some(issue => issue.path === "name"));
  }
});

test("Content visibility and ownership helpers keep independent semantics", () => {
  const page = { collection: { profile: "wiki", id: "docs" } };
  assert.equal(getCollectionId(page, "wiki"), "docs");
  assert.equal(getCollectionId(page, "topic"), null);
  assert.equal(isListed({ visibility: { listed: false, searchable: true } }), false);
  assert.equal(isSearchable({ visibility: { listed: false, searchable: true } }), true);
  assert.equal(isListed({}), true);
  assert.equal(isSearchable({}), true);
});

test("评论参数袋校验资源字段并保留上游开放参数", () => {
  const parsed = parsePageConfig({ comments: { options: { js: "/client.js", css: null, arbitrary: true } } });
  assert.equal(parsed.comments.options.js, "/client.js");
  assert.equal(parsed.comments.options.css, null);
  assert.equal(parsed.comments.options.arbitrary, true);
  assert.throws(() => parsePageConfig({ comments: { options: { js: "javascript:alert(1)" } } }), /safe Resource/);
});
