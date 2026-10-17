"use strict";

const { loadAll, CORE_SCHEMA, mergeTag, timestampTag, YAMLException } = require("js-yaml");

// 主题配置与 Front Matter 保持 YAML 1.2 标量、日期及 << 合并键语义。
// js-yaml 5 的 load 拒绝空流；loadAll 让空文件/纯注释继续表示未配置。
const schema = CORE_SCHEMA.withTags(mergeTag, timestampTag);

function loadYaml(source, options = {}) {
  const documents = loadAll(source, { ...options, schema });
  if (documents.length > 1) throw new YAMLException("expected a single document in the stream");
  return documents[0];
}

module.exports = { loadYaml };
