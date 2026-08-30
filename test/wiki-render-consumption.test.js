"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseStellarConfig: parseRawStellarConfig } = require("../scripts/lib/config-schema");
const { flattenThemeFixture } = require("./support/theme-config");
const parseStellarConfig = input => parseRawStellarConfig({ ...input, themeConfig: flattenThemeFixture(input.themeConfig) });

const ROOT = path.resolve(__dirname, "..");

function source(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

let generator;
global.hexo = {
  extend: {
    generator: {
      register(name, callback) {
        assert.equal(name, "wiki");
        generator = callback;
      }
    }
  }
};
require("../scripts/generators/wiki");

test("Wiki 生成器只向索引模板提供显式 listing 与标签导航", () => {
  const items = [{
    id: "stellar",
    href: "wiki/stellar",
    name: "Stellar",
    headline: "Stellar",
    caption: "Theme",
    description: "Theme Wiki",
    tags: ["博客主题"],
    audience: "博主",
    icon: "/stellar.svg",
    cover: "/cover.webp",
    repository: "xaoxuu/hexo-theme-stellar",
    repositoryApi: "https://api.github.com/repos/xaoxuu/hexo-theme-stellar",
    priority: 1,
    sort: 0,
    listed: true
  }, {
    id: "git",
    href: "wiki/git",
    name: "Git",
    headline: "Git",
    caption: "Git Wiki",
    description: "Git Wiki",
    tags: ["知识库"],
    audience: "开发者",
    icon: "",
    cover: "",
    repository: "",
    repositoryApi: "",
    priority: 0,
    sort: 0,
    listed: true
  }];
  const context = Object.assign(global.hexo, {
    stellar: {
      config: parseStellarConfig({ themeConfig: {} }),
      data: {
        wiki: {
          tree: { stellar: {}, git: {} },
          index: {
            items,
            tags: [
              { name: "博客主题", path: "wiki/tags/博客主题/index.html", itemIds: ["stellar"] },
              { name: "知识库", path: "wiki/tags/知识库/index.html", itemIds: ["git"] }
            ]
          },
          all_tags: {
            "博客主题": { name: "博客主题", path: "wiki/tags/博客主题/index.html" },
            "知识库": { name: "知识库", path: "wiki/tags/知识库/index.html" }
          }
        }
      }
    }
  });

  const routes = generator.call(context);
  const home = routes.find(route => route.data.wikiIndex.filter === false);
  const filtered = routes.find(route => route.data.wikiIndex.tagName === "博客主题");
  assert.deepEqual(home.data.wikiIndex.items.map(item => item.id), ["stellar", "git"]);
  assert.deepEqual(filtered.data.wikiIndex.items.map(item => item.id), ["stellar"]);
  assert.deepEqual(filtered.data.wikiIndex.allItems.map(item => item.id), ["stellar", "git"]);
  assert.equal(filtered.data.filter, undefined);
  assert.equal(filtered.data.tagName, undefined);
});

test("Wiki 索引、卡片和 Listing Nav 不再读取原始 Wiki tree", () => {
  for (const relative of [
    "layout/index_wiki.ejs",
    "layout/_partial/main/post_list/wiki_card.ejs",
    "layout/_partial/main/listing_nav/wiki.ejs"
  ]) {
    assert.doesNotMatch(source(relative), /stellar_data\(['\"]wiki['\"]\)/, relative);
  }
  assert.match(source("layout/index_wiki.ejs"), /page\.wikiIndex/);
  assert.match(source("layout/_partial/main/post_list/wiki_card.ejs"), /render\.listing/);
  assert.match(source("layout/_partial/main/pin_slider.ejs"), /Wiki 置顶列表缺少显式 render\.listing/);
});

test("Wiki 详情页要求合法 render，并与 Topic、Notebook 新链隔离", () => {
  const root = source("layout/layout.ejs");
  const page = source("layout/page.ejs");
  assert.match(root, /Wiki 页面 .*缺少合法 PageViewModel\.render/);
  assert.match(root, /renderViewModel = \['post', 'wiki', 'topic', 'notebook'\]\.includes\(activeProfile\) \? activeViewModel : null/);
  assert.match(root, /coverSlot\(renderViewModel, renderedRegions\)/);
  assert.match(root, /partial\('_partial\/primitives\/shell'/);
  assert.match(page, /wikiViewModel\.render\.article/);
  assert.doesNotMatch(source("layout/_partial/main/navbar/article_banner.ejs"), /page\.viewModel/);
  assert.match(page, /post_footer'.*footer: article\.footer/);
  assert.match(page, /comments\/layout'.*comments: article\.comments/);
  assert.match(root, /else \{/);
  assert.match(page, /registeredProfile === 'topic'/);
  assert.match(page, /notebookViewModel = page\.viewModel\?\.collection\?\.profile === 'notebook'/);
});

test("Wiki Hero 与详情辅助 partial 优先消费显式 Wiki ViewModel", () => {
  assert.doesNotMatch(source("layout/_partial/cover/wiki_cover.ejs"), /stellar_data\(['\"]wiki['\"]\)/);
  assert.match(source("layout/_partial/cover/wiki_cover.ejs"), /wikiViewModel\.render\.cover/);
  assert.match(source("layout/_partial/widgets/tree.ejs"), /wikiViewModel\.collection\.navigation\.tree/);
  assert.match(source("layout/_partial/widgets/related.ejs"), /wikiViewModel\.render\.article\.related/);
  assert.match(source("layout/_partial/widgets/ghrepo.ejs"), /wikiViewModel\.render\.listing\.repositoryApi/);
  assert.match(source("layout/_partial/widgets/ghrepo.ejs"), /tagsApi = repoApi \? repoApi \+ '\/tags'/);
  assert.match(source("layout/_partial/sidebar/search.ejs"), /wikiViewModel\.render\.layout\.algoliaFilterPath/);
  assert.match(source("layout/_partial/widgets/toc.ejs"), /wikiViewModel\.render\.article\.readmeHtml/);
  assert.match(source("layout/_partial/head.ejs"), /\['post', 'wiki', 'topic', 'notebook'\]/);
});
