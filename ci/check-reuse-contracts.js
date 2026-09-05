"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { globSync } = require("glob");
const { UI_CAPABILITIES } = require("../scripts/lib/ui-capabilities");

function lineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function stableSelector(openingTag) {
  const helper = openingTag.match(/ui_classes\(\s*['"]([^'"]+)/);
  if (helper) return helper[1].trim().split(/\s+/)[0];
  const dynamicHelper = openingTag.match(/ui_classes\(\s*`([^`]+)/);
  if (dynamicHelper) return dynamicHelper[1].trim().split(/\s+/)[0];
  const className = openingTag.match(/class=(?:["'`])([^"'`<%$+\s]+)/);
  return className ? className[1] : "<unknown>";
}

function stylusSelector(source, index) {
  const before = source.slice(0, index).split("\n");
  const propertyLine = before.pop() || "";
  const propertyIndent = (propertyLine.match(/^\s*/) || [""])[0].length;
  for (let cursor = before.length - 1; cursor >= 0; cursor -= 1) {
    const line = before[cursor];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;
    const indent = (line.match(/^\s*/) || [""])[0].length;
    if (indent < propertyIndent && !/^[\w-]+\s*:/.test(trimmed)) return trimmed;
  }
  return "<root>";
}

function matchesException(exceptions, file, selector) {
  return exceptions.some(exception => (
    exception.file === file &&
    exception.selector === selector &&
    typeof exception.reason === "string" &&
    exception.reason.trim().length > 0
  ));
}

function rawCapabilityMatches(source) {
  const candidates = Object.entries(UI_CAPABILITIES)
    .filter(([, classes]) => classes.includes(" "))
    .flatMap(([capability, classes]) => {
      const matches = [];
      let index = source.indexOf(classes);
      while (index >= 0) {
        matches.push({ capability, classes, index, end: index + classes.length });
        index = source.indexOf(classes, index + 1);
      }
      return matches;
    })
    .sort((left, right) => left.index - right.index || right.classes.length - left.classes.length);
  const kept = [];
  for (const candidate of candidates) {
    if (kept.some(match => candidate.index >= match.index && candidate.end <= match.end)) continue;
    kept.push(candidate);
  }
  return kept;
}

function checkReuseSources(options) {
  const {
    files,
    controlFiles = [],
    plainLinkExceptions = [],
    plainControlExceptions = [],
    protectedLiterals = [],
    rawCapabilityExclusions = []
  } = options;
  const errors = [];

  for (const [file, source] of Object.entries(files)) {
    if (!rawCapabilityExclusions.includes(file)) {
      for (const match of rawCapabilityMatches(source)) {
        errors.push(`${file}:${lineNumber(source, match.index)} raw UI capability ${match.capability}; use ui_classes() or ctx.ui.classes`);
      }
    }

    if (controlFiles.includes(file)) {
      const capabilityVariables = new Set(Array.from(source.matchAll(/(?:var|let|const)\s+(\w+)\s*=\s*ui_classes\(/g), match => match[1]));
      const controls = source.matchAll(/<(a|button|summary)\b[\s\S]*?>/gi);
      for (const match of controls) {
        const openingTag = match[0];
        const selector = stableSelector(openingTag);
        const usesHelper = /ui_classes\(/.test(openingTag);
        const usesCapabilityVariable = Array.from(capabilityVariables).some(name => new RegExp(`\\b${name}\\b`).test(openingTag));
        if (usesHelper || usesCapabilityVariable) continue;
        if (matchesException(plainControlExceptions, file, selector)) continue;
        if (match[1].toLowerCase() === "a" && matchesException(plainLinkExceptions, file, selector)) continue;
        errors.push(`${file}:${lineNumber(source, match.index)} unclassified control <${match[1].toLowerCase()}> ${selector}`);
      }
    }

    for (const rule of protectedLiterals) {
      const pattern = new RegExp(rule.pattern.source, rule.pattern.flags.includes("g") ? rule.pattern.flags : `${rule.pattern.flags}g`);
      for (const match of source.matchAll(pattern)) {
        const selector = file.endsWith(".styl") ? stylusSelector(source, match.index) : rule.field || "<literal>";
        if (matchesException(rule.exceptions || [], file, selector)) continue;
        if ((rule.excludedFiles || []).includes(file)) continue;
        errors.push(`${file}:${lineNumber(source, match.index)} protected literal ${rule.id} (${selector}); use ${rule.canonical}`);
      }
    }
  }
  return errors;
}

function readProjectFiles(root, patterns) {
  const names = globSync(patterns, { cwd: root, nodir: true, ignore: ["node_modules/**", "test/**", "docs/**"] }).sort();
  return Object.fromEntries(names.map(file => [file, fs.readFileSync(path.join(root, file), "utf8")]));
}

function runProjectCheck(root = path.resolve(__dirname, "..")) {
  const rules = require("./reuse-rules");
  const files = readProjectFiles(root, rules.SOURCE_GLOBS);
  const controlFiles = globSync(rules.CONTROL_GLOBS, { cwd: root, nodir: true }).sort();
  const errors = checkReuseSources({
    files,
    controlFiles,
    plainLinkExceptions: rules.PLAIN_LINK_EXCEPTIONS,
    plainControlExceptions: rules.PLAIN_CONTROL_EXCEPTIONS,
    protectedLiterals: rules.PROTECTED_LITERALS,
    rawCapabilityExclusions: rules.RAW_CAPABILITY_EXCLUSIONS
  });
  for (const dynamic of rules.DYNAMIC_CONTROL_RULES) {
    const source = files[dynamic.file];
    if (!source || !dynamic.pattern.test(source)) {
      errors.push(`${dynamic.file} dynamic control ${dynamic.selector} must use ${dynamic.capability}`);
    }
  }
  return errors;
}

if (require.main === module) {
  const errors = runProjectCheck();
  if (errors.length > 0) {
    console.error("reuse:check failed:\n" + errors.map(error => `- ${error}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log("reuse:check passed");
  }
}

module.exports = { checkReuseSources, runProjectCheck };
