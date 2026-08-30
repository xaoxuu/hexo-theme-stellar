/* global hexo */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const { ConfigSchemaError, deepFreeze, parseStellarConfig } = require("./config-schema");
const { ContentConfigError, parseCollectionConfig, parsePageConfig } = require("./content-config");
const {
  createCollectionRegistry,
  resolveContentMembership,
  sourcePagePath
} = require("./content-membership");
const { FrontMatterParseError, parseFrontMatterYaml } = require("./front-matter");
const { resolveRegions } = require("./regions");

function issue(code, source, fieldPath, actualType, expected, migration) {
  return Object.freeze({ code, source, path: fieldPath, actualType, expected, migration });
}

function relative(baseDir, file) {
  return path.relative(baseDir, file).replace(/\\/g, "/") || ".";
}

function major(version) {
  const match = String(version || "").match(/^(?:v)?(\d+)/);
  return match ? Number(match[1]) : null;
}

function yamlValue(file, source, issues) {
  try {
    return yaml.load(fs.readFileSync(file, "utf8"), { filename: source }) || {};
  } catch (error) {
    issues.push(issue("invalid_yaml", source, "root", "invalid YAML", "valid YAML document", "configuration/v2"));
    return null;
  }
}

function frontMatterValue(file, source, issues) {
  const content = fs.readFileSync(file, "utf8");
  try {
    return parseFrontMatterYaml(content, source);
  } catch (error) {
    if (!(error instanceof FrontMatterParseError)) throw error;
    const actualType = error.kind === "unterminated" ? "unterminated front matter" : "invalid YAML";
    issues.push(issue("invalid_yaml", source, "root", actualType, "valid YAML front matter", "content-schema/front-matter"));
    return null;
  }
}

function filesBelow(root, predicate) {
  if (!fs.existsSync(root)) return [];
  const result = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && predicate(file)) result.push(file);
    }
  };
  visit(root);
  return result;
}

function collectSchemaIssues(callback, issues) {
  try {
    return callback();
  } catch (error) {
    if (!(error instanceof ConfigSchemaError) && !(error instanceof ContentConfigError)) throw error;
    issues.push(...error.issues);
    return null;
  }
}

function widgetCatalog(baseDir) {
  const themeFile = path.resolve(__dirname, "../../_data/widgets.yml");
  const siteFile = path.join(baseDir, "source/_data/widgets.yml");
  const theme = yaml.load(fs.readFileSync(themeFile, "utf8"), { filename: themeFile }) || {};
  if (!fs.existsSync(siteFile)) return theme;
  const site = yaml.load(fs.readFileSync(siteFile, "utf8"), { filename: siteFile }) || {};
  const result = { ...theme };
  for (const [id, descriptor] of Object.entries(site)) {
    if (descriptor == null || descriptor.length === 0) delete result[id];
    else result[id] = { ...(result[id] || {}), ...descriptor };
  }
  return result;
}

function placementWarnings(options) {
  const resolved = resolveRegions({
    profile: options.profile,
    defaultState: options.defaultState,
    catalog: options.catalog,
    layers: options.layers
  });
  return resolved.warnings.map(warning => Object.freeze({
    code: warning.code,
    severity: "warning",
    source: options.source,
    path: `layout=${options.profile}; region=${warning.region}`,
    widget: warning.widget,
    layout: warning.layout,
    region: warning.region,
    supported: warning.supported
  }));
}

function runDoctor(options = {}) {
  const baseDir = path.resolve(options.baseDir || process.cwd());
  const nodeVersion = String(options.nodeVersion || process.versions.node);
  const hexoVersion = String(options.hexoVersion || "");
  const issues = [];
  const warnings = [];
  const catalog = widgetCatalog(baseDir);

  if (major(nodeVersion) == null || major(nodeVersion) < 22) {
    issues.push(issue("unsupported_version", "environment", "node", `string:${nodeVersion || "unknown"}`, "Node.js >= 22", "start/requirements"));
  }
  if (major(hexoVersion) == null || major(hexoVersion) < 8) {
    issues.push(issue("unsupported_version", "environment", "hexo", `string:${hexoVersion || "unknown"}`, "Hexo >= 8", "start/requirements"));
  }

  const siteConfigPath = path.join(baseDir, "_config.yml");
  let siteConfig = {};
  if (!fs.existsSync(siteConfigPath)) {
    issues.push(issue("missing_file", "_config.yml", "root", "missing", "Hexo site config", "start/install"));
  } else {
    siteConfig = yamlValue(siteConfigPath, "_config.yml", issues) || {};
    if (siteConfig.theme !== "stellar") {
      issues.push(issue("invalid_value", "_config.yml", "theme", typeof siteConfig.theme, "stellar", "start/install"));
    }
  }

  const stellarConfigPath = path.join(baseDir, "_config.stellar.yml");
  let stellarConfig = null;
  if (fs.existsSync(stellarConfigPath)) {
    const value = yamlValue(stellarConfigPath, "_config.stellar.yml", issues);
    if (value != null) stellarConfig = collectSchemaIssues(() => parseStellarConfig({
      source: "_config.stellar.yml",
      themeConfig: value,
      siteConfig
    }), issues);
  } else {
    stellarConfig = collectSchemaIssues(() => parseStellarConfig({
      source: "Stellar Schema defaults",
      themeConfig: {},
      siteConfig
    }), issues);
  }

  if (stellarConfig) {
    for (const [profile, profileConfig] of Object.entries(stellarConfig.layout.profiles)) {
      warnings.push(...placementWarnings({
        profile,
        source: fs.existsSync(stellarConfigPath) ? "_config.stellar.yml" : "Stellar Schema defaults",
        catalog,
        defaultState: stellarConfig.layout.regions.leftbar.defaultState,
        layers: [stellarConfig.layout.regions, profileConfig.regions]
      }));
    }
  }

  const collectionConfigs = new Map();
  for (const collectionRoot of ["wiki", "topic", "notebooks"]) {
    const directory = path.join(baseDir, "source", "_data", collectionRoot);
    for (const file of filesBelow(directory, item => /\.ya?ml$/i.test(item))) {
      const source = relative(baseDir, file);
      const value = yamlValue(file, source, issues);
      if (value != null) {
        const parsed = collectSchemaIssues(() => parseCollectionConfig(value, source), issues);
        if (parsed != null) {
          const key = relative(path.join(baseDir, "source", "_data"), file).replace(/\.ya?ml$/i, "");
          collectionConfigs.set(key, parsed);
          const profile = collectionRoot === "notebooks" ? "note" : collectionRoot;
          if (stellarConfig) warnings.push(...placementWarnings({
            profile,
            source,
            catalog,
            defaultState: stellarConfig.layout.regions.leftbar.defaultState,
            layers: [
              stellarConfig.layout.regions,
              stellarConfig.layout.profiles[profile]?.regions,
              parsed.regions,
              parsed.noteDefaults?.regions
            ]
          }));
        }
      }
    }
  }

  const membershipRegistry = createCollectionRegistry(collectionConfigs);
  const sourceRoot = path.join(baseDir, "source");
  for (const file of filesBelow(sourceRoot, item => item.endsWith(".md"))) {
    const source = relative(baseDir, file);
    const value = frontMatterValue(file, source, issues);
    if (value != null) {
      const parsed = collectSchemaIssues(() => parsePageConfig(value, source), issues);
      if (parsed == null) continue;
      const resolved = resolveContentMembership({
        kind: source.startsWith("source/_posts/") ? "posts" : "pages",
        source,
        pagePath: parsed.permalink || sourcePagePath(source),
        config: parsed,
        registry: membershipRegistry
      });
      issues.push(...resolved.issues);
      const finalConfig = resolved.config || parsed;
      const profile = finalConfig.collection?.profile
        || (source.startsWith("source/_posts/") ? "post" : (parsed.layout || "page"));
      const collectionKey = finalConfig.collection
        ? `${finalConfig.collection.profile === "notebook" ? "notebooks" : finalConfig.collection.profile}/${finalConfig.collection.id}`
        : null;
      const collection = collectionKey ? collectionConfigs.get(collectionKey) : null;
      if (stellarConfig) warnings.push(...placementWarnings({
        profile,
        source,
        catalog,
        defaultState: stellarConfig.layout.regions.leftbar.defaultState,
        layers: [
          stellarConfig.layout.regions,
          stellarConfig.layout.profiles[profile]?.regions,
          collection?.regions,
          profile === "notebook" ? collection?.noteDefaults?.regions : null,
          finalConfig.regions
        ]
      }));
    }
  }

  return deepFreeze({
    ok: issues.length === 0,
    environment: {
      node: nodeVersion,
      hexo: hexoVersion,
      baseDir
    },
    checked: {
      themeConfig: fs.existsSync(stellarConfigPath),
      collections: filesBelow(path.join(baseDir, "source", "_data"), item => /\/(wiki|topic|notebooks)\/.*\.ya?ml$/i.test(item)).length,
      pages: filesBelow(sourceRoot, item => item.endsWith(".md")).length
    },
    issues: issues.map(item => Object.freeze({ ...item })),
    warnings
  });
}

function formatDoctorText(result) {
  const lines = [
    `Stellar doctor: ${result.ok ? "PASS" : "FAIL"}`,
    `Node.js: ${result.environment.node}`,
    `Hexo: ${result.environment.hexo}`,
    `Checked: ${result.checked.themeConfig ? "theme config" : "Schema defaults"}, ${result.checked.collections} collection file(s), ${result.checked.pages} Markdown file(s)`
  ];
  if (result.issues.length > 0) {
    lines.push(`Issues (${result.issues.length}):`);
    for (const item of result.issues) {
      lines.push(`- ${item.source}: ${item.path}; actual=${item.actualType}; expected=${item.expected}; migration=${item.migration}`);
    }
  }
  if (result.warnings.length > 0) {
    lines.push(`Warnings (${result.warnings.length}):`);
    for (const item of result.warnings) {
      lines.push(`- ${item.source}: Widget ${item.widget} (layout=${item.layout}) does not support ${item.region}; supported=${item.supported.join(",") || "none"}; skipped`);
    }
  }
  return lines.join("\n");
}

function formatDoctorJson(result) {
  return JSON.stringify(result, null, 2);
}

module.exports = {
  formatDoctorJson,
  formatDoctorText,
  runDoctor
};
