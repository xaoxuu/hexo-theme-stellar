"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const { CONFIG_SCHEMA } = require("../scripts/schema/config-schema");

const ROOT = path.resolve(__dirname, "..");
const CONFIG_SOURCE = fs.readFileSync(path.join(ROOT, "_config.yml"), "utf8");
const CONFIG = yaml.load(CONFIG_SOURCE);

const COMMENTED_VALUES = Object.freeze({
  "site.brand.image.src": "      src: # /avatar.webp",
  "site.brand.image.href": "      href: # /about/",
  "site.brand.name": "    name: # Stellar",
  "site.brand.wordmark": "    wordmark: # /images/wordmark.svg",
  "site.brand.tagline.text": "      text: # 每个人的独立博客",
  "site.brand.tagline.hover": "      hover: # example.com"
});

const STRUCTURAL_CONTRACTS = Object.freeze({
  "site.menu.items[]": {
    fields: ["id", "title", "icon", "url", "accent"],
    markers: ["    # - id: post", "    #   accent: '#1BCDFC'", "    #   icon: default:documents", "    #   title: 博客", "    #   url: /"]
  },
  "site.footer.actions[]": {
    fields: ["type", "icon", "title", "url", "onclick", "items"],
    markers: ["    # - type: link", "    # - type: dropdown", "    # - type: spacer"]
  },
  "site.footer.actions[].items[]": {
    fields: ["type", "icon", "title", "url", "onclick"],
    markers: ["    #   items:", "    #     - type: button", "    #       title: 浅色", "    #       onclick: window.setColorScheme?.('light')"]
  },
  "site.footer.sections[]": {
    fields: ["title", "items"],
    markers: ["    # - title: 博客", "    #   items:"]
  },
  "site.footer.sections[].items[]": {
    fields: ["title", "url"],
    markers: ["    #     - title: 近期发布", "    #       url: /"]
  },
  "layout.profiles.blog_index.navigation.tabs[]": {
    fields: ["title", "url"],
    markers: ["          # - title: 朋友文章", "          #   url: /friends/rss/"]
  },
  "layout.profiles.wiki_index.navigation.tabs[]": {
    fields: ["title", "url"],
    markers: ["          # - title: more", "          #   url: https://github.com/xaoxuu"]
  },
  "content.article.category_colors.<category>": {
    fields: ["<value:string>"],
    markers: ["      '探索号': '#f44336'"]
  },
  "content.notebook.tag_icons.<tag>": {
    fields: ["<value:string>"],
    markers: ["    # tools: default:tools"]
  },
  "extensions.comments.providers.<provider>": {
    fields: ["<value:object>"],
    markers: ["    # 提供方参数袋；只读取 provider 选中的一组，字段按各上游 SDK 透传。[对象]"]
  },
  "extensions.tags.quot.<variant>": {
    fields: ["prefix", "suffix"],
    markers: ["    # 每个 variant 的 prefix/suffix 均为图标 ID 字符串或 null", "        prefix: quot:quote-left", "        suffix: quot:quote-right"]
  },
  "extensions.tags.emoji.sources.<source>": {
    fields: ["<value:string>"],
    markers: ["      # 表情源 ID 到资源模板的映射。[开放对象；值必须是包含 {name} 的字符串模板]", "        twemoji: https://gcore.jsdelivr.net/gh/twitter/twemoji/assets/svg/{name}.svg"]
  },
  "extensions.services.contributors.providers.github.repositories[]": {
    fields: ["source_prefix", "repository", "branch"],
    markers: ["          # - source_prefix: wiki/stellar/", "          #   repository: xaoxuu/hexo-theme-stellar", "          #   branch: main"]
  }
});

function closedLeafPaths(definition, parents = [], result = []) {
  const properties = definition.properties || {};
  if (Object.keys(properties).length === 0) {
    result.push(parents.join("."));
    return result;
  }
  for (const [key, child] of Object.entries(properties)) {
    closedLeafPaths(child, [...parents, key], result);
  }
  return result;
}

function hasConfigPath(config, configPath) {
  let current = config;
  for (const key of configPath.split(".")) {
    if (current == null || typeof current !== "object" || !Object.prototype.hasOwnProperty.call(current, key)) return false;
    current = current[key];
  }
  return true;
}

function structuralFields(definition) {
  if (definition.properties) return Object.keys(definition.properties);
  return [`<value:${definition.type.join("|")}>`];
}

function collectStructuralContracts(definition, parents = [], result = {}) {
  if (definition.items?.properties) {
    result[`${parents.join(".")}[]`] = Object.keys(definition.items.properties);
  }
  if (definition.additionalProperties) {
    const key = definition.additionalPropertyKey || "<key>";
    result[[...parents, key].join(".")] = structuralFields(definition.additionalProperties);
  }
  for (const [key, child] of Object.entries(definition.properties || {})) {
    collectStructuralContracts(child, [...parents, key], result);
  }
  if (definition.items) {
    const itemParents = [...parents.slice(0, -1), `${parents.at(-1)}[]`];
    collectStructuralContracts(definition.items, itemParents, result);
  }
  if (definition.additionalProperties) {
    collectStructuralContracts(
      definition.additionalProperties,
      [...parents, definition.additionalPropertyKey || "<key>"],
      result
    );
  }
  return result;
}

test("主题默认配置公开全部封闭字段，并在空值后注释示例值", () => {
  const missing = closedLeafPaths(CONFIG_SCHEMA)
    .filter(configPath => !hasConfigPath(CONFIG, configPath))
    .sort();

  assert.deepEqual(missing, []);
  for (const [configPath, marker] of Object.entries(COMMENTED_VALUES)) {
    assert.equal(hasConfigPath(CONFIG, configPath), true, `${configPath} 字段不可见`);
    assert.ok(CONFIG_SOURCE.includes(marker), `${configPath} 缺少行尾示例值：${marker.trim()}`);
  }
});

test("对象数组与动态映射都在主题默认配置中公开结构契约", () => {
  const actual = collectStructuralContracts(CONFIG_SCHEMA);
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(STRUCTURAL_CONTRACTS).sort());

  for (const [configPath, contract] of Object.entries(STRUCTURAL_CONTRACTS)) {
    assert.deepEqual(actual[configPath], contract.fields, `${configPath} 的结构字段已变化，请同步 _config.yml 示例`);
    for (const marker of contract.markers) {
      assert.ok(CONFIG_SOURCE.includes(marker), `${configPath} 缺少结构说明：${marker.trim()}`);
    }
  }
});
