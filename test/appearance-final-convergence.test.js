"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const yaml = require("js-yaml");

const { parseStellarConfig } = require("../scripts/lib/config-schema");
const { runDoctor } = require("../scripts/lib/doctor");

const ROOT = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");
let stylusRenderer;

function loadStylusRenderer() {
  if (stylusRenderer) return stylusRenderer;
  let renderer;
  global.hexo = {
    extend: {
      renderer: {
        register(_extension, _output, candidate) {
          renderer = candidate;
        }
      }
    }
  };
  require("hexo-renderer-stylus");
  delete global.hexo;
  if (typeof renderer !== "function") throw new TypeError("hexo-renderer-stylus 未注册 renderer");
  stylusRenderer = renderer;
  return stylusRenderer;
}

function renderMainCss(themeConfig) {
  const renderer = loadStylusRenderer();
  const sourcePath = path.join(ROOT, "source/css/main.styl");
  return new Promise((resolve, reject) => {
    renderer.call({
      config: { stylus: {} },
      theme: { config: themeConfig },
      execFilterSync(_name, style) {
        return style;
      }
    }, {
      path: sourcePath,
      text: read("source/css/main.styl")
    }, {}, (error, css) => {
      if (error) reject(error);
      else resolve(css);
    });
  });
}

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
  const parsedConfig = yaml.load(config);
  const internal = read("scripts/lib/internal-constants.js");
  const head = read("layout/_partial/head.ejs");
  const scripts = read("layout/_partial/scripts.ejs");
  const errorPage = read("layout/404.ejs");

  assert.deepEqual(Object.keys(parsedConfig.resources.fallbacks), ["avatar", "link_card", "cover"]);
  assert.equal(typeof parsedConfig.resources.error_page.image, "string");
  assert.doesNotMatch(config, /fallbacks:[\s\S]*?(?:project_icon|topic_cover|tag_plugin):/);
  assert.match(internal, /resources: \{[\s\S]*projectIcon:[\s\S]*banner:[\s\S]*topicCover:[\s\S]*contentImage:/);
  assert.match(config, /image: https:\/\//);
  assert.doesNotMatch(config, /image: url\(/);
  assert.match(head, /highlightStylesheet/);
  assert.match(errorPage, /resources\.errorPage\.image/);
  assert.match(errorPage, /if \(errorImage\)/);
  assert.match(head, /stellar_inject\('headEnd'/);
  assert.match(scripts, /stellar_inject\('bodyEnd'/);
});

test("原始 Background URL 编译为有效 CSS url()", async () => {
  const config = yaml.load(read("_config.yml"));
  config.appearance.backgrounds.sidebar.image = "https://example.test/sidebar.webp?variant=glass&size=small";
  config.appearance.backgrounds.page.image = "https://example.test/page.webp?variant=cover&size=large";

  const css = await renderMainCss(config);

  assert.match(css, /background-image: url\((["']?)https:\/\/example\.test\/sidebar\.webp\?variant=glass&size=small\1\);/);
  assert.match(css, /background-image: url\((["']?)https:\/\/example\.test\/page\.webp\?variant=cover&size=large\1\);/);
  assert.doesNotMatch(css, /url\((?:''|"")/);
});

test("Glass 侧栏覆盖层继承容器连续曲率", async () => {
  const config = yaml.load(read("_config.yml"));
  config.appearance.backgrounds.sidebar.surface = "glass";
  config.appearance.backgrounds.sidebar.image = null;

  const css = await renderMainCss(config);
  const overlayRule = css.match(/\.l_left \.leftbar-container:(?:before|after),\s*\.l_left \.leftbar-container:(?:before|after)\s*\{[^}]*\}/);

  assert.ok(overlayRule, "应生成侧栏 before/after 共用规则");
  assert.match(overlayRule[0], /corner-shape:\s*inherit;/);
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
