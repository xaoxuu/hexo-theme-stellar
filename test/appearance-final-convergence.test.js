"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { parseStellarConfig } = require("../scripts/lib/config-schema");
const { runDoctor } = require("../scripts/lib/doctor");

const ROOT = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");

test("Appearance 严格拒绝非法 CSS、Resource、selector 与 motion 值", () => {
  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      appearance: {
        typography: {
          font_size: { root: "-1px" },
          font_family: { body: "Arial; display:none" },
          content_align: "middle"
        },
        shape: { corner: "expression(alert(1))", radius: { card: "calc(1px)" } },
        colors: { primary: "red; color: blue" },
        gradients: { primary_action: "url(javascript:alert(1))" },
        motion: { avatar: "sometimes" },
        code_block: { highlight_stylesheet: "javascript:alert(1)" },
        backgrounds: {
          sidebar: { image: "url(/sidebar.webp)", opacity: 1.1 },
          page: { backdrop: { saturation: "-1%" } }
        }
      },
      extensions: { features: { lightbox: { selector: "img { display:none }" } } }
    }
  }), error => {
    for (const pathValue of [
      "appearance.typography.font_size.root",
      "appearance.typography.font_family.body",
      "appearance.typography.content_align",
      "appearance.shape.corner",
      "appearance.shape.radius.card",
      "appearance.colors.primary",
      "appearance.gradients.primary_action",
      "appearance.motion.avatar",
      "appearance.code_block.highlight_stylesheet",
      "appearance.backgrounds.sidebar.image",
      "appearance.backgrounds.sidebar.opacity",
      "appearance.backgrounds.page.backdrop.saturation",
      "extensions.features.lightbox.selector"
    ]) assert.equal(error.issues.some(issue => issue.path === pathValue), true, pathValue);
    return true;
  });
});

test("Resources、Background、Highlight、404 与 Inject 只消费最终结构", () => {
  const config = read("_config.yml");
  const internal = read("scripts/lib/internal-constants.js");
  const css = [read("source/css/_components/main.styl"), read("source/css/_components/sidebar/sidebar.styl")].join("\n");
  const head = read("layout/_partial/head.ejs");
  const scripts = read("layout/_partial/scripts.ejs");
  const errorPage = read("layout/404.ejs");

  assert.match(config, /fallbacks:\n[ ]{4}avatar:[^\n]+\n[ ]{4}link_card:[^\n]+\n[ ]{4}cover:[^\n]+\n[ ]{2}error_page:\n[ ]{4}image:/);
  assert.doesNotMatch(config, /fallbacks:[\s\S]*?(?:project_icon|topic_cover|tag_plugin):/);
  assert.match(internal, /resources: \{[\s\S]*projectIcon:[\s\S]*banner:[\s\S]*topicCover:[\s\S]*contentImage:/);
  assert.match(config, /image: https:\/\//);
  assert.doesNotMatch(config, /image: url\(/);
  assert.match(css, /background-image: unquote\("url\('%s'\)"/);
  assert.match(head, /highlightStylesheet/);
  assert.match(errorPage, /resources\.errorPage\.image/);
  assert.match(errorPage, /if \(errorImage\)/);
  assert.match(head, /stellar_inject\('headEnd'/);
  assert.match(scripts, /stellar_inject\('bodyEnd'/);
});

test("搜索生成器按稳定页面键消费 visibility.searchable", () => {
  const search = read("scripts/generators/search.js");
  assert.match(search, /getPageConfig\((?:post|page)\)/);
  assert.doesNotMatch(search, /pageConfigs\.get\(/);
});

test("doctor 为本轮退出字段给出最终目标或明确删除", () => {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "stellar-final-config-"));
  fs.writeFileSync(path.join(baseDir, "_config.yml"), "title: Test\ntheme: stellar\n");
  fs.writeFileSync(path.join(baseDir, "_config.stellar.yml"), [
    "appearance:",
    "  typography:",
    "    text_align: left",
    "    font_family:",
    "      inline_code: monospace",
    "  colors:",
    "    theme: '#fff'",
    "  gradients:",
    "    angle: 200deg",
    "  code_block:",
    "    highlight_theme: /highlight.css",
    "  backgrounds:",
    "    sidebar:",
    "      blur:",
    "        radius: 10px",
    "resources:",
    "  fallbacks:",
    "    project_icon: /project.svg",
    "    error_page: /404.svg",
    "inject:",
    "  head: '<meta name=\"legacy\">'",
    "  script: '<script>legacy()</script>'",
    ""
  ].join("\n"));

  const result = runDoctor({ baseDir, nodeVersion: "22.0.0", hexoVersion: "8.1.0" });
  assert.equal(result.ok, false);
  const issue = pathValue => result.issues.find(item => item.path === pathValue);
  assert.equal(issue("appearance.typography.text_align").expected, "appearance.typography.content_align");
  assert.equal(issue("appearance.typography.font_family.inline_code").expected, "appearance.typography.font_family.code");
  assert.equal(issue("appearance.colors.theme").expected, "appearance.colors.primary");
  assert.match(issue("appearance.gradients.angle").expected, /remove field/);
  assert.equal(issue("appearance.code_block.highlight_theme").expected, "appearance.code_block.highlight_stylesheet");
  assert.equal(issue("appearance.backgrounds.sidebar.blur").expected, "appearance.backgrounds.sidebar.backdrop");
  assert.match(issue("resources.fallbacks.project_icon").expected, /remove field/);
  assert.equal(issue("resources.fallbacks.error_page").expected, "resources.error_page.image");
  assert.equal(issue("inject.head").expected, "inject.head_end");
  assert.equal(issue("inject.script").expected, "inject.body_end");
});
