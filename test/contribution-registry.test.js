"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");
const { validateContributionDefinitions } = require("../scripts/lib/contribution-contract");
const { auditContributionRegistry } = require("../ci/lib/contribution-audit");
const { flattenSchemaFields } = require("../scripts/schema/schema-utils");
const { CONFIG_SCHEMA } = require("../scripts/schema/config-schema");
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

function schemaFields() {
  return flattenSchemaFields(CONFIG_SCHEMA);
}

function audit(overrides = {}) {
  return auditContributionRegistry({
    root: ROOT,
    definitions: overrides.definitions || CONTRIBUTIONS,
    assets: overrides.assets || cloneAssets(),
    languages: overrides.languages || languages(),
    schemaFields: overrides.schemaFields || schemaFields()
  });
}

test("统一 descriptor 契约登记贡献、Schema 与维护面", () => {
  assert.doesNotThrow(() => validateContributionDefinitions(CONTRIBUTIONS));
  assert.deepEqual(new Set(CONTRIBUTIONS.map(item => item.kind)), new Set(["extension", "feature", "component"]));
  assert.deepEqual(new Set(contributionSchemaIds("features")), new Set(Object.keys(CONFIG_SCHEMA.properties.features.properties)));
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
      colorSchemeSwitch: { enabled: false },
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
  const positions = entries.map(entry => CONTRIBUTIONS.findIndex(item => item.id === entry.id));
  assert.ok(positions.length > 0);
  assert.ok(positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1])));
  const cardHover = entries.find(item => item.id === "card-hover");
  assert.equal(cardHover.config.feature, "card-hover");
  assert.deepEqual(cardHover.config.assets, INTERNAL_CONSTANTS.assets.features.cardHover);
  assert.equal(entries.some(item => item.id === "reveal"), false);
  for (const entry of entries) {
    const definition = CONTRIBUTIONS.find(item => item.id === entry.id);
    assert.equal(entry.module, definition.entry.path, entry.id);
    if (definition.entry.adapter === "feature") {
      assert.equal(entry.config.feature, entry.id);
    }
  }
});

test("负向门禁拒绝重复注册与冲突的 Schema 默认值所有者", () => {
  const duplicate = [...CONTRIBUTIONS, { ...CONTRIBUTIONS.find(item => item.id === "search") }];
  assert.throws(() => validateContributionDefinitions(duplicate), /duplicate contribution id search/);

  const conflicting = CONTRIBUTIONS.map(item => item.id === "katex-stylesheet"
    ? { ...item, defaultsOwner: "scripts/schema/other.js#features.math.provider" }
    : item);
  assert.throws(() => validateContributionDefinitions(conflicting), /conflicting defaults owners/);
});

test("负向门禁拒绝缺失翻译与 Schema 所有权漂移", () => {
  const missingLanguage = languages();
  delete missingLanguage.en.message.copy_denied;
  assert.ok(audit({ languages: missingLanguage }).some(issue => issue.includes("language en is missing message.copy_denied")));

  const driftedSchemaFields = schemaFields().filter(field => field.path !== "features.card_hover.enabled");
  assert.ok(audit({ schemaFields: driftedSchemaFields }).some(issue => issue.includes("card-hover: schema features.card_hover.enabled appears 0 times")));
});

test("负向门禁拒绝未登记资源与重复资源所有权", () => {
  const unregistered = cloneAssets();
  unregistered.features.unregisteredDemo = { js: "/js/plugins/unregistered-demo.js" };
  assert.ok(audit({ assets: unregistered }).some(issue => issue.includes("features.unregisteredDemo.js: internal asset has no contribution owner")));

  const duplicateResource = CONTRIBUTIONS.map(item => item.id === "card-hover"
    ? { ...item, resources: [...item.resources, "features.heti"] }
    : item);
  assert.ok(audit({ definitions: duplicateResource }).some(issue => issue.includes("resource features.heti is owned by both card-hover and heti")));
});

test("贡献证据允许复用不包含贡献 ID 的共享契约测试", () => {
  const definitions = CONTRIBUTIONS.map((item, index) => ({
    ...item,
    id: `shared-contract-${index}`,
    tests: ["test/browser-runtime-consumption.test.js"]
  }));
  assert.deepEqual(audit({ definitions }), []);
});

test("贡献证据拒绝空引用、缺失文件与目录引用", () => {
  for (const [tests, expected] of [
    [[], /tests must be a non-empty array/],
    [["test/does-not-exist.test.js"], /contract test test\/does-not-exist.test.js does not exist/],
    [["test/"], /contract test test\/ is not a file/]
  ]) {
    const definitions = CONTRIBUTIONS.map((item, index) => index === 0 ? { ...item, tests } : item);
    assert.ok(audit({ definitions }).some(issue => expected.test(issue)), JSON.stringify(tests));
  }
});
