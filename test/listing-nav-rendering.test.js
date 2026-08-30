"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

let renderer;
global.hexo = {
  extend: { renderer: { register(_extension, _output, registered) { renderer = registered; } } }
};
require("hexo-renderer-ejs");
delete global.hexo;

const BLOG_PATH = path.resolve(__dirname, "../layout/_partial/main/listing_nav/blog.ejs");
const WIKI_PATH = path.resolve(__dirname, "../layout/_partial/main/listing_nav/wiki.ejs");

function render(templatePath, locals) {
  return renderer({ path: templatePath, text: fs.readFileSync(templatePath, "utf8") }, locals);
}

function sharedLocals(profile, listingNav) {
  return {
    page: { path: "", layout: "index" },
    pretty_url: value => value,
    url_for: value => value,
    full_url_for: value => `https://example.test/${String(value).replace(/^\/+/, "")}`,
    escape_html: value => String(value),
    __: key => key,
    stellar_config(key) {
      if (key === `profiles.${profile}.listingNav`) return listingNav;
      if (key === "article.listing.pinnedLayout") return "carousel";
      if (key === "profiles.topicIndex.path") return "/topic/";
      throw new Error(`unexpected config: ${key}`);
    },
    partial(name) {
      assert.equal(name, "_partial/main/pin_slider");
      return '<div class="pin-slider"></div>';
    }
  };
}

function renderBlog(listingNav) {
  return render(BLOG_PATH, {
    ...sharedLocals("blogIndex", listingNav),
    site: { categories: [], tags: [], posts: [] },
    config: { index_generator: { path: "/" }, category_dir: "/categories/", tag_dir: "/tags/", archive_dir: "/archives/" },
    stellar_data: () => ({ publish_list: [] }),
    is_home: () => true,
    is_archive: () => false
  });
}

function renderWiki(listingNav) {
  return render(WIKI_PATH, {
    ...sharedLocals("wikiIndex", listingNav),
    page: { path: "wiki/" },
    wikiIndex: {
      filter: false,
      path: "/wiki/",
      items: [],
      allItems: [],
      tags: []
    }
  });
}

test("Listing Nav 默认结构使用独立组件命名并渲染 Profile Tabs", () => {
  const blog = renderBlog({ enabled: true, tabs: [{ title: "朋友文章", url: "/friends/rss/" }] });
  const wiki = renderWiki({ enabled: true, tabs: [] });

  for (const html of [blog, wiki]) {
    assert.match(html, /class="pin-slider"/);
    assert.match(html, /class="listing-nav"/);
    assert.match(html, /class="listing-nav__surface"/);
    assert.match(html, /class="listing-nav__viewport"/);
    assert.doesNotMatch(html, /navbar top|navbar-blur|navbar-container/);
  }
  assert.match(blog, />朋友文章<\/a>/);
});

test("关闭 Listing Nav 时保留 Pin Slider 并忽略已配置 Tabs", () => {
  const tabs = [{ title: "不应出现", url: "/hidden/" }];
  for (const html of [renderBlog({ enabled: false, tabs }), renderWiki({ enabled: false, tabs })]) {
    assert.match(html, /class="pin-slider"/);
    assert.doesNotMatch(html, /class="listing-nav"/);
    assert.doesNotMatch(html, /不应出现/);
  }
});

test("Listing Nav 运行源码只消费新选择器与初始化入口", () => {
  const runtime = fs.readFileSync(path.resolve(__dirname, "../source/js/main.js"), "utf8");
  const styles = fs.readFileSync(path.resolve(__dirname, "../source/css/_components/partial/listing-nav.styl"), "utf8");

  assert.match(runtime, /listingNavPin: \(\) =>/);
  assert.match(runtime, /querySelectorAll\('\.listing-nav'\)/);
  assert.match(runtime, /classList\.toggle\('is-pinned'/);
  assert.match(styles, /\.site-shell\[data-regions~='topbar'\] \.listing-nav\s*[\s\S]*top: calc\(var\(--shell-topbar-top\) \+ var\(--shell-topbar-content-inset\)\)/);
  assert.match(styles, /\.listing-nav \.listing-nav__surface\.is-pinned[\s\S]*background: transparent[\s\S]*box-shadow: none/);
  assert.match(styles, /@media screen and \(max-width: \$device-mobile-max\)[\s\S]*\.listing-nav\s*\n\s+top: 8pt/);
  assert.doesNotMatch(runtime, /navbarPin|\.navbar\.top|\.navbar-blur|\.navbar-container/);
  assert.doesNotMatch(styles, /\.navbar(?:\.|\s)|navbar-blur|navbar-container/);
});
