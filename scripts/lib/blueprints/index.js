/* global hexo */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const { parseStellarConfig } = require("../config-schema");
const { parseCollectionConfig, parsePageConfig } = require("../content-config");
const { FrontMatterParseError, parseFrontMatterYaml } = require("../front-matter");
const {
  BLUEPRINT_IDS,
  BLUEPRINT_MANIFEST_SCHEMA,
  VISUAL_STYLE_IDS,
  VISUAL_STYLE_MANIFEST_SCHEMA
} = require("../../schema/blueprint-schema");
const { parseConfigSchema } = require("../config-schema");
const { deepFreeze } = require("../../schema/schema-utils");

const DEFAULT_THEME_ROOT = path.resolve(__dirname, "../../..");
const STYLE_SLOT = "{{visual_style}}";
const DATE_SLOT = "{{generated_date}}";

class BlueprintError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "BlueprintError";
    Object.assign(this, details);
  }
}

class BlueprintConflictError extends BlueprintError {
  constructor(conflicts) {
    super(`Stellar Blueprint 拒绝覆盖已有文件：${conflicts.join(", ")}`, { conflicts });
    this.name = "BlueprintConflictError";
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new BlueprintError(`${file}: 无法读取合法 JSON（${error.message}）`);
  }
}

function safeRelativePath(value, source) {
  if (typeof value !== "string" || value.length === 0) {
    throw new BlueprintError(`${source}: 路径必须是非空相对路径`);
  }
  const unixPath = value.replace(/\\/g, "/");
  const normalized = path.posix.normalize(unixPath);
  const hasDriveRoot = /^[A-Za-z]:/.test(unixPath);
  if (path.isAbsolute(value) || path.posix.isAbsolute(unixPath) || hasDriveRoot || unixPath.split("/").includes("..") || /^\.\/?$/.test(normalized)) {
    throw new BlueprintError(`${source}: 路径不能逃逸根目录（${value}）`);
  }
  return normalized;
}

function resolveInside(root, relative, source) {
  const safe = safeRelativePath(relative, source);
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, safe);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new BlueprintError(`${source}: 路径不能逃逸根目录（${relative}）`);
  }
  const physicalRoot = fs.realpathSync(resolvedRoot);
  let ancestor = resolved;
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }
  const physicalAncestor = fs.realpathSync(ancestor);
  if (physicalAncestor !== physicalRoot && !physicalAncestor.startsWith(`${physicalRoot}${path.sep}`)) {
    throw new BlueprintError(`${source}: 路径经过根目录外的符号链接（${relative}）`);
  }
  if (fs.existsSync(resolved)) {
    const physicalResolved = fs.realpathSync(resolved);
    if (physicalResolved !== physicalRoot && !physicalResolved.startsWith(`${physicalRoot}${path.sep}`)) {
      throw new BlueprintError(`${source}: 路径经过根目录外的符号链接（${relative}）`);
    }
  }
  return { relative: safe, absolute: resolved };
}

function parseManifest(file, schema) {
  return parseConfigSchema(schema, readJson(file), { source: file, applyDefaults: false });
}

function loadCatalog(options = {}) {
  const themeRoot = path.resolve(options.themeRoot || DEFAULT_THEME_ROOT);
  const blueprintRoot = path.join(themeRoot, "blueprints");
  const styles = {};
  for (const id of VISUAL_STYLE_IDS) {
    const directory = path.join(blueprintRoot, "styles", id);
    const manifestPath = path.join(directory, "manifest.json");
    const manifest = parseManifest(manifestPath, VISUAL_STYLE_MANIFEST_SCHEMA);
    if (manifest.id !== id) throw new BlueprintError(`${manifestPath}: manifest id 必须为 ${id}`);
    if (manifest.name.length === 0 || manifest.description.length === 0) {
      throw new BlueprintError(`${manifestPath}: name 和 description 不能为空`);
    }
    const fragment = resolveInside(directory, manifest.fragment, `${manifestPath}: fragment`);
    const content = fs.readFileSync(fragment.absolute, "utf8").trimEnd();
    let parsed;
    try {
      parsed = yaml.load(content, { filename: fragment.absolute });
    } catch (error) {
      throw new BlueprintError(`${fragment.absolute}: Visual Style YAML 无效（${error.message}）`);
    }
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed) || Object.keys(parsed).join(",") !== "appearance") {
      throw new BlueprintError(`${fragment.absolute}: Visual Style 必须只包含 appearance 根`);
    }
    parseStellarConfig({ source: fragment.absolute, themeConfig: parsed });
    styles[id] = deepFreeze({ ...manifest, directory, content });
  }

  const blueprints = {};
  for (const id of BLUEPRINT_IDS) {
    const directory = path.join(blueprintRoot, id);
    const manifestPath = path.join(directory, "manifest.json");
    const manifest = parseManifest(manifestPath, BLUEPRINT_MANIFEST_SCHEMA);
    if (manifest.id !== id) throw new BlueprintError(`${manifestPath}: manifest id 必须为 ${id}`);
    if (manifest.name.length === 0 || manifest.description.length === 0 || manifest.files.length === 0) {
      throw new BlueprintError(`${manifestPath}: name、description 和 files 不能为空`);
    }
    if (!styles[manifest.defaultStyle]) {
      throw new BlueprintError(`${manifestPath}: default_style ${manifest.defaultStyle} 不存在`);
    }
    const targets = new Set();
    const files = manifest.files.map((file, index) => {
      const source = resolveInside(path.join(directory, "files"), file.source, `${manifestPath}: files[${index}].source`);
      const target = safeRelativePath(file.target, `${manifestPath}: files[${index}].target`);
      if (targets.has(target)) throw new BlueprintError(`${manifestPath}: 重复目标 ${target}`);
      targets.add(target);
      if (!fs.existsSync(source.absolute) || !fs.statSync(source.absolute).isFile()) {
        throw new BlueprintError(`${source.absolute}: 模板源必须是现有文件`);
      }
      return deepFreeze({ ...file, source: source.relative, sourcePath: source.absolute, target });
    });
    const configFiles = files.filter(file => file.target === "_config.stellar.yml" && file.template === true);
    if (configFiles.length !== 1) {
      throw new BlueprintError(`${manifestPath}: 必须声明一个模板化 _config.stellar.yml`);
    }
    const configTemplate = fs.readFileSync(configFiles[0].sourcePath, "utf8");
    if (configTemplate.split(STYLE_SLOT).length - 1 !== 1) {
      throw new BlueprintError(`${configFiles[0].sourcePath}: 必须且只能包含一个 visual_style 插槽`);
    }
    blueprints[id] = deepFreeze({ ...manifest, directory, files: deepFreeze(files) });
  }
  return deepFreeze({ themeRoot, blueprints, styles });
}

function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new BlueprintError("generatedAt 必须是合法日期");
  const pad = number => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function renderTemplate(content, style, generatedAt, source) {
  const styleSlots = content.split(STYLE_SLOT).length - 1;
  const dateSlots = content.split(DATE_SLOT).length - 1;
  if (styleSlots > 1) throw new BlueprintError(`${source}: visual_style 插槽只能出现一次`);
  let result = content;
  if (styleSlots === 1) result = result.replace(STYLE_SLOT, style.content);
  if (dateSlots > 0) result = result.split(DATE_SLOT).join(formatDate(generatedAt));
  if (/{{[^{}]+}}/.test(result)) throw new BlueprintError(`${source}: 存在未知模板插槽`);
  return result.endsWith("\n") ? result : `${result}\n`;
}

function parseFrontMatter(content, source) {
  try {
    return parseFrontMatterYaml(content, source) || {};
  } catch (error) {
    if (error instanceof FrontMatterParseError) throw new BlueprintError(error.message);
    throw error;
  }
}

function validateGeneratedFile(target, content) {
  try {
    let parsed;
    if (target === "_config.stellar.yml") {
      parsed = yaml.load(content, { filename: target }) || {};
      parseStellarConfig({ source: target, themeConfig: parsed });
    } else if (/^source\/_data\/(wiki|topic|notebooks)\/.+\.ya?ml$/.test(target)) {
      parsed = yaml.load(content, { filename: target }) || {};
      parseCollectionConfig(parsed, target);
    } else if (target.endsWith(".md")) {
      parsePageConfig(parseFrontMatter(content, target), target);
    }
  } catch (error) {
    if (error instanceof BlueprintError) throw error;
    throw new BlueprintError(`${target}: 生成资产不符合 v2 Schema（${error.message}）`);
  }
}

function buildBlueprintPlan(options = {}) {
  const catalog = options.catalog || loadCatalog(options);
  const blueprintId = options.blueprint || BLUEPRINT_IDS[0];
  const blueprint = catalog.blueprints[blueprintId];
  if (!blueprint) throw new BlueprintError(`未知 Blueprint：${blueprintId}；可选值：${BLUEPRINT_IDS.join(", ")}`);
  const styleId = options.style || blueprint.defaultStyle;
  const style = catalog.styles[styleId];
  if (!style) throw new BlueprintError(`未知 Visual Style：${styleId}；可选值：${VISUAL_STYLE_IDS.join(", ")}`);
  const baseDir = path.resolve(options.baseDir || process.cwd());
  const generatedAt = options.generatedAt || new Date();
  const files = blueprint.files.map(file => {
    const output = resolveInside(baseDir, file.target, `${blueprint.id}: ${file.target}`);
    const raw = fs.readFileSync(file.sourcePath, "utf8");
    const content = file.template ? renderTemplate(raw, style, generatedAt, file.sourcePath) : raw;
    validateGeneratedFile(file.target, content);
    return deepFreeze({
      source: path.relative(catalog.themeRoot, file.sourcePath).replace(/\\/g, "/"),
      target: file.target,
      outputPath: output.absolute,
      content
    });
  });
  const conflicts = files.filter(file => fs.existsSync(file.outputPath)).map(file => file.target);
  if (conflicts.length > 0) throw new BlueprintConflictError(conflicts);
  return deepFreeze({
    blueprint: { id: blueprint.id, name: blueprint.name },
    style: { id: style.id, name: style.name },
    baseDir,
    files
  });
}

function writeBlueprintPlan(plan) {
  const files = plan.files.map(file => {
    const output = resolveInside(plan.baseDir, file.target, `write: ${file.target}`);
    if (output.absolute !== path.resolve(file.outputPath)) {
      throw new BlueprintError(`${file.target}: outputPath 与计划根目录不一致`);
    }
    return file;
  });
  const conflicts = files.filter(file => fs.existsSync(file.outputPath)).map(file => file.target);
  if (conflicts.length > 0) throw new BlueprintConflictError(conflicts);
  const created = [];
  try {
    for (const file of files) {
      fs.mkdirSync(path.dirname(file.outputPath), { recursive: true });
      fs.writeFileSync(file.outputPath, file.content, { encoding: "utf8", flag: "wx" });
      created.push(file.outputPath);
    }
  } catch (error) {
    for (const file of created.reverse()) fs.unlinkSync(file);
    throw new BlueprintError(`Stellar Blueprint 写入失败，已回滚本次创建的文件（${error.message}）`);
  }
  return plan;
}

function formatBlueprintPlan(plan, options = {}) {
  const heading = options.dryRun ? "Stellar init dry-run" : "Stellar init plan";
  return [
    `${heading}: ${plan.blueprint.name} + ${plan.style.name}`,
    ...plan.files.map(file => `  create ${file.target}`)
  ].join("\n");
}

module.exports = {
  BlueprintConflictError,
  BlueprintError,
  buildBlueprintPlan,
  formatBlueprintPlan,
  loadCatalog,
  resolveInside,
  safeRelativePath,
  writeBlueprintPlan
};
