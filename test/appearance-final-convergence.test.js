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
const APPEARANCE_PRESETS = fs.readdirSync(path.join(ROOT, "source/css/_appearances"))
  .filter(file => file.endsWith(".styl") && !file.startsWith("_"))
  .map(file => path.basename(file, ".styl"))
  .sort();
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

test("Main 按 post/page 与其他页面使用独立的固定最大宽度", async () => {
  const customStyles = read("source/css/_custom.styl");
  const config = yaml.load(read("_config.yml"));
  const css = await renderMainCss(config);

  assert.match(customStyles, /--width-main-article: 720px/);
  assert.match(customStyles, /--width-main-default: 900px/);
  assert.match(customStyles, /--width-main: var\(--width-main-default\)/);
  assert.equal((customStyles.match(/--width-main:/g) || []).length, 2, "--width-main 只应包含默认值与 post\/page 覆盖");
  assert.doesNotMatch(customStyles, /--width-main: (?:780|860)px/);
  assert.match(
    customStyles,
    /body\[data-page-layout='post'\],\s*\nbody\[data-page-layout='page'\]\s*\n\s+--width-main: var\(--width-main-article\)/
  );
  assert.match(css, /:root\s*\{[^}]*--width-main-article:\s*720px;[^}]*--width-main-default:\s*900px;[^}]*--width-main:\s*var\(--width-main-default\);/);
  assert.match(css, /body\[data-page-layout=['"]?post['"]?\],\s*body\[data-page-layout=['"]?page['"]?\]\s*\{[^}]*--width-main:\s*var\(--width-main-article\);/);
});

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
        code_block: { highlight_stylesheet: "javascript:alert(1)" },
        backgrounds: {
          leftbar: { image: "url(/sidebar.webp)", opacity: 1.1 },
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
      "appearance.code_block.highlight_stylesheet",
      "appearance.backgrounds.leftbar.image",
      "appearance.backgrounds.leftbar.opacity",
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

test("Appearance 按预设单独编译语义视觉能力，DOM 不投影预设名称", async () => {
  const mainStyles = read("source/css/main.styl");
  const layoutStyles = read("source/css/_components/layout.styl");
  const sidebarStyles = read("source/css/_components/sidebar/sidebar.styl");
  const collectionStyles = read("source/css/_components/collection.styl");
  const widgetStyles = read("source/css/_components/widgets/widgets.styl");
  const tocStyles = read("source/css/_components/widgets/toc.styl");
  const region = read("layout/_partial/primitives/region.ejs");
  const shell = read("layout/_partial/primitives/shell.ejs");
  const layout = read("layout/layout.ejs");
  const preview = read("layout/collection-preview.ejs");
  const appearanceMixins = read("source/css/_appearances/_mixins.styl");

  assert.doesNotMatch(shell, /data-appearance|appearancePreset/);
  assert.match(region, /site-region--topbar ui-surface/);
  assert.match(region, /site-region--leftbar[\s\S]*?site-region__surface ui-surface/);
  assert.match(region, /site-region--rightbar[\s\S]*?site-region__surface ui-drawer-surface/);
  assert.match(preview, /collection-preview__surface ui-surface/);
  assert.doesNotMatch(layout, /appearancePreset|data-appearance/);

  const expectedImplementation = {
    card: /\.ui-surface\s*\{[^}]*border:\s*0;[^}]*background:\s*var\(--card\);[^}]*box-shadow:/,
    glass: /\.ui-surface\s*\{[^}]*background:\s*transparent;[^}]*backdrop-filter:\s*none/,
    minimal: /\.site-region--leftbar \.ui-surface\s*\{[^}]*background:\s*transparent/,
    flat: /\.site-region--topbar\.ui-surface,[^{]*\.site-region--leftbar \.site-region__surface\.ui-surface\s*\{[^}]*border-width:\s*0;[^}]*background:\s*var\(--bg-a20\)/
  };
  assert.match(mainStyles, /if \$appearance-preset == 'card'[\s\S]*@import '_appearances\/card'/);
  assert.ok(mainStyles.indexOf("@import '_plugins/index'") < mainStyles.indexOf("$appearance-preset ="));
  assert.match(appearanceMixins, /appearance-card-surface\(\)[\s\S]*appearance-glass-surface\(\)/);
  assert.match(appearanceMixins, /appearance-standard-interactions\(\)[\s\S]*\.ui-interactive:hover[\s\S]*details\[open\] > \.ui-interactive/);
  assert.doesNotMatch(appearanceMixins, /\.ui-collection__item|\.ui-collection-adapter|\.search-result li a/);
  assert.match(appearanceMixins, /appearance-standard-prose\(\)[\s\S]*table:not\(\[class\]\)[\s\S]*blockquote:before[\s\S]*\.md-text \.link-card/);
  assert.doesNotMatch(appearanceMixins, /appearance-components|appearance-prose-tokens|var\(--ui-(?:surface|drawer|interactive|prose|markdown|shell)/);
  for (const preset of APPEARANCE_PRESETS) {
    const appearanceSource = read(`source/css/_appearances/${preset}.styl`);
    const config = yaml.load(read("_config.yml"));
    config.appearance.preset = preset;
    const css = await renderMainCss(config);
    assert.match(appearanceSource, /appearance-standard-prose\(\)/);
    assert.doesNotMatch(appearanceSource, /data-appearance|--appearance-|\$appearance-(?:leftbar|navbar)/);
    assert.doesNotMatch(appearanceSource, /ui-drawer-surface/);
    assert.doesNotMatch(css, /data-appearance|--appearance-|--ui-(?:surface|drawer|interactive|prose|markdown|shell)-/);
    assert.match(css, /table:not\(\[class\]\) th\s*\{[^}]*background:\s*var\(--block\)/);
    assert.match(css, /blockquote:before\s*\{[^}]*background:\s*var\(--text-meta\)/);
    if (expectedImplementation[preset]) {
      assert.match(css, expectedImplementation[preset]);
    } else if (Object.hasOwn(expectedImplementation, preset)) {
      assert.doesNotMatch(css, /\.ui-surface\s*\{/);
    }
    assert.match(css, /@media screen and \(max-width:\s*1180px\)[\s\S]*?\.ui-drawer-surface\s*\{/);
    assert.match(css, /\.dropdown-menu\s*\{[^}]*backdrop-filter:\s*saturate\(300%\) blur\(16px\)/);
    assert.match(css, /\.ui-icon\s*\{[^}]*--ui-icon-opacity:\s*0\.5;[^}]*width:\s*var\(--ui-icon-size, 1\.5rem\)/);
    assert.match(css, /a\.is-active \.ui-icon,\s*button\.is-active \.ui-icon,\s*summary\.is-active \.ui-icon/);
    assert.match(css, /details\[open\] > summary \.ui-icon\s*\{[^}]*--ui-icon-color:\s*var\(--item-theme, var\(--theme\)\)/);
    assert.doesNotMatch(css, /summary\)\.(?:active|is-active)|summary\):/);
    assert.doesNotMatch(css, /--item-grad:/);
  }
  for (const componentStyles of [layoutStyles, sidebarStyles, collectionStyles, widgetStyles]) {
    assert.doesNotMatch(componentStyles, /data-appearance|--appearance-|\$appearance-(?:leftbar|navbar)/);
  }
  assert.doesNotMatch(collectionStyles, /--ui-item-(?:bg|shadow)|background: var\(--ui-item/);
  assert.doesNotMatch(widgetStyles, /--ui-action|background: var\(--ui-action/);
  assert.match(layoutStyles, /--shell-gap: 0px/);
  for (const floatingPreset of ["card", "glass"]) {
    assert.match(read(`source/css/_appearances/${floatingPreset}.styl`), /--shell-gap: var\(--gap-page\)/);
  }
  assert.match(layoutStyles, /\.site-region--topbar > \.site-region__viewport[\s\S]*?background: transparent/);
  assert.match(layoutStyles, /\.site-region--rightbar \.site-region__viewport[\s\S]*?background: transparent[\s\S]*?backdrop-filter: none/);
  assert.doesNotMatch(layoutStyles, /\.site-region--rightbar \.site-region__viewport[\s\S]*?appearance-drawer/);
  assert.doesNotMatch([region, layout, layoutStyles, sidebarStyles, collectionStyles, widgetStyles, tocStyles].join("\n"), /data-ui-surface|data-appearance/);
  assert.match(tocStyles, /:is\(\[data-region='leftbar'\], \[data-region='rightbar'\]\)/);
});

test("Rightbar Drawer 使用独立于 Appearance 的统一渐隐磨砂表面", async () => {
  const compiledSurfaceRules = new Set();
  const compiledBackdropRules = new Set();

  for (const preset of APPEARANCE_PRESETS) {
    const config = yaml.load(read("_config.yml"));
    config.appearance.preset = preset;
    const css = await renderMainCss(config);
    const surfaceRule = css.match(/\.site-region--rightbar \.site-region__surface\.ui-drawer-surface\s*\{[^}]*\}/)?.[0];
    const backdropRule = css.match(/\.site-region--rightbar \.site-region__surface\.ui-drawer-surface:before\s*\{[^}]*\}/)?.[0];

    assert.ok(surfaceRule, `${preset} 应生成统一的 Rightbar Drawer Surface`);
    assert.match(surfaceRule, /border:\s*0;/);
    assert.match(surfaceRule, /border-radius:\s*24px;/);
    assert.match(surfaceRule, /background:\s*transparent;/);
    assert.match(surfaceRule, /box-shadow:\s*none;/);
    assert.ok(backdropRule, `${preset} 应生成统一的 Rightbar Drawer 渐隐磨砂层`);
    assert.match(backdropRule, /background:\s*var\(--bg-a50\);/);
    assert.match(backdropRule, /backdrop-filter:\s*saturate\(300%\) blur\(16px\);/);
    assert.match(backdropRule, /mask-image:\s*linear-gradient\(to right, transparent, #000 16px, #000 calc\(100% - 16px\), transparent\), linear-gradient\(to bottom, transparent, #000 16px, #000 calc\(100% - 16px\), transparent\);/);
    assert.match(backdropRule, /mask-composite:\s*intersect;/);
    assert.doesNotMatch(backdropRule, /(?:^|\n)\s*border:\s|box-shadow/);

    compiledSurfaceRules.add(surfaceRule);
    compiledBackdropRules.add(backdropRule);
  }

  assert.equal(compiledSurfaceRules.size, 1, "四种 Appearance 应输出完全相同的 Drawer Surface");
  assert.equal(compiledBackdropRules.size, 1, "四种 Appearance 应输出完全相同的 Drawer 磨砂层");
});

test("Appearance 通过 ui-interactive 输出组件无关的交互能力", async () => {
  const compiled = {};
  for (const preset of APPEARANCE_PRESETS) {
    const config = yaml.load(read("_config.yml"));
    config.appearance.preset = preset;
    compiled[preset] = await renderMainCss(config);
  }

  for (const preset of ["card", "flat", "minimal"]) {
    assert.match(compiled[preset], /\.ui-interactive\s*\{[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/);
    assert.match(compiled[preset], /\.ui-interactive:hover,[^{]*\.ui-interactive:focus-visible\s*\{[^}]*background:\s*var\(--block\);[^}]*box-shadow:\s*none;/);
    assert.match(compiled[preset], /\.ui-interactive:active,[^{]*\.ui-interactive\.is-active,[^{]*details\[open\] > \.ui-interactive\s*\{[^}]*background:\s*var\(--block\);[^}]*box-shadow:\s*none;/);
  }

  assert.match(compiled.glass, /\.ui-interactive:hover,[^{]*\.ui-interactive:focus-visible,[^{]*\.ui-interactive:active,[^{]*\.ui-interactive\.is-active,[^{]*details\[open\] > \.ui-interactive\s*\{[^}]*linear-gradient\(180deg, rgba\(255,255,255,0\.38\), rgba\(255,255,255,0\) 50%\), var\(--bg-a50\);[^}]*box-shadow:\s*inset 0 1px 0 rgba\(255,255,255,0\.45\);/);
  assert.match(compiled.glass, /:root\[data-theme=["']dark["']\] \.ui-interactive:hover,[^{]*details\[open\] > \.ui-interactive\s*\{[^}]*linear-gradient\(180deg, rgba\(255,255,255,0\.08\), rgba\(255,255,255,0\) 50%\), var\(--bg-a20\);/);
  assert.doesNotMatch(read("source/css/_appearances/_mixins.styl"), /\.ui-collection__item|\.ui-collection-adapter|\.search-result li a/);
});

test("中等宽度常驻 Leftbar 不继承 Drawer 的外层模糊背景", async () => {
  const config = yaml.load(read("_config.yml"));
  config.appearance.preset = "glass";
  const css = await renderMainCss(config);

  assert.doesNotMatch(
    css,
    /:is\(\[data-region=["']?leftbar["']?\],\s*\[data-region=["']?rightbar["']?\]\)\s*\{[^}]*background-color:\s*var\(--blur-bg\)/,
    "响应式 TOC 样式不应把 Drawer 背景绘制到整个 Leftbar Region 轨道"
  );
});

test("Glass Topbar 与 Leftbar 共享容器材质且艺术背景仍限定 Leftbar", async () => {
  const appearanceMixins = read("source/css/_appearances/_mixins.styl");
  const utilities = read("source/css/_defines/func.styl");
  const region = read("layout/_partial/primitives/region.ejs");
  const config = yaml.load(read("_config.yml"));
  config.appearance.preset = "glass";
  config.appearance.backgrounds.leftbar.type = "image";
  config.appearance.backgrounds.leftbar.image = "https://example.test/leftbar-only.webp";
  const css = await renderMainCss(config);

  assert.match(appearanceMixins, /appearance-glass-surface\(\)[\s\S]*glass-material\(\$border-card-l\)/);
  assert.match(utilities, /newblur\(\$radius = 64px\)[\s\S]*glass-material\(\$radius\)/);
  assert.match(region, /site-region--topbar ui-surface/);
  assert.match(region, /site-region--leftbar[\s\S]*site-region__surface ui-surface/);
  assert.match(css, /\.ui-surface\s*\{[^}]*background:\s*transparent;[^}]*box-shadow:\s*0 0 2px rgba\(0,0,0,0\.04\), 0 2px 8px rgba\(0,0,0,0\.04\), 0 4px 16px rgba\(0,0,0,0\.04\);/);
  assert.match(css, /\.site-region--leftbar \.site-region__surface\.ui-surface\s*\{[^}]*box-shadow:\s*none;/);
  assert.match(css, /\.listing-nav__surface\.is-pinned\s*\{[^}]*box-shadow:\s*0 0 2px rgba\(0,0,0,0\.04\), 0 2px 8px rgba\(0,0,0,0\.04\), 0 4px 16px rgba\(0,0,0,0\.04\);/);
  assert.match(css, /\.ui-surface:before,\s*\.ui-surface:after\s*\{[^}]*border-radius:\s*24px;[^}]*corner-shape:\s*superellipse\(1\.25\);/);
  const baseBlurRule = Array.from(css.matchAll(/\.ui-surface:before\s*\{[^}]*\}/g), match => match[0]).find(rule => rule.includes("backdrop-filter: blur(8px)"));
  const wideHighlightRule = Array.from(css.matchAll(/\.ui-surface:after\s*\{[^}]*\}/g), match => match[0]).find(rule => rule.includes("--blur-sat: 300%"));
  assert.ok(baseBlurRule, "应生成与 Listing Nav 一致的基础模糊层");
  assert.match(baseBlurRule, /background:\s*var\(--bg-a50\);/);
  assert.match(baseBlurRule, /backdrop-filter:\s*blur\(8px\);/);
  assert.ok(wideHighlightRule, "应生成与 Listing Nav 一致的宽高光层");
  assert.match(wideHighlightRule, /--blur-sat:\s*300%;/);
  assert.match(wideHighlightRule, /background:\s*rgba\(255,255,255,0\.05\);/);
  assert.match(wideHighlightRule, /backdrop-filter:\s*saturate\(var\(--blur-sat\)\);/);
  assert.match(wideHighlightRule, /mask:\s*linear-gradient\(#000, rgba\(0,0,0,0\.5\), 70%, transparent, 90%, transparent\);/);
  assert.match(wideHighlightRule, /box-shadow:\s*inset 0 0 32px 1px rgba\(255,255,255,0\.5\);/);
  assert.doesNotMatch(wideHighlightRule, /--blur-px|inset 0 0 4px 1px/);
  assert.doesNotMatch(css, /:root\[data-theme=["']dark["']\] \.ui-surface:before\s*\{/);
  assert.doesNotMatch(css, /:root:not\(\[data-theme\]\) \.ui-surface:before\s*\{/);
  assert.match(css, /:root\[data-theme=["']dark["']\] \.ui-surface:after\s*\{[^}]*box-shadow:\s*inset 0 0 32px 1px rgba\(255,255,255,0\.1\);/);
  assert.match(css, /@media \(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*?:root:not\(\[data-theme\]\) \.ui-surface:after\s*\{[^}]*box-shadow:\s*inset 0 0 32px 1px rgba\(255,255,255,0\.1\);/);
  assert.doesNotMatch(css, /\.ui-surface:after\s*\{[^}]*box-shadow:\s*inset 0 0 (?:4px 1px rgba\(255,255,255,0\.5\)|2px 1px rgba\(255,255,255,0\.2\));/);
  assert.match(css, /\.site-region--leftbar \.site-region__decoration\s*\{[^}]*background-image:\s*url\((['"]?)https:\/\/example\.test\/leftbar-only\.webp\1\);/);
  assert.doesNotMatch(css, /\.site-region--topbar[^{}]*\{[^}]*leftbar-only\.webp/);
  assert.doesNotMatch(css, /\.site-region--topbar[^{}]*(?:decoration|site-region__viewport:after)/);
});

test("Card Topbar 贴合视口边缘并保留表面阴影", async () => {
  const config = yaml.load(read("_config.yml"));
  config.appearance.preset = "card";
  const css = await renderMainCss(config);
  const baseShellRules = [...css.matchAll(/\.site-shell\s*\{[^}]*\}/g)].map(match => match[0]);
  const shellRules = [...css.matchAll(/\.site-shell\[data-regions~='topbar'\]\s*\{[^}]*\}/g)].map(match => match[0]);
  const surfaceRule = css.match(/\.ui-surface\s*\{[^}]*\}/)?.[0];
  const topbarRule = css.match(/\.site-region--topbar\.ui-surface\s*\{[^}]*\}/)?.[0];

  assert.equal(shellRules.some(rule => /--shell-sticky-offset:\s*var\(--shell-topbar-height\);/.test(rule)), true, "应复用 Topbar 高度生成无外部间隙的占位规则");
  assert.equal(shellRules.some(rule => /--shell-topbar-bottom:\s*var\(--shell-topbar-height\);/.test(rule)), true, "应让 Leftbar 从 Card Topbar 实际底部开始计算间距");
  assert.equal(baseShellRules.some(rule => /--shell-topbar-top:\s*0px;/.test(rule)), true, "应让 Navbar 对齐 Card 通栏 Topbar 的实际顶部");
  assert.ok(surfaceRule, "应生成 Card 共享表面规则");
  assert.match(surfaceRule, /box-shadow:/);
  assert.ok(topbarRule, "应生成 Card Topbar 几何覆盖规则");
  assert.match(topbarRule, /top:\s*0;/);
  assert.match(topbarRule, /width:\s*100%;/);
  assert.match(topbarRule, /border-radius:\s*0;/);
  assert.doesNotMatch(topbarRule, /box-shadow:\s*none/);
});

test("Leftbar 轨道消费 Appearance 间距且保留零间距预设", async () => {
  for (const preset of APPEARANCE_PRESETS) {
    const config = yaml.load(read("_config.yml"));
    config.appearance.preset = preset;
    const css = await renderMainCss(config);
    const shellRules = [...css.matchAll(/\.site-shell\s*\{[^}]*\}/g)].map(match => match[0]);
    const leftbarTrackRule = css.match(/\.site-region--leftbar\s*\{[^}]*\}/)?.[0];

    assert.equal(shellRules.some(rule => /--leftbar-gap:\s*1rem;/.test(rule)), true, `${preset} 应保留 Leftbar 默认间距`);
    assert.equal(shellRules.some(rule => /--leftbar-gap:\s*0px;/.test(rule)), preset === "flat" || preset === "minimal", `${preset} 应保持 Appearance 的 Leftbar 间距语义`);
    assert.ok(leftbarTrackRule, `${preset} 应生成 Leftbar 轨道规则`);
    assert.match(leftbarTrackRule, /top:\s*var\(--leftbar-gap\);/);
  }
});

test("Topbar 正常流消费 Appearance 顶部坐标并与 Sticky 对齐", async () => {
  for (const preset of APPEARANCE_PRESETS) {
    const config = yaml.load(read("_config.yml"));
    config.appearance.preset = preset;
    const css = await renderMainCss(config);
    const shellRules = [...css.matchAll(/\.site-shell\s*\{[^}]*\}/g)].map(match => match[0]);
    const topbarShellRules = [...css.matchAll(/\.site-shell\[data-regions~=['"]topbar['"]\]\s*\{[^}]*\}/g)].map(match => match[0]);

    assert.equal(topbarShellRules.some(rule => /padding-top:\s*var\(--shell-topbar-top\);/.test(rule)), true, `${preset} 应让 Topbar 正常流消费内部顶部坐标`);
    assert.equal(shellRules.some(rule => /--shell-edge-inset:\s*16px;/.test(rule)), preset === "card" || preset === "glass", `${preset} 应保持 Appearance 的边缘间距语义`);
    assert.equal(shellRules.some(rule => /--shell-topbar-top:\s*0px;/.test(rule)), preset === "card", `${preset} 应保持 Card 通栏 Topbar 语义`);
  }
});

test("Topbar 内容与吸顶 Listing Nav 垂直居中，无 Topbar 时保留独立容器", async () => {
  for (const preset of APPEARANCE_PRESETS) {
    const config = yaml.load(read("_config.yml"));
    config.appearance.preset = preset;
    const css = await renderMainCss(config);
    const shellRules = [...css.matchAll(/\.site-shell\s*\{[^}]*\}/g)].map(match => match[0]);
    const topbarViewportRule = css.match(/\.site-region--topbar > \.site-region__viewport\s*\{[^}]*\}/)?.[0];
    const baseRule = css.match(/\.listing-nav\s*\{[^}]*\}/)?.[0];
    const geometryRule = css.match(/\.site-shell\[data-regions~=['"]topbar['"]\] \.listing-nav\s*\{[^}]*\}/)?.[0];
    const mergedRule = css.match(/\.site-shell\[data-regions~=['"]topbar['"]\] \.listing-nav \.listing-nav__surface\.is-pinned\s*\{[^}]*\}/)?.[0];
    const mergedLayersRule = css.match(/\.site-shell\[data-regions~=['"]topbar['"]\] \.listing-nav \.listing-nav__surface\.is-pinned:before,[^{]*\.site-shell\[data-regions~=['"]topbar['"]\] \.listing-nav \.listing-nav__surface\.is-pinned:after\s*\{[^}]*\}/)?.[0];

    assert.equal(shellRules.some(rule => /--shell-topbar-content-height:\s*calc\(var\(--shell-topbar-height\) - var\(--shell-topbar-content-inset\) - var\(--shell-topbar-content-inset\)\);/.test(rule)), true, `${preset} 应派生 Topbar 实际内容高度`);
    assert.equal(shellRules.some(rule => /--shell-topbar-height:\s*64px;/.test(rule)), true, `${preset} 应固定 Topbar 高度为 64px`);
    assert.equal(shellRules.some(rule => /--shell-topbar-content-center-offset:\s*calc\(var\(--shell-topbar-height\) \/ 2 - var\(--shell-topbar-content-inset\)\);/.test(rule)), true, `${preset} 应从固定高度派生 Topbar 内容中心偏移`);
    assert.ok(topbarViewportRule, `${preset} 应生成 Topbar Viewport 结构规则`);
    assert.match(topbarViewportRule, /height:\s*var\(--shell-topbar-content-height\);/);
    assert.ok(baseRule, `${preset} 应保留 Listing Nav 基础规则`);
    assert.match(baseRule, /top:\s*var\(--gap-page\);/);
    assert.match(baseRule, /z-index:\s*8;/);
    assert.ok(geometryRule, `${preset} 应生成 Topbar 内吸顶几何规则`);
    assert.match(geometryRule, /top:\s*calc\(var\(--shell-topbar-top\) \+ var\(--shell-topbar-content-inset\)\);/);
    assert.match(geometryRule, /z-index:\s*13;/);
    assert.ok(mergedRule, `${preset} 应生成 pinned Listing Nav 无容器规则`);
    assert.match(mergedRule, /background:\s*transparent;/);
    assert.match(mergedRule, /box-shadow:\s*none;/);
    assert.match(mergedRule, /text-shadow:\s*none;/);
    assert.match(mergedRule, /transform:\s*translateY\(var\(--shell-topbar-content-center-offset\)\) translateY\(-50%\);/);
    assert.ok(mergedLayersRule, `${preset} 应禁用 pinned Navbar 的表面伪层`);
    assert.match(mergedLayersRule, /display:\s*none;/);
  }
});

test("Topbar Menu Item 保持自然宽度并在窄屏横向滚动", async () => {
  const config = yaml.load(read("_config.yml"));
  const css = await renderMainCss(config);
  const itemRule = css.match(/\.site-region--topbar \.widget-instance--menu \.menu \.ui-collection \.ui-collection__item\s*\{[^}]*\}/)?.[0];
  const menuRule = css.match(/\.site-region--topbar \.widget-instance--menu\s*\{[^}]*overflow-x:\s*auto;[^}]*\}/)?.[0];

  assert.ok(itemRule, "应生成 Topbar Menu Item 几何规则");
  assert.match(itemRule, /flex:\s*0 0 auto;/);
  assert.match(itemRule, /width:\s*auto;/);
  assert.match(itemRule, /padding:\s*4px 10px;/);
  assert.ok(menuRule, "窄屏 Topbar Menu 应保留横向滚动容器");
  assert.doesNotMatch(css, /\.site-region--topbar \.widget-instance--menu \.menu \.ui-collection__item\s*\{[^}]*width:\s*40px;/);
});

test("Flat 将 Leftbar 四周间距覆盖为零", async () => {
  const config = yaml.load(read("_config.yml"));
  config.appearance.preset = "flat";
  const css = await renderMainCss(config);
  const shellRules = [...css.matchAll(/\.site-shell\s*\{[^}]*\}/g)].map(match => match[0]);

  assert.equal(shellRules.some(rule => /--leftbar-gap:\s*0px;/.test(rule)), true);
  assert.equal(shellRules.some(rule => /--shell-side-reserve:\s*max\(var\(--shell-left-reserve\), var\(--shell-right-reserve\)\);/.test(rule)), true);
  assert.match(css, /\.site-shell\[data-regions~='rightbar'\]\s*\{[^}]*--shell-side-gap:\s*max\(var\(--gap-page\), var\(--shell-gap\), var\(--shell-left-gap\)\);/);
});

test("四种 Appearance 的停靠列间距均以 gap-page 为下限", async () => {
  for (const preset of APPEARANCE_PRESETS) {
    const config = yaml.load(read("_config.yml"));
    config.appearance.preset = preset;
    const css = await renderMainCss(config);

    assert.match(css, /\.site-shell\[data-regions~='leftbar'\]\s*\{[^}]*--shell-side-gap:\s*max\(var\(--gap-page\), var\(--shell-gap\), var\(--shell-left-gap\)\);/);
    assert.match(css, /\.site-shell\[data-regions~='rightbar'\]\s*\{[^}]*--shell-side-gap:\s*max\(var\(--gap-page\), var\(--shell-gap\), var\(--shell-left-gap\)\);/);
    assert.match(css, /@media screen and \(min-width:\s*769px\) and \(max-width:\s*1180px\)[\s\S]*?\.site-shell\[data-regions~='leftbar'\] \.site-main\s*\{[^}]*width:\s*min\(var\(--width-main\), max\(0px, calc\(100% - var\(--shell-left-reserve\) - var\(--shell-side-gap\) - var\(--shell-side-gap\)\)\)\);[^}]*margin-inline:\s*0;[^}]*margin-inline-start:\s*calc\(var\(--shell-left-reserve\) \+ max\(var\(--shell-side-gap\), \(100% - var\(--shell-left-reserve\) - var\(--width-main\)\) \/ 2\)\);/);
  }
});

test("Flat Topbar 分割线不参与 Shell 几何尺寸", async () => {
  const config = yaml.load(read("_config.yml"));
  config.appearance.preset = "flat";
  const css = await renderMainCss(config);
  const sharedSurfaceRule = css.match(/\.site-region--topbar\.ui-surface,[^{]*\.site-region--leftbar \.site-region__surface\.ui-surface\s*\{[^}]*\}/)?.[0];
  const topbarRule = css.match(/\.site-region--topbar\.ui-surface\s*\{[^}]*\}/)?.[0];

  assert.ok(sharedSurfaceRule, "应生成 Flat Topbar 与 Leftbar 共享表面规则");
  assert.ok(topbarRule, "应生成 Flat Topbar 表面规则");
  assert.match(sharedSurfaceRule, /border-width:\s*0;/);
  assert.match(topbarRule, /box-shadow:\s*inset 0 -1px 0 var\(--block-border\);/);
  assert.doesNotMatch(sharedSurfaceRule, /border-width:\s*0 0 1px;/);
});

test("Flat Topbar 与 Leftbar 复用 a20 背景和无尺寸分割线", async () => {
  const config = yaml.load(read("_config.yml"));
  config.appearance.preset = "flat";
  const css = await renderMainCss(config);
  const sharedSurfaceRule = css.match(/\.site-region--topbar\.ui-surface,[^{]*\.site-region--leftbar \.site-region__surface\.ui-surface\s*\{[^}]*\}/)?.[0];
  const leftbarRule = css.match(/\.site-region--leftbar \.site-region__surface\.ui-surface\s*\{[^}]*box-shadow:[^}]*\}/)?.[0];

  assert.ok(sharedSurfaceRule, "应生成 Flat Topbar 与 Leftbar 共享表面规则");
  assert.match(sharedSurfaceRule, /border-width:\s*0;/);
  assert.match(sharedSurfaceRule, /background:\s*var\(--bg-a20\);/);
  assert.ok(leftbarRule, "应生成 Flat Leftbar 右侧分割线");
  assert.match(leftbarRule, /box-shadow:\s*inset -1px 0 0 var\(--block-border\);/);
  assert.doesNotMatch(leftbarRule, /border-right:/);
});

test("Minimal Leftbar 贴边布局且不保留内边距", async () => {
  const config = yaml.load(read("_config.yml"));
  config.appearance.preset = "minimal";
  const css = await renderMainCss(config);

  assert.match(css, /\.site-shell\s*\{[^}]*--leftbar-gap:\s*0px;/);
  assert.match(css, /\.site-region--leftbar \.site-region__viewport\s*\{[^}]*padding:\s*0;/);
});

test("Leftbar 背景由当前 Appearance 独立实现", async () => {
  const compiled = {};
  for (const preset of APPEARANCE_PRESETS) {
    const config = yaml.load(read("_config.yml"));
    config.appearance.preset = preset;
    config.appearance.backgrounds.leftbar.type = "image";
    config.appearance.backgrounds.leftbar.image = `https://example.test/${preset}-leftbar.webp`;
    compiled[preset] = await renderMainCss(config);
  }

  const leftbarOverlay = /\.site-region--leftbar \.site-region__viewport:(?:before|after)/;
  const pinnedListingNavGlass = /\.listing-nav__surface\.is-pinned:(?:before|after)/;

  assert.match(compiled.minimal, /\.site-region--leftbar \.ui-surface\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;[^}]*backdrop-filter:\s*none;/);
  for (const preset of ["flat", "minimal"]) {
    assert.doesNotMatch(compiled[preset], new RegExp(`https://example\\.test/${preset}-leftbar\\.webp`));
    assert.doesNotMatch(compiled[preset], /conic-gradient\(from 210deg at 32% 72%/);
  }

  assert.match(compiled.flat, /\.site-region--topbar\.ui-surface,[^{]*\.site-region--leftbar \.site-region__surface\.ui-surface\s*\{[^}]*background:\s*var\(--bg-a20\);/);
  assert.match(compiled.flat, /:root\[data-theme=["']dark["']\] \.site-region--topbar\.ui-surface,[^{]*:root\[data-theme=["']dark["']\] \.site-region--leftbar \.site-region__surface\.ui-surface\s*\{[^}]*background:\s*var\(--bg-a20\);/);
  assert.match(compiled.flat, /@media screen and \(prefers-color-scheme:\s*dark\)[\s\S]*?:root:not\(\[data-theme\]\) \.site-region--topbar\.ui-surface,[^{]*:root:not\(\[data-theme\]\) \.site-region--leftbar \.site-region__surface\.ui-surface\s*\{[^}]*background:\s*var\(--bg-a20\);/);
  assert.match(compiled.card, /\.site-region--leftbar \.ui-surface\s*\{[^}]*background:\s*var\(--card\);/);
  assert.doesNotMatch(compiled.card, /https:\/\/example\.test\/card-leftbar\.webp|conic-gradient\(from 210deg at 32% 72%/);

  assert.match(compiled.glass, /background-image:\s*url\((['"]?)https:\/\/example\.test\/glass-leftbar\.webp\1\);/);
  assert.match(compiled.glass, leftbarOverlay);
  assert.match(compiled.glass, pinnedListingNavGlass);
  assert.match(compiled.glass, /\.listing-nav__surface\.is-pinned:before\s*\{[^}]*backdrop-filter:\s*blur\(8px\)/);

  for (const preset of APPEARANCE_PRESETS) {
    assert.match(compiled[preset], /\.site-region--rightbar \.site-region__viewport\s*\{[^}]*background:\s*transparent;[^}]*backdrop-filter:\s*none;/);
  }
});

test("原始 Background URL 编译为有效 CSS url()", async () => {
  const config = yaml.load(read("_config.yml"));
  config.appearance.preset = "glass";
  config.appearance.backgrounds.leftbar.type = "image";
  config.appearance.backgrounds.leftbar.image = "https://example.test/sidebar.webp?variant=glass&size=small";
  config.appearance.backgrounds.page.image = "https://example.test/page.webp?variant=cover&size=large";

  const css = await renderMainCss(config);

  assert.match(css, /background-image: url\((["']?)https:\/\/example\.test\/sidebar\.webp\?variant=glass&size=small\1\);/);
  assert.match(css, /background-image: url\((["']?)https:\/\/example\.test\/page\.webp\?variant=cover&size=large\1\);/);
  assert.doesNotMatch(css, /url\((?:''|"")/);
});

test("Glass 侧栏只保留共享容器玻璃层，不再叠加艺术背景遮罩", async () => {
  const config = yaml.load(read("_config.yml"));
  config.appearance.preset = "glass";
  config.appearance.backgrounds.leftbar.image = null;

  const css = await renderMainCss(config);
  const blurLayerRule = css.match(/\.ui-surface:before,\s*\.ui-surface:after\s*\{[^}]*\}/);

  assert.ok(blurLayerRule, "应由 ui-surface 生成两层共用模糊层");
  assert.match(blurLayerRule[0], /corner-shape:\s*superellipse\(1\.25\);/);
  assert.doesNotMatch(css, /\.site-region--leftbar \.site-region__viewport:after/);
});

test("侧栏艺术渐变按深浅模式输出多层色块", async () => {
  const glassAppearance = read("source/css/_appearances/glass.styl");
  const config = yaml.load(read("_config.yml"));
  config.appearance.preset = "glass";
  config.appearance.backgrounds.leftbar.type = "gradient";
  config.appearance.backgrounds.leftbar.image = "https://example.test/sidebar-default.webp";
  config.appearance.backgrounds.leftbar.gradient = {
    light: ["hsl(0 32% 84%)", "hsl(188 44% 84%)", "hsl(12 64% 73%)", "hsl(35 100% 82%)"],
    dark: ["hsl(0 16% 48%)", "hsl(188 18% 50%)", "hsl(12 30% 42%)", "hsl(35 36% 49%)"]
  };

  const css = await renderMainCss(config);

  const lightRule = css.match(/(?:^|\n)\.site-region--leftbar \.site-region__decoration\s*\{[^}]*\}/)?.[0];
  assert.ok(lightRule, "应生成浅色侧栏规则");
  assert.match(lightRule, /--blur-px:\s*100px;/);
  assert.match(lightRule, /--inset:\s*16px;/);
  assert.match(lightRule, /--saturate:\s*350%;/);
  assert.match(lightRule, /--background-opacity:\s*1;/);
  assert.match(lightRule, /background-color:\s*hsl\(0 32% 84%\);/);
  assert.match(lightRule, /radial-gradient\(ellipse at 28% 24%, hsl\(188 44% 84%\) 0%, hsl\(188 44% 84%\) 65%, transparent 100%\)/);
  assert.match(lightRule, /radial-gradient\(ellipse at 60% 50%, hsl\(12 64% 73%\) 0%, hsl\(12 64% 73%\) 60%, transparent 100%\)/);
  assert.match(lightRule, /conic-gradient\(from 210deg at 32% 72%, hsl\(35 100% 82%\) 0deg, hsl\(35 100% 82%\) 110deg, transparent 190deg, hsl\(188 44% 84%\) 270deg, transparent 360deg\)/);
  assert.doesNotMatch(lightRule, /saturate\(/);
  assert.match(css, /background-position:\s*left top, right 42%, left bottom;/);
  assert.match(css, /background-size:\s*56% 34%, 52% 30%, 60% 38%;/);
  const darkRule = css.match(/:root\[data-theme=["']dark["']\] \.site-region--leftbar \.site-region__decoration\s*\{[^}]*\}/)?.[0];
  assert.ok(darkRule, "应生成显式暗色侧栏规则");
  assert.match(darkRule, /--background-opacity:\s*1;/);
  assert.match(darkRule, /background-color:\s*hsl\(0 16% 48%\);/);
  assert.match(darkRule, /hsl\(188 18% 50%\)/);
  assert.match(darkRule, /hsl\(12 30% 42%\)/);
  assert.match(darkRule, /hsl\(35 36% 49%\)/);
  assert.doesNotMatch(darkRule, /saturate\(/);
  assert.doesNotMatch(darkRule, /--inset:/);
  assert.doesNotMatch(css, /sidebar-default\.webp/);
  assert.match(css, /background:\s*var\(--bg-a50\);/);
  assert.doesNotMatch(glassAppearance, /\$appearance-leftbar-decorative-effects/);
  assert.doesNotMatch(read("source/css/_components/sidebar/sidebar.styl"), /\$appearance-leftbar-decorative-effects/);
  assert.match(css, /\.site-region--leftbar \.site-region__decoration\s*\{[^}]*display:\s*block/);
  assert.doesNotMatch(glassAppearance, /@media screen and \(max-width: \$device-tablet\)[\s\S]*\.site-region--leftbar \.site-region__decoration/);
  assert.doesNotMatch(css, /\.site-region--leftbar \.site-region__viewport:after/);

  for (const preset of APPEARANCE_PRESETS.filter(preset => preset !== "glass")) {
    const presetConfig = structuredClone(config);
    presetConfig.appearance.preset = preset;
    const presetCss = await renderMainCss(presetConfig);
    assert.doesNotMatch(presetCss, /background-color:\s*hsl\(0 32% 84%\);/);
    assert.doesNotMatch(presetCss, /conic-gradient\(from 210deg at 32% 72%/);
    assert.doesNotMatch(presetCss, /sidebar-default\.webp/);
  }
});

test("Glass 折叠 Rail 仅收紧基础光场的几何参数", async () => {
  const glassAppearance = read("source/css/_appearances/glass.styl");
  const config = yaml.load(read("_config.yml"));
  config.appearance.preset = "glass";
  config.appearance.backgrounds.leftbar.type = "gradient";
  config.appearance.backgrounds.leftbar.backdrop.radius = "72px";
  const css = await renderMainCss(config);
  const baseRule = css.match(/(?:^|\n)\.site-region--leftbar \.site-region__decoration\s*\{[^}]*\}/)?.[0];
  const railRule = css.match(/html\[data-leftbar-state=["']collapsed["']\] \.site-shell:not\(\[data-drawer=["']leftbar["']\]\) \.site-region--leftbar \.site-region__decoration\s*\{[^}]*\}/)?.[0];

  assert.match(glassAppearance, /@media screen and \(min-width: \(\$device-tablet \+ 1px\)\)/);
  assert.ok(baseRule, "应生成展开态基础光场");
  assert.match(baseRule, /--inset:\s*16px;/);
  assert.match(baseRule, /--blur-px:\s*72px;/);
  assert.ok(railRule, "应生成桌面折叠 Rail 几何覆盖");
  assert.match(railRule, /--inset:\s*0px;/);
  assert.match(railRule, /--blur-px:\s*36px;/);
  assert.doesNotMatch(railRule, /background|filter|opacity|saturate/);
  assert.doesNotMatch(glassAppearance, /leftbar-rail-decoration|background-size:\s*\d+px/);

  for (const preset of APPEARANCE_PRESETS.filter(preset => preset !== "glass")) {
    const presetConfig = structuredClone(config);
    presetConfig.appearance.preset = preset;
    const presetCss = await renderMainCss(presetConfig);
    assert.doesNotMatch(presetCss, /html\[data-leftbar-state=["']collapsed["']\][^{]*\.site-region__decoration/);
  }
});

test("Glass 侧栏选择图片，无效类型或空图片回退默认渐变", async () => {
  const imageConfig = yaml.load(read("_config.yml"));
  imageConfig.appearance.preset = "glass";
  imageConfig.appearance.backgrounds.leftbar.type = "image";
  imageConfig.appearance.backgrounds.leftbar.image = "https://example.test/sidebar-fallback.webp";
  const imageCss = await renderMainCss(imageConfig);
  assert.match(imageCss, /background-image:\s*url\((['"]?)https:\/\/example\.test\/sidebar-fallback\.webp\1\);/);
  const imageLightRule = imageCss.match(/(?:^|\n)\.site-region--leftbar \.site-region__decoration\s*\{[^}]*\}/)?.[0];
  const imageDarkRule = imageCss.match(/:root\[data-theme=["']dark["']\] \.site-region--leftbar \.site-region__decoration\s*\{[^}]*\}/)?.[0];
  const imageRailRule = imageCss.match(/html\[data-leftbar-state=["']collapsed["']\] \.site-shell:not\(\[data-drawer=["']leftbar["']\]\) \.site-region--leftbar \.site-region__decoration\s*\{[^}]*\}/)?.[0];
  assert.match(imageLightRule, /--blur-px:\s*100px;/);
  assert.match(imageLightRule, /--inset:\s*16px;/);
  assert.match(imageLightRule, /--saturate:\s*350%;/);
  assert.match(imageLightRule, /--background-opacity:\s*1;/);
  assert.match(imageLightRule, /filter:\s*saturate\(var\(--saturate\)\) blur\(var\(--blur-px\)\) opacity\(var\(--background-opacity\)\);/);
  assert.match(imageDarkRule, /--background-opacity:\s*0\.75;/);
  assert.match(imageRailRule, /--inset:\s*0px;/);
  assert.match(imageRailRule, /--blur-px:\s*50px;/);
  assert.doesNotMatch(imageRailRule, /background|filter|opacity|saturate/);
  assert.match(imageCss, /background:\s*var\(--bg-a50\);/);
  assert.doesNotMatch(imageCss, /radial-gradient\(ellipse at 28% 24%|conic-gradient\(from 210deg at 32% 72%/);

  for (const fallbackConfig of [
    { type: "auto", image: "https://example.test/unused.webp" },
    { type: "image", image: null }
  ]) {
    const config = yaml.load(read("_config.yml"));
    config.appearance.preset = "glass";
    config.appearance.backgrounds.leftbar.type = fallbackConfig.type;
    config.appearance.backgrounds.leftbar.image = fallbackConfig.image;
    const css = await renderMainCss(config);
    assert.match(css, /background-color:\s*hsl\(210 32% 84%\);/);
    assert.match(css, /conic-gradient\(from 210deg at 32% 72%/);
    assert.doesNotMatch(css, /unused\.webp/);
  }
});

test("Glass 侧栏可关闭额外背景并仅保留共享 ui-surface 材质", async () => {
  const config = yaml.load(read("_config.yml"));
  config.appearance.preset = "glass";
  config.appearance.backgrounds.leftbar.type = "none";
  config.appearance.backgrounds.leftbar.image = "https://example.test/unused-leftbar.webp";
  const css = await renderMainCss(config);

  assert.match(css, /\.ui-surface\s*\{[^}]*box-shadow:\s*0 0 2px rgba\(0,0,0,0\.04\), 0 2px 8px rgba\(0,0,0,0\.04\), 0 4px 16px rgba\(0,0,0,0\.04\);/);
  assert.match(css, /\.site-region--leftbar \.site-region__decoration\s*\{[^}]*display:\s*none;/);
  assert.doesNotMatch(css, /unused-leftbar\.webp|conic-gradient\(from 210deg at 32% 72%/);
  assert.doesNotMatch(css, /html\[data-leftbar-state=["']collapsed["']\][^{]*\.site-region__decoration/);
  assert.doesNotMatch(css, /\.site-region--leftbar \.site-region__viewport:after/);
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
    "    leftbar:",
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
  assert.equal(issue("appearance.backgrounds.leftbar.blur").expected, "appearance.backgrounds.leftbar.backdrop");
  assert.match(issue("resources.fallbacks.project_icon").expected, /remove field/);
  assert.equal(issue("resources.fallbacks.error_page").expected, "resources.error_page.image");
  assert.equal(issue("inject.head").expected, "inject.head_end");
  assert.equal(issue("inject.script").expected, "inject.body_end");
});
