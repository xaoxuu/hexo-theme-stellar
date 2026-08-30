/* global hexo */

"use strict";

const { generateConfigReferenceMetadata } = require("./config-reference-metadata");

const DISPOSITIONS = Object.freeze(["public", "localize", "derive", "internalize", "remove"]);

const LOCALIZED_PATHS = new Set([
  "extensions.comments.title"
]);

const RETIRED_FIELDS = Object.freeze([
  ["appearance.backgrounds.sidebar.surface", "remove", "appearance.preset", "预发布旧 Sidebar 表面风格改由整站 Appearance Preset 统一控制"],
  ["appearance.backgrounds.leftbar.surface", "remove", "appearance.preset", "Region 表面风格改由整站 Appearance Preset 统一控制"],
  ["extensions.tags.copy", "remove", "removed", "copy 标签没有站点级行为选择，空配置节点退出公开契约"],
  ["extensions.tags.copy.toast", "localize", "languages/*.yml", "复制成功提示属于主题 UI 文案"],
  ["extensions.features.code_copy.idle_text", "localize", "languages/*.yml", "代码复制按钮默认文案属于主题 UI 文案"],
  ["extensions.features.code_copy.success_text", "localize", "languages/*.yml", "代码复制成功状态属于主题 UI 文案"],
  ["extensions.features.code_copy.toast", "localize", "languages/*.yml", "代码复制 toast 属于主题 UI 文案"],
  ["extensions.features.link_prefetch.provider", "internalize", "scripts/lib/internal-constants.js", "link prefetch 只有 flying_pages 一个内置实现，不构成用户选择"],
  ["extensions.features.lightbox.provider", "internalize", "scripts/lib/internal-constants.js", "lightbox 只有 fancybox 一个内置实现，不构成用户选择"],
  ["extensions.features.reveal.distance", "internalize", "source/js/runtime/extensions/reveal.mjs", "Reveal 动画参数由主题原生实现统一维护"],
  ["extensions.features.reveal.duration_ms", "internalize", "source/js/runtime/extensions/reveal.mjs", "Reveal 动画参数由主题原生实现统一维护"],
  ["extensions.features.reveal.interval_ms", "internalize", "source/js/runtime/extensions/reveal.mjs", "Reveal 动画参数由主题原生实现统一维护"],
  ["extensions.features.reveal.provider", "internalize", "source/js/runtime/extensions/reveal.mjs", "reveal 使用主题内置原生实现，不构成用户选择"],
  ["extensions.features.reveal.scale", "internalize", "source/js/runtime/extensions/reveal.mjs", "Reveal 动画参数由主题原生实现统一维护"],
  ["extensions.cache", "internalize", "scripts/lib/internal-constants.js", "request/cache 是主题运行策略，不是内容或视觉选择"],
  ["extensions.cache.enabled", "internalize", "scripts/lib/internal-constants.js", "缓存启用策略由 Runtime 统一拥有"],
  ["extensions.cache.default_ttl", "internalize", "scripts/lib/internal-constants.js", "默认 TTL 是内部请求策略"],
  ["extensions.cache.ttl", "internalize", "scripts/lib/internal-constants.js", "服务 TTL 表是内部请求策略"],
  ["extensions.cache.ttl.<service>", "internalize", "scripts/lib/internal-constants.js", "单服务 TTL 是内部请求策略"],
  ["extensions.cache.max_entries", "internalize", "scripts/lib/internal-constants.js", "缓存容量是内部实现阈值"]
].map(([path, disposition, defaultSource, rationale]) => Object.freeze({
  scope: "theme",
  path,
  disposition,
  accepted: false,
  defaultSource,
  consumers: ["configuration diagnostics", "migration guidance"],
  rationale
})));

function currentFieldDisposition(field) {
  if (LOCALIZED_PATHS.has(field.path)) {
    return {
      disposition: "localize",
      defaultSource: "languages/*.yml",
      rationale: "字段保留显式站点覆盖能力；主题提供的缺省系统文案由语言文件拥有"
    };
  }
  return {
    disposition: "public",
    defaultSource: field.default?.kind === "derived"
      ? `derived:${(field.default.sources || []).join("|")}`
      : field.default?.kind === "registered"
        ? "registered schema"
        : "declarative schema",
    rationale: "当前声明式 Schema 接受该字段，用户可显式选择或覆盖其行为/内容"
  };
}

function generateConfigFieldAudit() {
  const currentByPath = new Map();
  for (const field of generateConfigReferenceMetadata().fields) {
    const key = `${field.scope}:${field.path}`;
    const decision = currentFieldDisposition(field);
    const existing = currentByPath.get(key);
    currentByPath.set(key, {
      scope: field.scope,
      path: field.path,
      ...decision,
      accepted: true,
      consumers: [...new Set([...(existing?.consumers || []), ...(field.consumers || [])])],
      rationale: decision.rationale
    });
  }
  const current = [...currentByPath.values()];
  const fields = [...current, ...RETIRED_FIELDS].sort((left, right) => {
    const scope = left.scope.localeCompare(right.scope);
    return scope || left.path.localeCompare(right.path) || Number(right.accepted) - Number(left.accepted);
  });
  const counts = Object.fromEntries(DISPOSITIONS.map(id => [id, fields.filter(field => field.disposition === id).length]));
  return {
    schemaVersion: 1,
    source: [
      "scripts/schema/config-schema.js",
      "scripts/schema/content-config-schema.js",
      "scripts/lib/config-field-audit.js"
    ],
    dispositions: DISPOSITIONS,
    counts,
    fields
  };
}

function stringifyConfigFieldAudit() {
  return `${JSON.stringify(generateConfigFieldAudit(), null, 2)}\n`;
}

module.exports = {
  DISPOSITIONS,
  RETIRED_FIELDS,
  generateConfigFieldAudit,
  stringifyConfigFieldAudit
};
