"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  ContentConfigError,
  getCollectionId,
  isListed,
  isSearchable,
  parseCollectionConfig,
  parsePageConfig
} = require("../scripts/lib/content-config");

test("Collection Schema 解析最终路径、第三方参数和 camelCase 运行时", () => {
  const parsed = parseCollectionConfig({
    name: "Stellar",
    route: { path: "/wiki/stellar/" },
    sidebar: { left: { wiki_home: true } },
    article: { ai_label: "generated" },
    comments: {
      provider: "giscus",
      options: { "data-repo": "xaoxuu/hexo-theme-stellar" }
    },
    navigation: { tree: { 快速开始: ["index"] } }
  }, "source/_data/wiki/hexo-stellar.yml");

  assert.equal(parsed.route.path, "wiki/stellar/");
  assert.equal(parsed.sidebar.left.wikiHome, true);
  assert.equal(parsed.article.aiLabel, "generated");
  assert.equal(parsed.comments.provider, "giscus");
  assert.equal(parsed.comments.options["data-repo"], "xaoxuu/hexo-theme-stellar");
  assert.ok(Object.isFrozen(parsed));
  assert.ok(Object.isFrozen(parsed.comments.options));
});

test("Collection 侧栏 widget 项允许字符串 ID 和受约束的内联参数袋", () => {
  const parsed = parseCollectionConfig({
    name: "Resume",
    route: { path: "/resume/" },
    sidebar: {
      left: {
        widgets: ["toc", { layout: "ghuser", username: "xaoxuu", header: true }]
      }
    }
  }, "source/_data/wiki/resume.yml");

  assert.deepEqual(parsed.sidebar.left.widgets, [
    "toc",
    { layout: "ghuser", username: "xaoxuu", header: true }
  ]);
  assert.equal(Object.isFrozen(parsed.sidebar.left.widgets[1]), true);
});

test("Front Matter Schema 保留 Hexo 字段并解析最终 Stellar 字段", () => {
  const parsed = parsePageConfig({
    title: "页面",
    date: "2026-08-23 00:00",
    collection: { profile: "wiki", id: "stellar" },
    render: { math: "katex", diagrams: { theme: "dark" } },
    seo: { open_graph: { image: "/cover.webp" } },
    inject: { head_end: "<meta name=\"example\">", body_end: "<script>example()</script>" }
  }, "source/wiki/stellar/index.md");

  assert.equal(parsed.title, "页面");
  assert.equal(parsed.collection.profile, "wiki");
  assert.equal(parsed.render.math, "katex");
  assert.equal(parsed.render.diagrams.theme, "dark");
  assert.equal(parsed.seo.openGraph.image, "/cover.webp");
  assert.equal(parsed.inject.headEnd, "<meta name=\"example\">");
  assert.equal(parsed.inject.bodyEnd, "<script>example()</script>");
  assert.ok(Object.isFrozen(parsed.seo.openGraph));
});

test("render.diagrams 接受最终 provider/参数对象并拒绝 true", () => {
  assert.equal(parsePageConfig({ render: { diagrams: "mermaid" } }).render.diagrams, "mermaid");
  assert.throws(
    () => parsePageConfig({ render: { diagrams: true } }, "source/wiki/graph.md"),
    /false, mermaid, or Mermaid options object/
  );
});

test("Galaxy 注册 Schema 保持 React Bits camelCase，自有运行时键投影为 camelCase", () => {
  const parsed = parseCollectionConfig({
    name: "Stellar",
    hero: {
      background: {
        effect: {
          type: "galaxy",
          options: { starSpeed: 0.5, mouseInteraction: true },
          runtime: { pause_when_hidden: true, respect_reduced_motion: false }
        }
      }
    }
  }, "source/_data/wiki/stellar.yml");

  assert.deepEqual(parsed.hero.background.effect.runtime, {
    pauseWhenHidden: true,
    respectReducedMotion: false
  });
  assert.deepEqual(parsed.hero.background.effect.options, {
    starSpeed: 0.5,
    mouseInteraction: true
  });
  assert.equal(parseCollectionConfig({ name: "Plain", hero: { background: { effect: null } } }).hero.background.effect, null);

  assert.throws(() => parseCollectionConfig({
    name: "Stellar",
    hero: {
      background: {
        effect: {
          type: "galaxy",
          options: { star_speed: 0.5, mouseInteraction: "yes" }
        }
      }
    }
  }, "source/_data/wiki/stellar.yml"), error => {
    assert.match(error.message, /star_speed/);
    assert.match(error.message, /mouseInteraction 应为 boolean/);
    return true;
  });
});

test("Collection 与 Front Matter 拒绝旧字段并包含来源和迁移目标", () => {
  assert.throws(() => parseCollectionConfig({
    name: "Stellar",
    routing: { base_dir: "/wiki/stellar/" },
    tree: ["index"]
  }, "source/_data/wiki/hexo-stellar.yml"), error => {
    assert.ok(error instanceof ContentConfigError);
    assert.match(error.message, /source\/_data\/wiki\/hexo-stellar\.yml: routing 已移除，期望 route/);
    assert.match(error.message, /tree 已移除，期望 navigation\.tree/);
    return true;
  });

  assert.throws(() => parsePageConfig({
    collection: { type: "wiki", id: "stellar" },
    katex: true,
    open_graph: { image: "/cover.webp" }
  }, "source/wiki/stellar/index.md"), error => {
    assert.match(error.message, /collection\.type 已移除，期望 collection\.profile/);
    assert.match(error.message, /katex 已移除，期望 render\.math/);
    assert.match(error.message, /open_graph 已移除，期望 seo\.open_graph/);
    return true;
  });
});

test("封闭对象、类型、枚举、数值和必填字段提供聚合诊断", () => {
  assert.throws(() => parseCollectionConfig({
    name: "Stellar",
    mystery: true,
    sidebar: { left: { widgets: "tree, toc" } },
    listing: { priority: -1 }
  }), error => {
    assert.match(error.message, /未知字段 mystery/);
    assert.match(error.message, /sidebar\.left\.widgets 应为 array/);
    assert.match(error.message, /number >= 0/);
    return true;
  });

  assert.throws(() => parsePageConfig({
    collection: { profile: "book", id: "" },
    render: { math: "latex" }
  }), error => {
    assert.match(error.message, /collection\.profile 的值不在 wiki \| topic \| notebook/);
    assert.match(error.message, /collection\.id 的值不在 non-empty string/);
    assert.match(error.message, /render\.math 的值不在 false \| katex \| mathjax/);
    return true;
  });

  assert.throws(() => parsePageConfig({ render: { math: true } }), /false \| katex \| mathjax/);
});

test("route.start 只允许 Topic Collection", () => {
  assert.equal(parseCollectionConfig({
    name: "Topic",
    route: { start: "intro" }
  }, "source/_data/topic/topic.yml").route.start, "intro");

  for (const source of [
    "source/_data/wiki/wiki.yml",
    "source/_data/notebooks/notes.yml"
  ]) {
    assert.throws(() => parseCollectionConfig({
      name: "Wrong scope",
      route: { start: "intro" }
    }, source), error => {
      assert.match(error.message, /route\.start/);
      assert.match(error.message, /Topic Collection only/);
      return true;
    });
  }
});

test("Brand 注册 Schema 使用 variant 并保持跨字段约束", () => {
  assert.doesNotThrow(() => parsePageConfig({
    sidebar: { left: { brand: { image: { src: "/brand.svg", variant: "icon" } } } }
  }));
  assert.throws(() => parsePageConfig({
    sidebar: { left: { brand: { image: { src: "/brand.svg", style: "icon" } } } }
  }), /image\.style 已移除，期望 .*variant/);
  assert.throws(() => parsePageConfig({
    sidebar: { left: { brand: { image: { src: "/brand.svg", variant: "plain", background: "#fff" } } } }
  }), /image\.background 已移除/);
});

test("getCollectionId 使用 profile，visibility 两个维度彼此独立", () => {
  const page = { collection: { profile: "wiki", id: "stellar" } };
  assert.equal(getCollectionId(page, "wiki"), "stellar");
  assert.equal(getCollectionId(page, "topic"), null);
  assert.equal(getCollectionId({}, "wiki"), null);
  assert.equal(isListed({ visibility: { listed: false, searchable: true } }), false);
  assert.equal(isSearchable({ visibility: { listed: false, searchable: true } }), true);
  assert.equal(isListed({}), true);
  assert.equal(isSearchable({}), true);
});
