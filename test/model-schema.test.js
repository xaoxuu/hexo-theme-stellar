"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { assertPageViewModel } = require("../scripts/lib/model-schema");
const { MODEL_SCHEMAS, PROFILES } = require("../scripts/schema/model-schema");

function flattenFields(schema, prefix = "", result = []) {
  for (const [key, node] of Object.entries(schema.properties || {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    result.push({ path, node });
    flattenFields(node, path, result);
    if (node.items?.properties) flattenFields(node.items, `${path}[]`, result);
  }
  return result;
}

test("模型 Schema 覆盖全部 profile 且字段注解完整", () => {
  assert.deepEqual(PROFILES, ["notebook", "post", "topic", "wiki"]);
  assert.deepEqual(Object.keys(MODEL_SCHEMAS).sort(), [
    "CollectionModel",
    "ContentItemModel",
    "PageViewModel"
  ]);
  assert.deepEqual(Object.keys(MODEL_SCHEMAS.CollectionModel.profiles).sort(), [...PROFILES].sort());
  assert.deepEqual(Object.keys(MODEL_SCHEMAS.PageViewModel.profiles).sort(), [...PROFILES].sort());

  const schemas = [
    ...Object.values(MODEL_SCHEMAS.CollectionModel.profiles),
    MODEL_SCHEMAS.ContentItemModel.schema,
    ...Object.values(MODEL_SCHEMAS.PageViewModel.profiles)
  ];
  for (const schema of schemas) {
    const fields = flattenFields(schema);
    assert.ok(fields.length > 0);
    assert.equal(fields.length, new Set(fields.map(field => field.path)).size, "模型 Schema 不应声明重复路径");
    for (const { path, node } of fields) {
      assert.ok(Array.isArray(node.type) && node.type.length > 0, `${path} 缺少类型`);
      assert.equal(typeof node.default, "object", `${path} 缺少默认值语义`);
      assert.equal(typeof node.scope, "string", `${path} 缺少作用域`);
      assert.ok(Array.isArray(node.consumers) && node.consumers.length > 0, `${path} 缺少消费方`);
      assert.ok(Object.prototype.hasOwnProperty.call(node, "example"), `${path} 缺少最小示例`);
    }
  }
});

test("模型 Schema 保留内部组合引用", () => {
  for (const profile of PROFILES) {
    const fields = flattenFields(MODEL_SCHEMAS.PageViewModel.profiles[profile]);
    assert.equal(fields.find(field => field.path === "collection").node.reference, "CollectionModel");
    assert.equal(fields.find(field => field.path === "item").node.reference, "ContentItemModel");
  }
});

test("模型输出继续由同一份 Schema 拒绝缺失、未知和错误类型", () => {
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
