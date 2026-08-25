"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { buildBlueprintPlan, writeBlueprintPlan } = require("../scripts/lib/blueprints");
const { formatDoctorJson, formatDoctorText, runDoctor } = require("../scripts/lib/doctor");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "stellar-doctor-test-"));
}

function initializedSite(blueprint) {
  const baseDir = tempDir();
  fs.writeFileSync(path.join(baseDir, "_config.yml"), "title: Test\ntheme: stellar\n");
  writeBlueprintPlan(buildBlueprintPlan({
    baseDir,
    blueprint,
    generatedAt: new Date("2026-08-23T12:34:00+08:00")
  }));
  return baseDir;
}

test("doctor 通过三套 Blueprint 的环境、主题、Collection 与 Front Matter 检查", () => {
  for (const blueprint of ["classic-blog", "minimal-reading", "docs-reference"]) {
    const result = runDoctor({ baseDir: initializedSite(blueprint), nodeVersion: "22.18.0", hexoVersion: "8.0.0" });
    assert.equal(result.ok, true, `${blueprint}: ${formatDoctorText(result)}`);
    assert.equal(Object.isFrozen(result), true);
    assert.equal(result.issues.length, 0);
  }
});

test("doctor 聚合环境、主题配置、Collection 与 Front Matter 的来源化问题", () => {
  const baseDir = tempDir();
  fs.mkdirSync(path.join(baseDir, "source/_data/wiki"), { recursive: true });
  fs.mkdirSync(path.join(baseDir, "source/wiki/example"), { recursive: true });
  fs.writeFileSync(path.join(baseDir, "_config.yml"), "theme: landscape\n");
  fs.writeFileSync(path.join(baseDir, "_config.stellar.yml"), "legacy: true\n");
  fs.writeFileSync(path.join(baseDir, "source/_data/wiki/example.yml"), "name: Example\nunknown: true\n");
  fs.writeFileSync(path.join(baseDir, "source/wiki/example/index.md"), "---\ncollection:\n  profile: wiki\n---\n");

  const result = runDoctor({ baseDir, nodeVersion: "20.0.0", hexoVersion: "7.3.0" });
  assert.equal(result.ok, false);
  for (const item of result.issues) {
    assert.deepEqual(Object.keys(item), ["code", "source", "path", "actualType", "expected", "migration"]);
  }
  assert.equal(result.issues.some(item => item.source === "environment" && item.path === "node"), true);
  assert.equal(result.issues.some(item => item.source === "_config.yml" && item.path === "theme"), true);
  assert.equal(result.issues.some(item => item.source === "_config.stellar.yml" && item.path === "legacy"), true);
  assert.equal(result.issues.some(item => item.source.endsWith("example.yml") && item.path === "unknown"), true);
  assert.equal(result.issues.some(item => item.source.endsWith("index.md") && item.path === "collection.id"), true);
});

test("doctor text/json 输出稳定表达同一结果", () => {
  const result = runDoctor({ baseDir: initializedSite("classic-blog"), nodeVersion: "22.0.0", hexoVersion: "8.1.0" });
  assert.match(formatDoctorText(result), /^Stellar doctor: PASS/);
  assert.deepEqual(JSON.parse(formatDoctorJson(result)), result);
});

test("doctor 为 Content、Collection 与 Front Matter 旧路径给出最终迁移目标", () => {
  const baseDir = initializedSite("classic-blog");
  fs.mkdirSync(path.join(baseDir, "source/_data/topic"), { recursive: true });
  fs.mkdirSync(path.join(baseDir, "source/_posts"), { recursive: true });
  fs.writeFileSync(path.join(baseDir, "_config.stellar.yml"), "content:\n  article:\n    type: story\n    indent: true\n    related_posts:\n      enabled: true\n");
  fs.writeFileSync(path.join(baseDir, "source/_data/topic/legacy.yml"), "name: Legacy\nlisting:\n  order_by: -date\n");
  fs.writeFileSync(path.join(baseDir, "source/_posts/legacy.md"), "---\ntitle: Legacy\narticle:\n  type: story\n  indent: true\n---\n");

  const result = runDoctor({ baseDir, nodeVersion: "22.0.0", hexoVersion: "8.1.0" });
  assert.equal(result.ok, false);
  assert.equal(result.issues.some(item => item.path === "content.article.type" && item.expected === "content.article.style"), true);
  assert.equal(result.issues.some(item => item.path === "content.article.indent" && item.expected === "content.article.paragraph_indent"), true);
  assert.equal(result.issues.some(item => item.path === "content.article.related_posts" && item.expected === "content.article.related_posts_limit"), true);
  assert.equal(result.issues.some(item => item.path === "listing.order_by" && item.expected === "listing.sort"), true);
  assert.equal(result.issues.some(item => item.path === "article.type" && item.expected === "article.style"), true);
  assert.equal(result.issues.some(item => item.path === "article.indent" && item.expected === "article.paragraph_indent"), true);
});

test("doctor 为 Extensions 旧路径给出最终迁移目标或明确删除", () => {
  const baseDir = initializedSite("classic-blog");
  fs.writeFileSync(path.join(baseDir, "_config.stellar.yml"), [
    "extensions:",
    "  search:",
    "    providers:",
    "      local:",
    "        index_path: /custom.json",
    "        cache_ttl: 10",
    "  tags:",
    "    image:",
    "      parse_markdown: true",
    "  features:",
    "    ai_summary:",
    "      enabled: true",
    "    preload:",
    "      enabled: true",
    "  services:",
    "    site_info:",
    "      endpoint: null",
    "    rating:",
    "      endpoint: https://rating.example.com",
    "    github:",
    "      card_url: https://cards.example.com",
    ""
  ].join("\n"));

  const result = runDoctor({ baseDir, nodeVersion: "22.0.0", hexoVersion: "8.1.0" });
  assert.equal(result.ok, false);
  assert.equal(result.issues.some(item => item.path.endsWith("index_path") && item.expected.includes("remove field")), true);
  assert.equal(result.issues.some(item => item.path.endsWith("cache_ttl") && item.expected.endsWith("cache_ttl_seconds")), true);
  assert.equal(result.issues.some(item => item.path.endsWith("tags.image") && item.expected.includes("remove field")), true);
  assert.equal(result.issues.some(item => item.path.endsWith("features.ai_summary") && item.expected.includes("remove field")), true);
  assert.equal(result.issues.some(item => item.path.endsWith("features.preload") && item.expected.endsWith("link_prefetch")), true);
  assert.equal(result.issues.some(item => item.path.endsWith("site_info.endpoint") && item.expected.endsWith("site_info.provider")), true);
  assert.equal(result.issues.some(item => item.path.endsWith("rating.endpoint") && item.expected.endsWith("rating.providers.star_vote.endpoint")), true);
  assert.equal(result.issues.some(item => item.path.endsWith("github.card_url") && item.expected.endsWith("extensions.services.github_card.providers.github_readme_stats.endpoint")), true);
});

test("doctor 接受 BOM 与 CRLF Front Matter", () => {
  const baseDir = initializedSite("classic-blog");
  const page = path.join(baseDir, "source/_posts/crlf.md");
  fs.writeFileSync(page, "\uFEFF---\r\ntitle: CRLF\r\n---\r\nBody\r\n");
  const result = runDoctor({ baseDir, nodeVersion: "22.0.0", hexoVersion: "8.1.0" });
  assert.equal(result.ok, true, formatDoctorText(result));
});
