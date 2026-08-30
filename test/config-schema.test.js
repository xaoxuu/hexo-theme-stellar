"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const attachConfig = require("../scripts/events/lib/config-schema");
const {
  ConfigSchemaError,
  parseStellarConfig
} = require("../scripts/lib/config-schema");

function assertDeepFrozen(value) {
  if (value == null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  Object.values(value).forEach(assertDeepFrozen);
}

function withoutLayoutAndContent(config) {
  const { layout, content, appearance, extensions, ...rest } = config;
  return { ...rest, resources: { preconnect: rest.resources.preconnect } };
}

test("site/layout/content/appearance/resources/head Schema 提供默认值并拒绝已迁移旧根域", () => {
  const config = parseStellarConfig({
    source: "themes/stellar/_config.yml",
    themeConfig: {},
    // Hexo 站点配置不再参与 Theme 默认值解析。
    siteConfig: { avatar: "/avatar.webp", title: "Stellar", subtitle: "每个人的独立博客" }
  });

  assert.deepEqual(withoutLayoutAndContent(config), {
    site: {
      brand: {
        image: { src: null, variant: "avatar" },
        name: null,
        tagline: null
      },
      menu: { items: [{ type: "search" }] },
      settings: { about: { items: [
        { key: "博客框架", value: "Hexo {hexo.version}", url: "https://hexo.io/" },
        { key: "主题版本", value: "Stellar {theme.version}", url: "{theme.tree}" }
      ] } },
      footer: {
        actions: [],
        sections: [],
        content: "本站由 [{author.name}](/) 使用 [{theme.name} {theme.version}]({theme.tree}) 主题创建。"
      }
    },
    seo: {
      canonical: { host: "", allowedHosts: ["localhost"] },
      openGraph: { enabled: true, twitterId: null },
      structuredData: { sameAs: [] }
    },
    resources: { preconnect: [] },
    inject: { headEnd: "", bodyEnd: "" }
  });
  assert.deepEqual(Object.keys(config.layout.profiles), [
    "home", "blogIndex", "topicIndex", "wikiIndex", "post", "topic", "wiki",
    "notebookIndex", "noteIndex", "note", "author", "error", "page", "settings"
  ]);
  assert.deepEqual(config.layout.profiles.blogIndex, {
    path: "/blog/",
    navigation: { activeMenu: "post" },
    listingNav: { enabled: true, tabs: [] },
    regions: {
      topbar: { widgets: null },
      leftbar: { enabled: null, brand: null, menu: null, footer: { actions: null }, widgets: ["recent"] },
      rightbar: { widgets: [] }
    }
  });
  assert.deepEqual(config.layout.profiles.wiki.regions, {
    topbar: { widgets: [] },
    leftbar: { enabled: null, brand: "collection_brand", menu: false, footer: { actions: false }, widgets: ["tree"] },
    rightbar: { widgets: ["ghrepo", "toc"] }
  });
  assert.equal(config.layout.profiles.home.navigation.activeMenu, "post");
  assert.equal(config.layout.profiles.page.navigation.activeMenu, "post");
  assert.deepEqual(config.layout.profiles.error, {
    path: "/404.html",
    navigation: { activeMenu: "post" },
    regions: {
      topbar: { widgets: null },
      leftbar: { enabled: null, brand: null, menu: null, footer: { actions: null }, widgets: ["recent"] },
      rightbar: { widgets: [] }
    }
  });
  assert.deepEqual(config.content.article.listing, {
    pinnedLayout: "carousel",
    cardLayout: "hero",
    coverRatio: 2,
    excerptLength: 128,
    showTags: false
  });
  assert.equal(config.content.article.style, "tech");
  assert.equal(config.content.article.paragraphIndent, "auto");
  assert.deepEqual(config.content.article.footer.share, []);
  assert.equal(config.content.article.relatedPostsLimit, 0);
  assert.deepEqual(config.content.notebook.tagIcons, {});
  assert.equal(config.appearance.colorScheme, "auto");
  assert.equal(config.appearance.preset, "card");
  assert.equal(config.appearance.shape.radius.cardLarge, "24px");
  assert.equal("surface" in config.appearance.backgrounds.leftbar, false);
  assert.equal(config.appearance.backgrounds.leftbar.type, "gradient");
  assert.equal(config.appearance.backgrounds.leftbar.image, null);
  assert.deepEqual(config.appearance.backgrounds.leftbar.gradient, {
    light: ["hsl(210 32% 84%)", "hsl(188 44% 84%)", "hsl(12 64% 73%)", "hsl(35 100% 82%)"],
    dark: ["hsl(210 16% 48%)", "hsl(188 18% 50%)", "hsl(12 30% 42%)", "hsl(35 36% 49%)"]
  });
  assert.equal(config.appearance.backgrounds.leftbar.opacity, 1);
  assert.equal(config.appearance.backgrounds.leftbar.backdrop.radius, "100px");
  assert.equal("overlay" in config.appearance.backgrounds.leftbar.backdrop, false);
  assert.match(config.resources.fallbacks.cover, /\/cover\/76b86c0226ffd\.svg$/);
  assert.match(config.resources.errorPage.image, /\/404\/1c830bfcd517d\.svg$/);
  assert.equal(config.extensions.search.provider, "local");
  assert.equal(config.extensions.comments.provider, null);
  assert.equal(config.extensions.features.reveal.enabled, true);
  assert.equal(config.extensions.features.colorSchemeSwitch.enabled, false);
  assert.equal(config.extensions.services.github.rawUrl, "https://raw.githubusercontent.com");
  assert.equal("cache" in config.extensions, false);
  assertDeepFrozen(config);
});

test("Leftbar 艺术背景不再接受独立 overlay 遮罩", () => {
  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      appearance: {
        backgrounds: {
          leftbar: { backdrop: { overlay: "rgba(255,255,255,.2)" } }
        }
      }
    }
  }), error => {
    assert.ok(error instanceof ConfigSchemaError);
    assert.equal(error.issues.some(issue => issue.path === "appearance.backgrounds.leftbar.backdrop.overlay" && issue.code === "unknown_field"), true);
    return true;
  });
});

test("YAML 空键在没有 null 业务语义时等同于未配置", () => {
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      site: null,
      layout: {
        regions: {
          topbar: null,
          leftbar: { default_state: null, widgets: null },
          rightbar: null
        },
        profiles: { home: null }
      },
      appearance: { shape: { corner: null } },
      extensions: { search: { provider: null } }
    }
  });

  assert.deepEqual(config.layout.regions.topbar, { widgets: [] });
  assert.deepEqual(config.layout.regions.leftbar, {
    defaultState: "expanded",
    enabled: true,
    brand: "site_brand",
    menu: true,
    footer: { actions: true },
    widgets: []
  });
  assert.deepEqual(config.layout.regions.rightbar, { widgets: [] });
  assert.deepEqual(config.layout.profiles.home.regions.leftbar.widgets, ["recent"]);
  assert.equal(config.appearance.shape.corner, "superellipse(1.25)");
  assert.deepEqual(config.site.menu.items, [{ type: "search" }]);
  assert.equal(config.extensions.search.provider, null);
  assertDeepFrozen(config);
});

test("Region 接受数组简写，并精确拒绝预发布旧名称", () => {
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      layout: {
        regions: {
          topbar: ["site_brand", "menu", "actions"],
          leftbar: [],
          rightbar: { widgets: ["toc"] }
        }
      }
    }
  });
  assert.deepEqual(config.layout.regions.topbar.widgets, ["site_brand", "menu", "actions"]);
  assert.deepEqual(config.layout.regions.leftbar.widgets, []);
  assert.deepEqual(config.layout.regions.rightbar.widgets, ["toc"]);

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { layout: { regions: { leftbar: { inherit: false, widgets: [] } } } }
  }), /layout\.regions\.leftbar\.inherit 已移除/);

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { layout: { regions: { leftbar: { widgets: ["site_brand", "menu", "search", "actions", "settings"] } } } }
  }), /layout\.regions\.leftbar\.widgets\[0\].*Leftbar content widget/);

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { layout: { regions: { topbar: { widgets: ["brand"] } } } }
  }), /layout\.regions\.topbar\.widgets\[0\].*site_brand \| collection_brand/);

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { layout: { regions: { leftbar: { widgets: ["wiki_home"] } } } }
  }), /layout\.regions\.leftbar\.widgets\[0\].*removed wiki_home/);

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { layout: { regions: { leftbar: { brand: true } } } }
  }), /layout\.regions\.leftbar\.brand 的值不在 false \| site_brand \| collection_brand/);

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { layout: { regions: { topbar: { widgets: ["search"] } } } }
  }), /retired search.*site\.menu\.items\[\]\.type=search/);

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      layout: { regions: { sidebar: ["menu"], context: ["toc"] } },
      appearance: { backgrounds: { sidebar: { image: "/legacy.webp" } } }
    }
  }), error => {
    assert.ok(error instanceof ConfigSchemaError);
    assert.deepEqual(error.issues.map(issue => [issue.path, issue.expected]), [
      ["layout.regions.sidebar", "layout.regions.leftbar"],
      ["layout.regions.context", "layout.regions.rightbar"],
      ["appearance.backgrounds.sidebar", "appearance.backgrounds.leftbar"]
    ]);
    return true;
  });
});

test("站点覆盖完成规范化、数组替换、稳定去重并保留注入原文", () => {
  const head = "<meta name=\"first\">\n  <meta name=\"second\">";
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      site: { footer: { content: "" } },
      seo: {
        canonical: {
          host: "  https://xaoxuu.com/  ",
          allowed_hosts: [" mirror.example.com ", "", "localhost", "mirror.example.com"]
        },
        open_graph: { enabled: false, twitter_id: "  xaoxuu  " },
        structured_data: { same_as: [" https://github.com/xaoxuu ", "", "https://github.com/xaoxuu"] }
      },
      resources: {
        preconnect: [" https://cdn.example.com/ ", "", "https://cdn.example.com"]
      },
      inject: { head_end: head, body_end: "<script>window.example = true</script>" }
    }
  });

  assert.deepEqual(withoutLayoutAndContent(config), {
    site: {
      brand: {
        image: { src: null, variant: "avatar" },
        name: null,
        tagline: null
      },
      menu: { items: [{ type: "search" }] },
      settings: { about: { items: [
        { key: "博客框架", value: "Hexo {hexo.version}", url: "https://hexo.io/" },
        { key: "主题版本", value: "Stellar {theme.version}", url: "{theme.tree}" }
      ] } },
      footer: { actions: [], sections: [], content: "" }
    },
    seo: {
      canonical: { host: "xaoxuu.com", allowedHosts: ["mirror.example.com", "localhost"] },
      openGraph: { enabled: false, twitterId: "  xaoxuu  " },
      structuredData: { sameAs: ["https://github.com/xaoxuu"] }
    },
    resources: { preconnect: ["https://cdn.example.com"] },
    inject: { headEnd: head, bodyEnd: "<script>window.example = true</script>" }
  });
});

test("Appearance 与资源兜底解析最终路径并投影 camelCase 运行时", () => {
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      appearance: {
        preset: "glass",
        color_scheme: "dark",
        typography: { font_size: { root: "18px" }, font_family: { code: "Menlo, monospace" }, content_align: "justify" },
        shape: { radius: { card_large: "28px" } },
        colors: { primary: "#123456" },
        code_block: { scrollbar_width: "0px", highlight_stylesheet: null },
        backgrounds: {
          leftbar: {
            type: "image",
            image: "/sidebar.webp",
            gradient: {
              light: ["#ddeeff", "hsl(188 44% 84%)", "rgb(220 160 140)", "gold"],
              dark: ["#223344", "hsl(188 18% 50%)", "rgb(100 70 60)", "darkgoldenrod"]
            },
            opacity: 0,
            backdrop: { radius: "0px" }
          }
        }
      },
      resources: {
        fallbacks: {
          link_card: "/link.svg"
        },
        error_page: { image: null }
      }
    }
  });

  assert.equal(config.appearance.colorScheme, "dark");
  assert.equal(config.appearance.typography.fontSize.root, "18px");
  assert.equal(config.appearance.typography.fontFamily.code, "Menlo, monospace");
  assert.equal(config.appearance.typography.contentAlign, "justify");
  assert.equal(config.appearance.shape.radius.cardLarge, "28px");
  assert.equal(Object.hasOwn(config.appearance, "motion"), false);
  assert.equal(config.appearance.codeBlock.scrollbarWidth, "0px");
  assert.equal(config.appearance.codeBlock.highlightStylesheet, null);
  assert.equal(config.appearance.preset, "glass");
  assert.equal(config.appearance.backgrounds.leftbar.type, "image");
  assert.equal(config.appearance.backgrounds.leftbar.opacity, 0);
  assert.deepEqual(config.appearance.backgrounds.leftbar.gradient, {
    light: ["#ddeeff", "hsl(188 44% 84%)", "rgb(220 160 140)", "gold"],
    dark: ["#223344", "hsl(188 18% 50%)", "rgb(100 70 60)", "darkgoldenrod"]
  });
  assert.equal(Object.isFrozen(config.appearance.backgrounds.leftbar.gradient), true);
  assert.equal(Object.isFrozen(config.appearance.backgrounds.leftbar.gradient.light), true);
  assert.equal(Object.isFrozen(config.appearance.backgrounds.leftbar.gradient.dark), true);
  assert.equal(config.resources.fallbacks.linkCard, "/link.svg");
  assert.equal(config.appearance.backgrounds.leftbar.image, "/sidebar.webp");
  assert.equal(config.resources.errorPage.image, null);
});

test("Glass 侧栏背景类型保留 none，对无效字符串回退渐变，并继续拒绝错误类型", () => {
  const noneConfig = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { appearance: { preset: "glass", backgrounds: { leftbar: { type: "none" } } } }
  });
  assert.equal(noneConfig.appearance.backgrounds.leftbar.type, "none");

  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { appearance: { preset: "glass", backgrounds: { leftbar: { type: "auto" } } } }
  });
  assert.equal(config.appearance.backgrounds.leftbar.type, "gradient");

  const emptyTypeConfig = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { appearance: { preset: "glass", backgrounds: { leftbar: { type: null } } } }
  });
  assert.equal(emptyTypeConfig.appearance.backgrounds.leftbar.type, "gradient");

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { appearance: { preset: "glass", backgrounds: { leftbar: { type: [] } } } }
  }), error => {
    assert.equal(error.issues.some(issue => issue.path === "appearance.backgrounds.leftbar.type" && issue.code === "invalid_type"), true);
    return true;
  });

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { appearance: { preset: "glass", backgrounds: { leftbar: { type: "image", image: "javascript:alert(1)" } } } }
  }), error => {
    assert.equal(error.issues.some(issue => issue.path === "appearance.backgrounds.leftbar.image"), true);
    return true;
  });
});

test("侧栏艺术渐变调色板拒绝错误数量、非法颜色、非法类型和旧数组结构", () => {

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      appearance: {
        backgrounds: {
          leftbar: {
            gradient: { light: ["#def", "cyan", "coral"] }
          }
        }
      }
    }
  }), error => {
    assert.equal(error.issues.some(issue => issue.path === "appearance.backgrounds.leftbar.gradient.light" && issue.expected === "exactly 4 CSS colors"), true);
    return true;
  });

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { appearance: { backgrounds: { leftbar: { gradient: { dark: [] } } } } }
  }), error => {
    assert.equal(error.issues.some(issue => issue.path === "appearance.backgrounds.leftbar.gradient.dark" && issue.expected === "exactly 4 CSS colors"), true);
    return true;
  });

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { appearance: { backgrounds: { leftbar: { gradient: { light: ["#def", "cyan", "url(x)", "gold"] } } } } }
  }), error => {
    assert.equal(error.issues.some(issue => issue.path === "appearance.backgrounds.leftbar.gradient.light[2]" && issue.expected === "valid CSS color"), true);
    return true;
  });

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { appearance: { backgrounds: { leftbar: { gradient: { dark: ["#123", 188, "coral", "gold"] } } } } }
  }), error => {
    assert.equal(error.issues.some(issue => issue.path === "appearance.backgrounds.leftbar.gradient.dark[1]" && issue.code === "invalid_type"), true);
    return true;
  });

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { appearance: { backgrounds: { leftbar: { gradient: [210, 188, 12, 35] } } } }
  }), error => {
    assert.equal(error.issues.some(issue => issue.path === "appearance.backgrounds.leftbar.gradient" && issue.code === "invalid_type"), true);
    return true;
  });

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { appearance: { backgrounds: { leftbar: { gradient: { auto: ["#123", "#234", "#345", "#456"] } } } } }
  }), error => {
    assert.equal(error.issues.some(issue => issue.path === "appearance.backgrounds.leftbar.gradient.auto" && issue.code === "unknown_field"), true);
    return true;
  });

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { appearance: { backgrounds: { leftbar: { color: { light: "#fff", dark: "#000" } } } } }
  }), error => {
    assert.equal(error.issues.some(issue => issue.path === "appearance.backgrounds.leftbar.color" && issue.code === "unknown_field"), true);
    return true;
  });
});

test("Appearance 与资源兜底拒绝旧根、旧字段、未知字段和非法范围", () => {
  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      style: { prefers_theme: "dark" },
      default: { cover: "/cover.svg" },
      appearance: {
        color_scheme: "sepia",
        motion: { avatar: "always" },
        gradients: { avatar_ring: "conic-gradient(red, blue)" },
        backgrounds: { leftbar: { surface: "glass", opacity: 1.2, unknown: true } }
      },
      resources: { fallbacks: { link: "/link.svg", image: { unknown: "/image.svg" } } }
    }
  }), error => {
    assert.match(error.message, /style 已移除，期望 appearance/);
    assert.match(error.message, /default 已移除，期望 resources\.fallbacks/);
    assert.match(error.message, /appearance\.color_scheme 的值不在 auto \| light \| dark/);
    assert.match(error.message, /未知字段 appearance\.motion/);
    assert.match(error.message, /未知字段 appearance\.gradients\.avatar_ring/);
    assert.match(error.message, /appearance\.backgrounds\.leftbar\.surface 已移除，期望 appearance\.preset/);
    assert.match(error.message, /appearance\.backgrounds\.leftbar\.opacity 的值不在 number <= 1/);
    assert.match(error.message, /未知字段 appearance\.backgrounds\.leftbar\.unknown/);
    assert.match(error.message, /resources\.fallbacks\.link 已移除/);
    assert.match(error.message, /resources\.fallbacks\.image 已移除/);
    return true;
  });
});

test("Content Schema 解析最终命名、动态记录、数组替换与 camelCase 运行时", () => {
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      content: {
        article: {
          style: "story",
          paragraph_indent: "never",
          listing: {
            pinned_layout: "flat",
            card_layout: "classic",
            cover_ratio: 1.5,
            excerpt_length: 0,
            show_tags: true
          },
          banner: { ratio: 3 },
          category_colors: { Tech: "#2196f3" },
          footer: { license: false, share: ["link", "link"], show_tags: false },
          related_posts_limit: 0,
          show_reading_time: true
        },
        notebook: {
          listing: { excerpt_length: 0, per_page: 0, sort: { field: "updated", direction: "asc" } },
          tag_icons: { tools: "default:tools" },
          footer: { license: null, share: ["link", "link"] }
        }
      }
    }
  });

  assert.deepEqual(config.content.article, {
    style: "story",
    paragraphIndent: "never",
    listing: { pinnedLayout: "flat", cardLayout: "classic", coverRatio: 1.5, excerptLength: 0, showTags: true },
    banner: { ratio: 3 },
    categoryColors: { "探索号": "#f44336", Tech: "#2196f3" },
    footer: { license: false, share: ["link"], showTags: false },
    relatedPostsLimit: 0,
    showReadingTime: true
  });
  assert.deepEqual(config.content.notebook, {
    listing: { excerptLength: 0, perPage: 0, sort: { field: "updated", direction: "asc" } },
    tagIcons: { tools: "default:tools" },
    footer: { license: null, share: ["link"] }
  });
  assertDeepFrozen(config.content);
});

test("Content Schema 拒绝旧根、旧子字段、未知等级、错误类型和非法数值", () => {
  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      article: { card_style: "hero" },
      notebook: { listing: {} },
      content: { article: {
        card_style: "hero",
        type: "story",
        indent: true,
        listing: { card_style: "hero", cover_ratio: 0, excerpt_length: 1.5 },
        footer: { share: "link" },
        related_posts: { enable: true, limit: -1 },
        related_posts_limit: -1
      } }
    }
  }), error => {
    assert.match(error.message, /article 已移除，期望 content\.article/);
    assert.match(error.message, /notebook 已移除，期望 content\.notebook/);
    assert.match(error.message, /content\.article\.card_style 已移除/);
    assert.match(error.message, /content\.article\.listing\.card_style 已移除/);
    assert.match(error.message, /content\.article\.listing\.cover_ratio 的值不在 number > 0/);
    assert.match(error.message, /content\.article\.type 已移除/);
    assert.match(error.message, /content\.article\.indent 已移除/);
    assert.match(error.message, /content\.article\.listing\.excerpt_length 的值不在 non-negative integer/);
    assert.match(error.message, /content\.article\.footer\.share 应为 array/);
    assert.match(error.message, /content\.article\.related_posts 已移除/);
    assert.match(error.message, /content\.article\.related_posts_limit 的值不在 number >= 0/);
    return true;
  });
});

test("Layout Profile 解析最终 ID、路径、Listing Nav、Widget 数组和首页评论参数袋", () => {
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      layout: {
        profiles: {
          home: {
            comments: {
              enabled: true,
              title: "留言",
              provider: "giscus",
              options: { "data-repo": "owner/repo", nestedOption: { enabled: true } }
            }
          },
          blog_index: {
            path: " custom/blog ",
            navigation: { active_menu: "notes" },
            listing_nav: {
              enabled: false,
              tabs: [{ title: "朋友文章", url: "/friends/rss/" }]
            },
            regions: {
              topbar: { widgets: ["collection_brand"] },
              leftbar: { brand: false, widgets: ["recent", { layout: "markdown", content: "hello" }] },
              rightbar: { widgets: ["toc"] }
            }
          },
          error: { path: "errors/404.html" }
        }
      }
    }
  });

  assert.deepEqual(config.layout.profiles.home.comments, {
    enabled: true,
    title: "留言",
    id: null,
    provider: "giscus",
    options: { "data-repo": "owner/repo", nestedOption: { enabled: true } }
  });
  assert.deepEqual(config.layout.profiles.blogIndex, {
    path: "/custom/blog/",
    navigation: { activeMenu: "notes" },
    listingNav: { enabled: false, tabs: [{ title: "朋友文章", url: "/friends/rss/" }] },
    regions: {
      topbar: { widgets: ["collection_brand"] },
      leftbar: { enabled: null, brand: false, menu: null, footer: { actions: null }, widgets: ["recent", { layout: "markdown", content: "hello" }] },
      rightbar: { widgets: ["toc"] }
    }
  });
  assert.deepEqual(config.layout.profiles.wikiIndex.listingNav, { enabled: true, tabs: [] });
  assert.equal(Object.isFrozen(config.layout.profiles.blogIndex.listingNav), true);
  assert.equal(Object.isFrozen(config.layout.profiles.blogIndex.listingNav.tabs), true);
  assert.equal(config.layout.profiles.error.path, "/errors/404.html");
  assertDeepFrozen(config.layout);
});

test("Layout Profile 拒绝旧根、旧 ID、旧子字段、未知字段和错误类型", () => {
  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      site_tree: { home: {} },
      layout: {
        profiles: {
          index_blog: {},
          unknown_profile: {},
          blog_index: {
            view: "feed",
            base_dir: "blog",
            unknown: true,
            path: 42,
            navigation: { menu: "post", tabs: [] },
            listing_nav: { enabled: "true", tabs: {} },
            regions: { leftbar: { widgets: { invalid: true } } }
          },
          error: { "404": "/404.html" },
          home: { view: "feed", hero: { headline: 42 }, comments: "true" }
        }
      }
    }
  }), error => {
    assert.ok(error instanceof ConfigSchemaError);
    assert.match(error.message, /site_tree 已移除，期望 layout\.profiles/);
    assert.match(error.message, /layout\.profiles\.index_blog 已移除，期望 layout\.profiles\.blog_index/);
    assert.match(error.message, /未知字段 layout\.profiles\.unknown_profile/);
    assert.match(error.message, /layout\.profiles\.blog_index\.base_dir 已移除/);
    assert.match(error.message, /未知字段 layout\.profiles\.blog_index\.unknown/);
    assert.match(error.message, /layout\.profiles\.blog_index\.path 应为 string/);
    assert.match(error.message, /layout\.profiles\.blog_index\.navigation\.menu 已移除/);
    assert.match(error.message, /layout\.profiles\.blog_index\.navigation\.tabs 已移除，期望 layout\.profiles\.blog_index\.listing_nav\.tabs/);
    assert.match(error.message, /layout\.profiles\.blog_index\.listing_nav\.enabled 应为 boolean/);
    assert.match(error.message, /layout\.profiles\.blog_index\.listing_nav\.tabs 应为 array/);
    assert.match(error.message, /layout\.profiles\.blog_index\.regions\.leftbar\.widgets 应为 array/);
    assert.match(error.message, /未知字段 layout\.profiles\.blog_index\.view/);
    assert.match(error.message, /layout\.profiles\.error\.404 已移除/);
    assert.match(error.message, /layout\.profiles\.home\.comments 应为 object/);
    assert.match(error.message, /未知字段 layout\.profiles\.home\.view/);
    assert.match(error.message, /未知字段 layout\.profiles\.home\.hero/);
    return true;
  });
});

test("site Shell 解析封闭对象数组、动态 action 记录并完整替换数组", () => {
  const config = parseStellarConfig({
    themeConfig: {
      site: {
        brand: {
          image: { src: "/avatar.webp", variant: "icon" },
          name: "Site",
          tagline: "Subtitle"
        },
        menu: {
          items: [
            { type: "search", title: "Search", icon: "default:search", accent: "#456" },
            { id: "post", title: "Blog", icon: "documents", url: "/", accent: "#abc" },
            { id: "wiki", title: "Wiki", icon: "box", url: "/wiki/", accent: null },
            { id: "notebooks", title: "Notes", icon: "note", url: "/notebooks/", accent: null }
          ]
        },
        footer: {
          actions: [
            {
              type: "dropdown",
              icon: "more",
              title: "More",
              items: [{ type: "link", title: "About", url: "/about/" }]
            },
            { type: "spacer" },
            { type: "link", icon: "home", title: "Home", url: "/" }
          ],
          sections: [{ title: "Links", items: [{ title: "Home", url: "/" }] }],
          content: "Footer"
        }
      }
    }
  });

  assert.deepEqual(config.site, {
    brand: {
      image: { src: "/avatar.webp", variant: "icon" },
      name: "Site",
      tagline: "Subtitle"
    },
    menu: {
      items: [
        { type: "search", title: "Search", icon: "default:search", accent: "#456" },
        { id: "post", title: "Blog", icon: "documents", url: "/", accent: "#abc" },
        { id: "wiki", title: "Wiki", icon: "box", url: "/wiki/", accent: null },
        { id: "notebooks", title: "Notes", icon: "note", url: "/notebooks/", accent: null }
      ]
    },
    settings: { about: { items: [
      { key: "博客框架", value: "Hexo {hexo.version}", url: "https://hexo.io/" },
      { key: "主题版本", value: "Stellar {theme.version}", url: "{theme.tree}" }
    ] } },
    footer: {
      actions: [
        {
          type: "dropdown",
          icon: "more",
          title: "More",
          items: [{ type: "link", icon: null, title: "About", url: "/about/" }]
        },
        { type: "spacer" },
        { type: "link", icon: "home", title: "Home", url: "/" }
      ],
      sections: [{ title: "Links", items: [{ title: "Home", url: "/" }] }],
      content: "Footer"
    }
  });
  assertDeepFrozen(config.site);
});

test("site Shell 拒绝旧子字段、未知字段、错误类型和非法枚举", () => {
  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      site: {
        brand: {
          wordmark: "/wordmark.svg",
          href: "/home/",
          image: { style: "avatar", variant: "round", href: "/about/" },
          tagline: { text: "Subtitle", hover: "example.com" }
        },
        menu: { items: [{ id: "post", theme: "#abc", unknown: true }] },
        footer: {
          social: {},
          actions: { more: { type: "dropdown", unknown: true } },
          sections: [{ title: "Links", items: "[Home](/)" }]
        }
      }
    }
  }), error => {
    assert.ok(error instanceof ConfigSchemaError);
    assert.match(error.message, /未知字段 site\.brand\.wordmark/);
    assert.match(error.message, /未知字段 site\.brand\.href/);
    assert.match(error.message, /site\.brand\.image\.style 已移除/);
    assert.match(error.message, /未知字段 site\.brand\.image\.href/);
    assert.match(error.message, /site\.brand\.image\.variant 的值不在 avatar \| icon \| plain 中/);
    assert.match(error.message, /site\.brand\.tagline 应为 string \| null/);
    assert.match(error.message, /site\.menu\.items\[0\]\.theme 已移除/);
    assert.match(error.message, /未知字段 site\.menu\.items\[0\]\.unknown/);
    assert.match(error.message, /site\.footer\.social 已移除/);
    assert.match(error.message, /site\.footer\.actions 应为 array/);
    assert.match(error.message, /site\.footer\.sections\[0\]\.items 应为 array/);
    return true;
  });
});

test("site Shell 与 Layout 拒绝不安全链接、重复菜单、无效引用和越权 Profile 字段", () => {
  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      site: {
        menu: { items: [
          { id: "bad_id", title: "", icon: null, url: "javascript:alert(1)", accent: "not a color" },
          { id: "bad_id", title: "Duplicate", icon: null, url: "/duplicate/", accent: null }
        ] },
        footer: {
          actions: [
            { type: "spacer", title: "magic spacer" },
            { type: "link", icon: "home", title: "Unsafe", url: "javascript:alert(1)" },
            { type: "dropdown", icon: null, title: "", items: [] }
          ]
        }
      },
      layout: { profiles: {
        home: { comments: { id: "   ", provider: "unknown" } },
        post: { path: "/post/", navigation: { active_menu: "missing", tabs: [] }, listing_nav: { enabled: false } }
      } }
    }
  }), error => {
    assert.ok(error instanceof ConfigSchemaError);
    assert.match(error.message, /site\.menu\.items\[0\]\.id 的值不在 non-empty kebab-case id/);
    assert.match(error.message, /site\.menu\.items\[1\]\.id 的值不在 unique menu id/);
    assert.match(error.message, /site\.menu\.items\[0\] 的值不在 non-empty title or icon/);
    assert.match(error.message, /site\.menu\.items\[0\]\.url 的值不在 safe navigable URL/);
    assert.match(error.message, /site\.menu\.items\[0\]\.accent 的值不在 valid CSS color/);
    assert.match(error.message, /site\.footer\.actions\[0\]\.title/);
    assert.match(error.message, /site\.footer\.actions\[1\]\.url 的值不在 safe navigable URL/);
    assert.match(error.message, /site\.footer\.actions\[2\].*non-empty title or icon/);
    assert.match(error.message, /layout\.profiles\.home\.comments\.id 的值不在 non-empty string/);
    assert.match(error.message, /layout\.profiles\.home\.comments\.provider 的值不在 .*giscus/);
    assert.match(error.message, /layout\.profiles\.post\.path 已移除/);
    assert.match(error.message, /layout\.profiles\.post\.navigation\.tabs 已移除/);
    assert.match(error.message, /未知字段 layout\.profiles\.post\.listing_nav/);
    return true;
  });

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      site: { menu: { items: [
        { id: "post", title: "Post", icon: null, url: "/", accent: null },
        { id: "wiki", title: "Wiki", icon: null, url: "/wiki/", accent: null },
        { id: "notebooks", title: "Notes", icon: null, url: "/notebooks/", accent: null }
      ] } },
      layout: { profiles: { home: { navigation: { active_menu: "missing" } } } }
    }
  }), /layout\.profiles\.home\.navigation\.active_menu.*id present in site\.menu\.items/);

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { site: { menu: { items: [
      { type: "search" },
      { type: "search" }
    ] } } }
  }), /at most one search menu item/);

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { site: { menu: { items: [
      { type: "search", title: "Search", url: "/search/" }
    ] } } }
  }), /site\.menu\.items\[0\]\.url.*no id or url for search item/);
});

test("Footer Actions 严格区分 link、button 与 dropdown 子项", () => {
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      site: { footer: { actions: [
        { type: "button", icon: "default:theme", title: "Theme", onclick: "window.setColorScheme?.('dark')" },
        { type: "dropdown", icon: "default:theme", title: "Scheme", items: [
          { type: "link", title: "Docs", url: "/wiki/" },
          { type: "button", title: "Auto", onclick: "window.setColorScheme?.('auto')" }
        ] }
      ] } },
      extensions: { features: { color_scheme_switch: { enabled: true } } }
    }
  });

  assert.equal(config.extensions.features.colorSchemeSwitch.enabled, true);
  assert.deepEqual(config.site.footer.actions, [
    { type: "button", icon: "default:theme", title: "Theme", onclick: "window.setColorScheme?.('dark')" },
    { type: "dropdown", icon: "default:theme", title: "Scheme", items: [
      { type: "link", icon: null, title: "Docs", url: "/wiki/" },
      { type: "button", icon: null, title: "Auto", onclick: "window.setColorScheme?.('auto')" }
    ] }
  ]);

  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: { site: { footer: { actions: [
      { type: "link", icon: "default:link", title: "Bad", url: "/", onclick: "run()" },
      { type: "button", icon: "default:theme", title: "Bad", onclick: "", url: "/" },
      { type: "dropdown", icon: "default:theme", title: "Bad", items: [{ title: "Missing type", url: "/" }] },
      { type: "unknown" }
    ] } } }
  }), error => {
    assert.ok(error instanceof ConfigSchemaError);
    assert.match(error.message, /actions\[0\]\.onclick/);
    assert.match(error.message, /actions\[1\]\.url/);
    assert.match(error.message, /actions\[1\]\.onclick 的值不在 non-empty string/);
    assert.match(error.message, /actions\[2\]\.items\[0\]\.type/);
    assert.match(error.message, /actions\[3\]\.type/);
    return true;
  });
});

test("canonical null 禁用输出且 Schema 不做类型转换", () => {
  assert.equal(parseStellarConfig({
    themeConfig: { seo: { canonical: { host: null } } }
  }).seo.canonical.host, "");

  assert.throws(
    () => parseStellarConfig({
      source: "_config.stellar.yml",
      themeConfig: {
        seo: { canonical: { host: 42 }, open_graph: { enabled: "true" } },
        inject: { head_end: ["<meta>"] }
      }
    }),
    error => {
      assert.ok(error instanceof ConfigSchemaError);
      assert.deepEqual(error.issues.map(item => [item.path, item.actualType, item.expected]), [
        ["seo.canonical.host", "number", "string | null"],
        ["seo.open_graph.enabled", "string", "boolean"],
        ["inject.head_end", "array", "string"]
      ]);
      return true;
    }
  );
});

test("已迁移旧根、旧子字段和新子树未知字段产生结构化诊断", () => {
  assert.throws(
    () => parseStellarConfig({
      source: "_config.stellar.yml",
      themeConfig: {
        brand: { name: "Legacy" },
        canonical: { original_host: "legacy.example.com" },
        open_graph: { enable: true },
        seo: {
          canonical: { original_host: "legacy.example.com", extra: true },
          open_graph: { enable: true },
          structured_data: { links: [] }
        },
        resources: { unknown: true }
      }
    }),
    error => {
      assert.ok(error instanceof ConfigSchemaError);
      assert.deepEqual(error.issues.map(item => item.code), [
        "removed_field",
        "removed_field",
        "removed_field",
        "removed_field",
        "unknown_field",
        "removed_field",
        "removed_field",
        "unknown_field"
      ]);
      assert.match(error.message, /brand 已移除，期望 site\.brand/);
      assert.match(error.message, /canonical 已移除，期望 seo\.canonical/);
      assert.match(error.message, /seo\.canonical\.original_host 已移除，期望 seo\.canonical\.host/);
      assert.match(error.message, /未知字段 resources\.unknown/);
      return true;
    }
  );
});

test("根级只接受八个公开域并拒绝内部、兼容与非对象输入", () => {
  assert.throws(
    () => parseStellarConfig({
      source: "_config.stellar.yml",
      themeConfig: {
        stellar: { version: "1.0.0" },
        system: { override_pretty_urls: true },
        cache: { enable: true },
        language_switcher: { enable: true },
        unknown_root: true
      }
    }),
    error => {
      assert.ok(error instanceof ConfigSchemaError);
      assert.deepEqual(error.issues.map(issue => issue.path), [
        "stellar", "system", "cache", "language_switcher", "unknown_root"
      ]);
      assert.ok(error.issues.every(issue => ["removed_field", "unknown_field"].includes(issue.code)));
      return true;
    }
  );

  assert.throws(
    () => parseStellarConfig({ source: "_config.stellar.yml", themeConfig: [] }),
    error => {
      assert.ok(error instanceof ConfigSchemaError);
      assert.equal(error.issues[0].path, "root");
      assert.equal(error.issues[0].actualType, "array");
      return true;
    }
  );
});

test("构建事件把最终路径冻结挂载到 hexo.stellar.config", () => {
  const ctx = {
    config: {
      avatar: "/avatar.webp",
      title: "Example",
      subtitle: "Example subtitle",
      theme_config: {
        site: { menu: { items: [
          { id: "post", title: "Blog", icon: "documents", url: "/" },
          { id: "wiki", title: "Wiki", icon: "box", url: "/wiki/" },
          { id: "notebooks", title: "Notes", icon: "note", url: "/notebooks/" }
        ] } },
        seo: {
          canonical: { host: "example.com", allowed_hosts: ["mirror.example.com"] },
          structured_data: { same_as: ["https://github.com/example"] }
        },
        inject: { head_end: "<meta name=\"site\">" }
      }
    }
  };

  attachConfig(ctx);

  assert.equal(ctx.stellar.config.seo.canonical.host, "example.com");
  assert.equal(ctx.stellar.config.site.brand.image.src, null);
  assert.equal(ctx.stellar.config.site.brand.name, null);
  assert.equal(ctx.stellar.config.site.brand.tagline, null);
  assert.equal(ctx.stellar.config.site.menu.items[0].id, "post");
  assert.deepEqual(ctx.stellar.config.seo.canonical.allowedHosts, ["mirror.example.com"]);
  assert.deepEqual(ctx.stellar.config.seo.structuredData.sameAs, ["https://github.com/example"]);
  assert.equal(ctx.stellar.config.inject.headEnd, "<meta name=\"site\">");
  assertDeepFrozen(ctx.stellar.config);
});
