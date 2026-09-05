"use strict";

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const { resolveInside } = require("./safe-path");
const {
  parseCollectionConfig,
  parsePageConfig,
  validateCollectionProfileConfig,
  validatePageProfileConfig
} = require("./content-config");
const { getProfileAdapter } = require("./collection-pipeline/registry");
const { parseFrontMatterYaml } = require("./front-matter");
const { deepFreeze } = require("../schema/schema-utils");

class NewNoteError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "NewNoteError";
    Object.assign(this, details);
  }
}

class NewNoteConflictError extends NewNoteError {
  constructor(target) {
    super(`Stellar new note 拒绝覆盖已有文件：${target}`, { target });
    this.name = "NewNoteConflictError";
  }
}

function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new NewNoteError("generatedAt 必须是合法日期");
  const pad = number => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function safeSegment(value, label) {
  const segment = typeof value === "string" ? value.trim() : "";
  if (segment.length === 0) throw new NewNoteError(`${label} 必须是非空字符串`);
  const hasControl = Array.from(segment).some(character => character.charCodeAt(0) < 32);
  if (segment === "." || segment === ".." || /[<>:"/\\|?*]/.test(segment) || hasControl) {
    throw new NewNoteError(`${label} 不能包含路径或文件系统保留字符`);
  }
  return segment;
}

function normalizeTags(value) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const tags = [];
  const seen = new Set();
  for (const item of values) {
    const tag = typeof item === "string" ? item.trim() : "";
    if (tag.length === 0 || seen.has(tag)) continue;
    if (Array.from(tag).some(character => character.charCodeAt(0) < 32)) {
      throw new NewNoteError("--tags 不能包含换行或空字符");
    }
    seen.add(tag);
    tags.push(tag);
  }
  return Object.freeze(tags);
}

function notebookConfigFile(sourceDir, notebook) {
  const candidates = ["yml", "yaml"].map(extension => (
    path.join(sourceDir, "_data", "notebooks", `${notebook}.${extension}`)
  ));
  return candidates.find(file => fs.existsSync(file)) || candidates[0];
}

function renderFrontMatter({ title, tags, generatedAt }) {
  const lines = [
    "---",
    `date: ${formatDate(generatedAt)}`,
    `title: ${JSON.stringify(title)}`
  ];
  if (tags.length > 0) {
    lines.push("tags:", ...tags.map(tag => `  - ${JSON.stringify(tag)}`));
  }
  lines.push("---", "", "");
  return lines.join("\n");
}

function buildNewNotePlan(options = {}) {
  const baseDir = path.resolve(options.baseDir || process.cwd());
  const sourceDir = path.resolve(options.sourceDir || path.join(baseDir, "source"));
  const notebook = safeSegment(options.notebook, "--notebook");
  const title = safeSegment(options.title, "--title");
  const tags = normalizeTags(options.tags);
  const configFile = notebookConfigFile(sourceDir, notebook);
  if (!fs.existsSync(configFile) || !fs.statSync(configFile).isFile()) {
    throw new NewNoteError(`未知 Notebook：${notebook}；缺少 ${path.relative(baseDir, configFile)}`);
  }
  let rawCollection;
  try {
    rawCollection = yaml.load(fs.readFileSync(configFile, "utf8"), { filename: configFile }) || {};
  } catch (error) {
    throw new NewNoteError(`${configFile}: Notebook YAML 无效（${error.message}）`);
  }
  const collectionSource = path.relative(baseDir, configFile).replace(/\\/g, "/");
  validateCollectionProfileConfig(
    parseCollectionConfig(rawCollection, collectionSource),
    collectionSource,
    "notebook",
    getProfileAdapter("notebook").config
  );

  const target = path.posix.join("source", "notebooks", notebook, `${title}.md`);
  const output = resolveInside(baseDir, target, `stellar new note: ${target}`);
  const content = renderFrontMatter({ title, tags, generatedAt: options.generatedAt ?? new Date() });
  validatePageProfileConfig(
    parsePageConfig(parseFrontMatterYaml(content, target) || {}, target),
    target,
    "notebook",
    getProfileAdapter("notebook").config
  );
  if (fs.existsSync(output.absolute)) throw new NewNoteConflictError(target);
  return deepFreeze({
    notebook,
    title,
    tags,
    baseDir,
    target,
    outputPath: output.absolute,
    content
  });
}

function writeNewNotePlan(plan) {
  const output = resolveInside(plan.baseDir, plan.target, `write: ${plan.target}`);
  if (output.absolute !== path.resolve(plan.outputPath)) {
    throw new NewNoteError(`${plan.target}: outputPath 与计划根目录不一致`);
  }
  if (fs.existsSync(plan.outputPath)) throw new NewNoteConflictError(plan.target);
  const createdDirectories = [];
  let directory = path.dirname(plan.outputPath);
  while (!fs.existsSync(directory)) {
    createdDirectories.push(directory);
    directory = path.dirname(directory);
  }
  try {
    fs.mkdirSync(path.dirname(plan.outputPath), { recursive: true });
    fs.writeFileSync(plan.outputPath, plan.content, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (fs.existsSync(plan.outputPath)) fs.unlinkSync(plan.outputPath);
    for (const created of createdDirectories) {
      if (fs.existsSync(created) && fs.readdirSync(created).length === 0) fs.rmdirSync(created);
    }
    if (error instanceof NewNoteError) throw error;
    throw new NewNoteError(`Stellar new note 写入失败，已回滚本次创建的文件（${error.message}）`);
  }
  return plan;
}

function formatNewNotePlan(plan, options = {}) {
  return [
    options.dryRun ? "Stellar new note dry-run" : "Stellar new note plan",
    `  notebook ${plan.notebook}`,
    `  create ${plan.target}`
  ].join("\n");
}

module.exports = {
  NewNoteConflictError,
  NewNoteError,
  buildNewNotePlan,
  formatNewNotePlan,
  normalizeTags,
  writeNewNotePlan
};
