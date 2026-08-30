#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { markdownAnchors } = require("../scripts/lib/markdown-links");

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_KNOWLEDGE_DIR = "docs/knowledge";
const DEFAULT_CONFIG_REFERENCE = "reference/v2-config.json";
const HOST_OBJECT_PATHS = new Set(["site.posts"]);
const FILE_LIKE_SUFFIX = /\.(?:js|mjs|cjs|ejs|css|styl|json|ya?ml|md)$/i;
const CONFIG_TOKEN = /^[A-Za-z_$][\w$]*(?:\[\])?(?:\.[A-Za-z_$][\w$]*(?:\[\])?)+$/;
const VERSION_REFERENCE = /\bversion\s*:?\s*v?(\d+\.\d+\.\d+(?:-(?:alpha|beta|rc)\.\d+)?)/gi;

function lineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}

function stripFencedCode(markdown) {
  let fence = null;
  return markdown.split("\n").map(line => {
    const match = line.match(/^\s*(`{3,}|~{3,})/);
    if (match) {
      const marker = match[1];
      if (fence === null) {
        fence = { character: marker[0], length: marker.length };
      } else if (marker[0] === fence.character && marker.length >= fence.length) {
        fence = null;
      }
      return "";
    }
    return fence === null ? line : "";
  }).join("\n");
}

function walkMarkdown(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap(entry => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return walkMarkdown(target);
      return entry.isFile() && entry.name.endsWith(".md") ? [target] : [];
    })
    .sort();
}

function readJson(root, relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
}

function error(kind, root, file, line, value, message) {
  return {
    kind,
    file: path.relative(root, file),
    line,
    value,
    message
  };
}

function checkLinks(root, file, markdown) {
  const errors = [];
  let checked = 0;
  const prose = stripFencedCode(markdown).replace(/`[^`\n]*`/g, "");
  const linkPattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g;
  for (const match of prose.matchAll(linkPattern)) {
    const link = match[1];
    if (/^(?:https?:|mailto:)/i.test(link)) continue;
    checked += 1;
    const line = lineNumber(prose, match.index);
    const [rawTarget, rawAnchor = ""] = link.split("#", 2);
    let decodedTarget;
    let decodedAnchor;
    try {
      decodedTarget = decodeURIComponent(rawTarget);
      decodedAnchor = decodeURIComponent(rawAnchor).toLowerCase();
    } catch {
      errors.push(error("invalid-link", root, file, line, link, `链接无法解码: ${link}`));
      continue;
    }
    const target = decodedTarget === ""
      ? file
      : path.resolve(path.dirname(file), decodedTarget);
    const relative = path.relative(root, target);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      errors.push(error("repository-escape", root, file, line, link, `链接逃逸仓库: ${link}`));
      continue;
    }
    if (!fs.existsSync(target)) {
      errors.push(error("missing-link", root, file, line, link, `链接目标不存在: ${link}`));
      continue;
    }
    if (decodedAnchor && path.extname(target).toLowerCase() === ".md") {
      const anchors = markdownAnchors(fs.readFileSync(target, "utf8"));
      if (!anchors.includes(decodedAnchor)) {
        errors.push(error("missing-anchor", root, file, line, link, `Markdown 标题锚点不存在: ${link}`));
      }
    }
  }
  return { checked, errors };
}

function configContract(root, configReferencePath) {
  const reference = readJson(root, configReferencePath);
  const accepted = new Set();
  const themeRoots = new Set();
  const addPath = value => {
    if (!value) return;
    const normalized = value.replace(/\[\]/g, "");
    const segments = normalized.split(".");
    for (let index = 1; index <= segments.length; index += 1) {
      accepted.add(segments.slice(0, index).join("."));
    }
  };
  for (const field of reference.fields || []) {
    addPath(field.path);
    addPath(field.runtimePath);
    if (field.surface === "Theme" && field.path) themeRoots.add(field.path.split(".")[0]);
  }
  return { accepted, themeRoots };
}

function checkConfigReferences(root, file, markdown, contract) {
  const errors = [];
  let checked = 0;
  const prose = stripFencedCode(markdown);
  for (const match of prose.matchAll(/`([^`\n]+)`/g)) {
    const token = match[1].trim();
    if (!CONFIG_TOKEN.test(token) || FILE_LIKE_SUFFIX.test(token)) continue;
    if (!contract.themeRoots.has(token.split(".")[0])) continue;
    if (HOST_OBJECT_PATHS.has(token)) continue;
    if (contract.accepted.has(token)) {
      checked += 1;
      continue;
    }
    // Flat roots such as `search`, `comments`, `footer` and `regions` also name
    // language keys and PageViewModel fields. A two-segment bare token has no
    // reliable surface marker, so only diagnose deeper unqualified paths.
    if (token.split(".").length < 3) continue;
    errors.push(error(
      "unknown-config",
      root,
      file,
      lineNumber(prose, match.index),
      token,
      `主题配置中不存在: ${token}`
    ));
  }
  return { checked, errors };
}

function checkVersionReferences(root, file, markdown, currentVersion) {
  const errors = [];
  let checked = 0;
  for (const match of markdown.matchAll(VERSION_REFERENCE)) {
    checked += 1;
    const version = match[1];
    if (version !== currentVersion) {
      errors.push(error(
        "version-mismatch",
        root,
        file,
        lineNumber(markdown, match.index),
        version,
        `主题版本 ${version} 与 package.json ${currentVersion} 不一致`
      ));
    }
  }
  return { checked, errors };
}

function checkKnowledge(options = {}) {
  const root = path.resolve(options.root || ROOT);
  const knowledgeDir = path.join(root, options.knowledgeDir || DEFAULT_KNOWLEDGE_DIR);
  const configReferencePath = options.configReferencePath || DEFAULT_CONFIG_REFERENCE;
  const currentVersion = readJson(root, "package.json").version;
  const contract = configContract(root, configReferencePath);
  const files = walkMarkdown(knowledgeDir);
  const result = {
    filesChecked: files.length,
    linksChecked: 0,
    configReferencesChecked: 0,
    versionReferencesChecked: 0,
    errors: []
  };

  for (const file of files) {
    const markdown = fs.readFileSync(file, "utf8");
    const links = checkLinks(root, file, markdown);
    result.linksChecked += links.checked;
    result.errors.push(...links.errors);
    if (path.basename(file) === "VERIFICATION.md") continue;
    const config = checkConfigReferences(root, file, markdown, contract);
    result.configReferencesChecked += config.checked;
    result.errors.push(...config.errors);
    const versions = checkVersionReferences(root, file, markdown, currentVersion);
    result.versionReferencesChecked += versions.checked;
    result.errors.push(...versions.errors);
  }
  return result;
}

function main(argv = process.argv.slice(2)) {
  const json = argv.includes("--json");
  const result = checkKnowledge();
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(
      `知识库核查: ${result.filesChecked} 页 / ${result.linksChecked} 个链接 / `
      + `${result.configReferencesChecked} 个配置引用 / ${result.versionReferencesChecked} 个版本引用\n`
    );
    for (const finding of result.errors) {
      process.stderr.write(`  - ${finding.file}:${finding.line} ${finding.message}\n`);
    }
  }
  if (result.errors.length > 0) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
  checkKnowledge,
  stripFencedCode
};
