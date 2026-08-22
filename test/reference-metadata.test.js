"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  generateReferenceMetadata,
  stringifyReferenceMetadata
} = require("../scripts/lib/reference-metadata");
const {
  generateConfigReferenceMetadata,
  stringifyConfigReferenceMetadata
} = require("../scripts/lib/config-reference-metadata");
const { assertPageViewModel } = require("../scripts/lib/model-schema");
const { MODEL_SCHEMAS } = require("../scripts/schema/model-schema");
const { CONFIG_TARGET_FIELDS } = require("../scripts/schema/config-target");
const generateReference = require("../scripts/generate-reference");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "reference/v2-models.json");
const CONFIG_OUTPUT = path.join(ROOT, "reference/v2-config.json");

test("配置 Reference 只公开已交付 site Shell、Layout Profile、内容默认与 head/SEO 契约", () => {
  const metadata = generateConfigReferenceMetadata();

  assert.equal(metadata.status, "partial");
  const paths = metadata.fields.map(field => field.path);
  const deliveredTargetPaths = CONFIG_TARGET_FIELDS
    .filter(field => field.status === "delivered")
    .map(field => field.path);
  for (const targetPath of deliveredTargetPaths) {
    assert.equal(paths.includes(targetPath), true, `${targetPath} 未进入配置 Reference`);
  }
  assert.deepEqual(
    [...new Set(paths.map(fieldPath => fieldPath.split(".")[0]))].sort(),
    ["content", "inject", "layout", "resources", "seo", "site"]
  );
  assert.equal(metadata.fields.some(field => field.path === "layout.profiles.blog_index.path"), true);
  assert.equal(metadata.fields.some(field => field.path === "content.article.listing.card_layout"), true);
  assert.equal(metadata.fields.some(field => field.path === "content.notebook.tag_icons.<tag>"), true);
  assert.equal(metadata.fields[0].sealed, true);
  assert.deepEqual(
    metadata.fields.find(field => field.path === "seo.canonical.host"),
    {
      path: "seo.canonical.host",
      runtimePath: "seo.canonical.host",
      type: ["string", "null"],
      default: { kind: "literal", value: null },
      scope: "theme",
      cascade: ["schema default", "_config.stellar.yml"],
      normalizer: "nullable_host",
      normalization: "trim; remove scheme and trailing slash; null disables canonical output",
      consumers: [
        "PageViewModel",
        "head renderer",
        "JSON-LD helper",
        "browser canonical check"
      ],
      example: "example.com",
      migration: "configuration/seo"
    }
  );
});

test("Reference 元数据覆盖四类已交付模型且字段注解完整", () => {
  const metadata = generateReferenceMetadata();

  assert.deepEqual(metadata.profiles, ["notebook", "post", "topic", "wiki"]);
  assert.deepEqual(
    metadata.models.map(model => `${model.name}:${model.profile || "shared"}`),
    [
      "CollectionModel:notebook",
      "CollectionModel:post",
      "CollectionModel:topic",
      "CollectionModel:wiki",
      "ContentItemModel:shared",
      "PageViewModel:notebook",
      "PageViewModel:post",
      "PageViewModel:topic",
      "PageViewModel:wiki"
    ]
  );

  for (const model of metadata.models) {
    assert.ok(model.fields.length > 0, `${model.name} 应包含字段`);
    for (const field of model.fields) {
      assert.equal(typeof field.path, "string");
      assert.ok(field.path.length > 0);
      assert.ok(Array.isArray(field.type) && field.type.length > 0, `${field.path} 缺少类型`);
      assert.equal(typeof field.default, "object", `${field.path} 缺少默认值语义`);
      assert.equal(typeof field.scope, "string", `${field.path} 缺少作用域`);
      assert.ok(Array.isArray(field.consumers) && field.consumers.length > 0, `${field.path} 缺少消费方`);
      assert.ok(Object.prototype.hasOwnProperty.call(field, "example"), `${field.path} 缺少最小示例`);
    }
  }
});

test("Reference 只来自模型 Schema 且不提前公开后续契约", () => {
  const metadata = generateReferenceMetadata();
  const names = metadata.models.map(model => model.name);

  assert.deepEqual(names, [
    "CollectionModel",
    "CollectionModel",
    "CollectionModel",
    "CollectionModel",
    "ContentItemModel",
    "PageViewModel",
    "PageViewModel",
    "PageViewModel",
    "PageViewModel"
  ]);
  assert.equal("blueprints" in metadata, false);
  assert.equal("cli" in metadata, false);
  assert.equal("layoutPrimitives" in metadata, false);
  assert.equal("extensions" in metadata, false);
  assert.deepEqual(Object.keys(MODEL_SCHEMAS).sort(), [
    "CollectionModel",
    "ContentItemModel",
    "PageViewModel"
  ]);

  const contentItem = metadata.models.find(model => model.name === "ContentItemModel");
  assert.ok(contentItem.fields.some(field => field.path === "layout"));
  assert.deepEqual(
    contentItem.fields.find(field => field.path === "presentation.article.ai_label").type,
    ["string", "object"]
  );

  const wikiCollection = metadata.models.find(model => (
    model.name === "CollectionModel" && model.profile === "wiki"
  ));
  assert.deepEqual(
    wikiCollection.fields.find(field => field.path === "id").consumers,
    ["PageViewModel", "Reference generator"]
  );
  assert.ok(
    wikiCollection.fields.find(field => field.path === "source.repository")
      .consumers.includes("ContentItemModel")
  );

  const postViewModel = metadata.models.find(model => (
    model.name === "PageViewModel" && model.profile === "post"
  ));
  assert.ok(postViewModel.fields.some(field => field.path === "render.document.language"));
  assert.ok(postViewModel.fields.some(field => field.path === "render.layout.breadcrumbs[].path"));
  assert.ok(postViewModel.fields.some(field => field.path === "render.seo.jsonLd"));
  assert.ok(postViewModel.fields.some(field => field.path === "render.article.comments.options"));
  assert.ok(postViewModel.fields.some(field => field.path === "render.article.tags[].path"));
  assert.ok(postViewModel.fields.some(field => field.path === "render.listing.priority"));
  for (const profile of ["notebook", "topic", "wiki"]) {
    const pageViewModel = metadata.models.find(model => model.name === "PageViewModel" && model.profile === profile);
    assert.equal(pageViewModel.fields.some(field => field.path === "render"), false);
  }
  assert.ok(
    wikiCollection.fields.find(field => field.path === "navigation.menu")
      .consumers.includes("ContentItemModel")
  );
  assert.equal(
    wikiCollection.fields.find(field => field.path === "navigation.tree")
      .consumers.includes("ContentItemModel"),
    false
  );
  assert.deepEqual(
    wikiCollection.fields.find(field => field.path === "navigation.menu").default,
    { kind: "omitted" }
  );
  assert.deepEqual(
    wikiCollection.fields.find(field => field.path === "presentation.sidebar.left.menu").default,
    { kind: "omitted" }
  );
  assert.deepEqual(
    wikiCollection.fields.find(field => field.path === "presentation.hero.enabled").default,
    { kind: "omitted" }
  );
  assert.ok(
    wikiCollection.fields.find(field => field.path === "presentation.hero.background.image")
      .consumers.includes("buildWikiPageViewModel")
  );
  assert.equal(
    wikiCollection.fields.find(field => field.path === "presentation.hero.background.effect")
      .consumers.includes("buildWikiPageViewModel"),
    false
  );
});

test("Reference JSON 重复生成稳定并与仓库产物一致", () => {
  const first = stringifyReferenceMetadata();
  const second = stringifyReferenceMetadata();

  assert.equal(first, second);
  assert.equal(first.endsWith("\n"), true);
  assert.deepEqual(JSON.parse(first), generateReferenceMetadata());
  assert.equal(fs.readFileSync(OUTPUT, "utf8"), first);

  const configFirst = stringifyConfigReferenceMetadata();
  const configSecond = stringifyConfigReferenceMetadata();
  assert.equal(configFirst, configSecond);
  assert.deepEqual(JSON.parse(configFirst), generateConfigReferenceMetadata());
  assert.equal(fs.readFileSync(CONFIG_OUTPUT, "utf8"), configFirst);
});

test("生成命令可重复覆盖相同产物并检出漂移", t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-reference-"));
  const output = path.join(directory, "v2-models.json");
  const configOutput = path.join(directory, "v2-config.json");
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  generateReference({ output, configOutput });
  const first = fs.readFileSync(output, "utf8");
  const firstConfig = fs.readFileSync(configOutput, "utf8");
  generateReference({ output, configOutput });
  assert.equal(fs.readFileSync(output, "utf8"), first);
  assert.equal(fs.readFileSync(configOutput, "utf8"), firstConfig);
  assert.equal(generateReference({ check: true, output, configOutput }), output);

  fs.writeFileSync(output, "{}\n", "utf8");
  assert.throws(
    () => generateReference({ check: true, output, configOutput }),
    /v2-models\.json 与模型 Schema 不一致/
  );

  generateReference({ output, configOutput });
  fs.writeFileSync(configOutput, "{}\n", "utf8");
  assert.throws(
    () => generateReference({ check: true, output, configOutput }),
    /v2-config\.json 与配置 Schema 不一致/
  );
});

test("模型输出由同一份 Schema 拒绝缺失字段、未知字段和错误类型", () => {
  assert.throws(
    () => assertPageViewModel("post", {
      collection: { id: 1, unexpected: true },
      item: {},
      extra: true
    }),
    error => {
      assert.match(error.message, /PageViewModel\.collection\.id 应为 string，实际为 number/);
      assert.match(error.message, /PageViewModel\.collection\.profile 缺少必填模型字段/);
      assert.match(error.message, /PageViewModel\.collection\.unexpected 未在模型 Schema 中声明/);
      assert.match(error.message, /PageViewModel\.render 缺少必填模型字段/);
      assert.match(error.message, /PageViewModel\.extra 未在模型 Schema 中声明/);
      return true;
    }
  );
});
