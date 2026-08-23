/* global hexo */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { generateReferenceMetadata } = require("./reference-metadata");
const { generateConfigReferenceMetadata } = require("./config-reference-metadata");
const { generateBlueprintReferenceMetadata } = require("./blueprint-reference-metadata");

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function json(value) {
  if (value === undefined) return "—";
  const encoded = JSON.stringify(value);
  if (encoded === undefined) return "—";
  return `<code>${encoded
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("|", "&#124;")}</code>`;
}

function text(value) {
  if (value == null || value === "") return "—";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("|", "&#124;")
    .replaceAll("\n", "<br>");
}

function list(values) {
  return Array.isArray(values) && values.length > 0 ? values.map(text).join("<br>") : "—";
}

function markdown(lines) {
  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

function headingAnchor(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff -]/g, "")
    .replace(/\s+/g, "-");
}

function configReferenceMarkdown(metadata = generateConfigReferenceMetadata()) {
  const groups = new Map();
  for (const field of metadata.fields) {
    if (!groups.has(field.scope)) groups.set(field.scope, []);
    groups.get(field.scope).push(field);
  }
  const lines = [
    "# Stellar v2 配置 Reference",
    "",
    "> 本页由已交付配置 Schema 自动生成。请勿手工编辑；运行 `npm run reference:generate` 更新。",
    "",
    "YAML 使用 `path`，主题 JavaScript 消费规范化后的 `runtimePath`。第三方 provider 参数袋只封闭父级容器，内部字段由相应 provider 定义。",
    ""
  ];
  for (const scope of [...groups.keys()].sort(compareText)) {
    lines.push(`## ${scope}`, "", "| Path | Runtime path | Type | Default | Cascade / normalize | Consumers | Example |", "| --- | --- | --- | --- | --- | --- | --- |");
    for (const field of groups.get(scope).sort((a, b) => compareText(a.path, b.path))) {
      const rules = [
        field.cascade ? `cascade=${JSON.stringify(field.cascade)}` : "",
        field.normalizer ? `normalizer=${field.normalizer}` : "",
        field.normalization || "",
        field.values ? `values=${JSON.stringify(field.values)}` : "",
        field.minimum !== undefined ? `min=${field.minimum}` : "",
        field.maximum !== undefined ? `max=${field.maximum}` : "",
        field.exclusiveMinimum !== undefined ? `min>${field.exclusiveMinimum}` : "",
        field.sealed ? "sealed" : ""
      ].filter(Boolean).join("; ");
      lines.push(`| ${text(field.path)} | ${text(field.runtimePath)} | ${json(field.type)} | ${json(field.default)} | ${text(rules)} | ${list(field.consumers)} | ${json(field.example)} |`);
    }
    lines.push("");
  }
  return markdown(lines);
}

function modelReferenceMarkdown(metadata = generateReferenceMetadata()) {
  const lines = [
    "# Stellar v2 模型 Reference",
    "",
    "> 本页由模型 Schema 自动生成。请勿手工编辑；运行 `npm run reference:generate` 更新。",
    "",
    `已交付 profile：${metadata.profiles.map(profile => `\`${profile}\``).join("、")}。这些是构建期冻结模型，不是浏览器公共 API。`,
    ""
  ];
  for (const model of metadata.models) {
    const qualifier = model.profile ? `:${model.profile}` : "";
    lines.push(`## ${model.name}${qualifier}`, "", "| Path | Type | Required | Default | Scope | Consumers | Example |", "| --- | --- | --- | --- | --- | --- | --- |");
    for (const field of model.fields) {
      lines.push(`| ${text(field.path)} | ${json(field.type)} | ${field.required ? "yes" : "no"} | ${json(field.default)} | ${text(field.scope)} | ${list(field.consumers)} | ${json(field.example)} |`);
    }
    lines.push("");
  }
  return markdown(lines);
}

function blueprintReferenceMarkdown(metadata = generateBlueprintReferenceMetadata()) {
  const lines = [
    "# Stellar v2 Blueprint 与 CLI Reference",
    "",
    "> 本页由 Blueprint/Visual Style manifest 与 CLI 契约自动生成。请勿手工编辑。",
    "",
    "## 最小命令",
    "",
    "```bash",
    "npx hexo stellar init --blueprint classic-blog --style stellar --non-interactive",
    "npx hexo stellar doctor --format text",
    "npx hexo generate",
    "```",
    "",
    "`init` 会在写入前展示完整计划并拒绝覆盖已有文件；生成结果不包含 Blueprint 锁文件或运行时继承。",
    "",
    "## Blueprints",
    "",
    "| ID | Name | Default style | Description | Generated files |",
    "| --- | --- | --- | --- | --- |"
  ];
  for (const blueprint of metadata.blueprints) {
    lines.push(`| ${text(blueprint.id)} | ${text(blueprint.name)} | ${text(blueprint.defaultStyle)} | ${text(blueprint.description)} | ${list(blueprint.files)} |`);
  }
  lines.push("", "## Visual Styles", "", "| ID | Name | Description |", "| --- | --- | --- |");
  for (const style of metadata.visualStyles) {
    lines.push(`| ${text(style.id)} | ${text(style.name)} | ${text(style.description)} |`);
  }
  lines.push(
    "",
    "## CLI contract",
    "",
    `- init options: ${metadata.cli.subcommands.init.options.map(option => `\`--${option}\``).join("、")}`,
    `- doctor formats: ${metadata.cli.subcommands.doctor.formats.map(format => `\`${format}\``).join("、")}`,
    `- JSON 全局选项: ${metadata.cli.subcommands.doctor.jsonGlobalOptions.map(option => `\`--${option}\``).join("、")}`,
    "",
    "## Manifest contract",
    "",
    `- schema version: \`${metadata.manifestContract.schemaVersion}\``,
    `- sealed: \`${metadata.manifestContract.sealed}\``,
    `- path: ${text(metadata.manifestContract.paths)}`,
    `- unique targets: \`${metadata.manifestContract.uniqueBlueprintTargets}\``,
    `- physical containment: ${text(metadata.manifestContract.physicalContainment)}`,
    ""
  );
  return markdown(lines);
}

function referenceIndexMarkdown() {
  return markdown([
    "# Stellar v2 Reference",
    "",
    "这里是 Stellar v2 Alpha 的公开契约入口。字段页由主题 Schema 自动生成，机器可读 JSON 与 Markdown 由同一生成器维护。",
    "",
    "- [Alpha 快速开始与范围](../ALPHA.md)",
    "- [配置 Reference](v2-config.md) · [JSON](v2-config.json)",
    "- [模型 Reference](v2-models.md) · [JSON](v2-models.json)",
    "- [Blueprint 与 CLI Reference](v2-blueprints.md) · [JSON](v2-blueprints.json)",
    "- [Alpha 首屏核心 JS 性能记录](v2-alpha-performance.json)",
    "",
    "完整产品首页、学习路径、v1 归档、迁移对照与重定向将在 Beta 阶段交付。",
    ""
  ]);
}

function markdownAnchors(markdown) {
  return markdown
    .split("\n")
    .filter(line => /^#{1,6} /.test(line))
    .map(line => headingAnchor(line.replace(/^#{1,6} /, "")));
}

function validatePublicReferenceLinks(root) {
  const files = [
    path.join(root, "README.md"),
    path.join(root, "ALPHA.md"),
    path.join(root, "reference", "README.md"),
    path.join(root, "reference", "v2-config.md"),
    path.join(root, "reference", "v2-models.md"),
    path.join(root, "reference", "v2-blueprints.md")
  ];
  const errors = [];
  for (const file of files) {
    const markdown = fs.readFileSync(file, "utf8");
    const prose = markdown
      .replace(/```[\s\S]*?```/g, "")
      .replace(/<code>[\s\S]*?<\/code>/g, "")
      .replace(/`[^`\n]*`/g, "");
    const links = [...prose.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)].map(match => match[1]);
    for (const link of links) {
      if (/^(?:https?:|mailto:)/.test(link)) continue;
      const [rawTarget, rawAnchor = ""] = link.split("#", 2);
      const target = rawTarget === "" ? file : path.resolve(path.dirname(file), decodeURIComponent(rawTarget));
      const relative = path.relative(root, target);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        errors.push(`${path.relative(root, file)}: link escapes repository: ${link}`);
        continue;
      }
      if (!fs.existsSync(target)) {
        errors.push(`${path.relative(root, file)}: missing link target: ${link}`);
        continue;
      }
      if (rawAnchor && path.extname(target).toLowerCase() === ".md") {
        const anchors = markdownAnchors(fs.readFileSync(target, "utf8"));
        if (!anchors.includes(decodeURIComponent(rawAnchor).toLowerCase())) {
          errors.push(`${path.relative(root, file)}: missing anchor: ${link}`);
        }
      }
    }
  }
  if (errors.length > 0) throw new Error(`公开 Reference 链接检查失败:\n${errors.join("\n")}`);
  return files;
}

module.exports = {
  blueprintReferenceMarkdown,
  configReferenceMarkdown,
  headingAnchor,
  markdownAnchors,
  modelReferenceMarkdown,
  referenceIndexMarkdown,
  validatePublicReferenceLinks
};
