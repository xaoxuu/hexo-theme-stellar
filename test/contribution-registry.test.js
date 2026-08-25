"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");
const { validateContributionDefinitions } = require("../scripts/lib/contribution-contract");
const { auditContributionRegistry } = require("../scripts/lib/contribution-audit");
const {
  CONTRIBUTIONS,
  buildContributionEntries,
  contributionSchemaIds
} = require("../scripts/lib/contribution-registry");
const INTERNAL_CONSTANTS = require("../scripts/lib/internal-constants");

const ROOT = path.resolve(__dirname, "..");

function cloneAssets() {
  return JSON.parse(JSON.stringify(INTERNAL_CONSTANTS.assets));
}

function languages() {
  return Object.fromEntries(["en", "zh-CN", "zh-TW"].map(id => [
    id,
    yaml.load(fs.readFileSync(path.join(ROOT, "languages", `${id}.yml`), "utf8"))
  ]));
}

function reference() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "reference/v2-config.json"), "utf8"));
}

function audit(overrides = {}) {
  return auditContributionRegistry({
    root: ROOT,
    definitions: overrides.definitions || CONTRIBUTIONS,
    assets: overrides.assets || cloneAssets(),
    languages: overrides.languages || languages(),
    reference: overrides.reference || reference()
  });
}

test("统一 descriptor 契约登记 runtime-bootstrap、Extension、Feature 与 component", () => {
  assert.doesNotThrow(() => validateContributionDefinitions(CONTRIBUTIONS));
  assert.deepEqual(new Set(CONTRIBUTIONS.map(item => item.kind)), new Set(["extension", "feature", "component"]));
  assert.equal(CONTRIBUTIONS.some(item => item.id === "runtime-bootstrap"), true);
  assert.equal(CONTRIBUTIONS.some(item => item.id === "katex-stylesheet"), true);
  assert.deepEqual(contributionSchemaIds("extensions.features"), [
    "lazy_loading", "link_prefetch", "lightbox", "reveal", "math", "diagrams", "card_hover", "heti"
  ]);
  assert.deepEqual(audit(), []);
});

test("Runtime Manifest 顺序直接来自 descriptor 注册表", () => {
  const plainObject = value => value || {};
  const entries = buildContributionEntries({
    assets: INTERNAL_CONSTANTS.assets,
    colorScheme: "auto",
    comments: {},
    extensions: { search: {}, services: {} },
    features: {
      linkPrefetch: { enabled: false },
      lightbox: { enabled: false },
      reveal: { enabled: false },
      math: { provider: null },
      diagrams: { provider: null },
      cardHover: { enabled: true },
      heti: { enabled: false }
    },
    messages: { copy: {} },
    plainObject,
    render: {},
    resolveServiceProvider: () => null
  });
  assert.deepEqual(entries.map(item => item.id), [
    "lazy-loading", "deferred-icons", "dropdown", "services", "code-copy", "adaptive-text", "card-hover", "swiper"
  ]);
  const cardHover = entries.find(item => item.id === "card-hover");
  assert.equal(cardHover.module, "/js/runtime/extensions/card-hover.mjs");
  assert.deepEqual(cardHover.when, { selector: ".card-hover" });
  assert.equal(cardHover.config.feature, "card-hover");
  assert.equal(cardHover.config.assets.js, "/js/plugins/card-hover.js");
});

test("负向门禁拒绝重复注册与冲突的 Schema 默认值所有者", () => {
  const duplicate = [...CONTRIBUTIONS, { ...CONTRIBUTIONS[1] }];
  assert.throws(() => validateContributionDefinitions(duplicate), /duplicate contribution id search/);

  const conflicting = CONTRIBUTIONS.map(item => item.id === "katex-stylesheet"
    ? { ...item, defaultsOwner: "scripts/schema/other.js#extensions.features.math" }
    : item);
  assert.throws(() => validateContributionDefinitions(conflicting), /conflicting defaults owners/);
});

test("负向门禁拒绝缺失翻译与 Schema/Reference 漂移", () => {
  const missingLanguage = languages();
  delete missingLanguage.en.message.copy_denied;
  assert.ok(audit({ languages: missingLanguage }).some(issue => issue.includes("language en is missing message.copy_denied")));

  const driftedReference = reference();
  driftedReference.fields = driftedReference.fields.filter(field => field.path !== "extensions.features.card_hover");
  assert.ok(audit({ reference: driftedReference }).some(issue => issue.includes("card-hover: schema extensions.features.card_hover appears 0 times")));
});

test("负向门禁拒绝未登记资源、重复资源所有权与缺失行为测试", () => {
  const unregistered = cloneAssets();
  unregistered.features.unregisteredDemo = { js: "/js/plugins/unregistered-demo.js" };
  assert.ok(audit({ assets: unregistered }).some(issue => issue.includes("features.unregisteredDemo.js: internal asset has no contribution owner")));

  const duplicateResource = CONTRIBUTIONS.map(item => item.id === "card-hover"
    ? { ...item, resources: [...item.resources, "features.heti"] }
    : item);
  assert.ok(audit({ definitions: duplicateResource }).some(issue => issue.includes("resource features.heti is owned by both card-hover and heti")));

  const missingTest = CONTRIBUTIONS.map(item => item.id === "card-hover"
    ? { ...item, tests: ["test/does-not-exist.test.js"] }
    : item);
  const issues = audit({ definitions: missingTest });
  assert.ok(issues.some(issue => issue.includes("behavior test test/does-not-exist.test.js does not exist")));
  assert.ok(issues.some(issue => issue.includes("no behavior test mentions the contribution id")));
});
