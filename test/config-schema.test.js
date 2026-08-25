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
        image: { src: null, variant: "avatar", href: null },
        name: null,
        wordmark: null,
        tagline: { text: null, hover: null },
        href: "/"
      },
      menu: { items: [] },
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
    "notebookIndex", "noteIndex", "note", "author", "error", "page"
  ]);
  assert.deepEqual(config.layout.profiles.blogIndex, {
    path: "/blog/",
    navigation: { activeMenu: "post", tabs: [] },
    sidebar: { left: ["welcome", "recent"], right: [] }
  });
  assert.equal(config.layout.profiles.home.navigation.activeMenu, "post");
  assert.equal(config.layout.profiles.page.navigation.activeMenu, "post");
  assert.deepEqual(config.layout.profiles.error, {
    path: "/404.html",
    navigation: { activeMenu: "post" },
    sidebar: { left: ["recent"], right: [] }
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
  assert.equal(config.appearance.shape.radius.cardLarge, "24px");
  assert.equal(config.appearance.backgrounds.sidebar.opacity, 0.8);
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
        image: { src: null, variant: "avatar", href: null },
        name: null,
        wordmark: null,
        tagline: { text: null, hover: null },
        href: "/"
      },
      menu: { items: [] },
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
        color_scheme: "dark",
        typography: { font_size: { root: "18px" }, font_family: { code: "Menlo, monospace" }, content_align: "justify" },
        shape: { radius: { card_large: "28px" } },
        motion: { page_transition: false, avatar: "never" },
        colors: { primary: "#123456" },
        code_block: { scrollbar_width: "0px", highlight_stylesheet: null },
        backgrounds: { sidebar: { surface: "glass", image: "/sidebar.webp", opacity: 0, backdrop: { radius: "0px" } } }
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
  assert.deepEqual(config.appearance.motion, { pageTransition: false, avatar: "never" });
  assert.equal(config.appearance.codeBlock.scrollbarWidth, "0px");
  assert.equal(config.appearance.codeBlock.highlightStylesheet, null);
  assert.equal(config.appearance.backgrounds.sidebar.surface, "glass");
  assert.equal(config.appearance.backgrounds.sidebar.opacity, 0);
  assert.equal(config.resources.fallbacks.linkCard, "/link.svg");
  assert.equal(config.appearance.backgrounds.sidebar.image, "/sidebar.webp");
  assert.equal(config.resources.errorPage.image, null);
});

test("Appearance 与资源兜底拒绝旧根、旧字段、未知字段和非法范围", () => {
  assert.throws(() => parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
      style: { prefers_theme: "dark" },
      default: { cover: "/cover.svg" },
      appearance: {
        color_scheme: "sepia",
        motion: { enable: true },
        backgrounds: { sidebar: { opacity: 1.2, unknown: true } }
      },
      resources: { fallbacks: { link: "/link.svg", image: { unknown: "/image.svg" } } }
    }
  }), error => {
    assert.match(error.message, /style 已移除，期望 appearance/);
    assert.match(error.message, /default 已移除，期望 resources\.fallbacks/);
    assert.match(error.message, /appearance\.color_scheme 的值不在 auto \| light \| dark/);
    assert.match(error.message, /未知字段 appearance\.motion\.enable/);
    assert.match(error.message, /appearance\.backgrounds\.sidebar\.opacity 的值不在 number <= 1/);
    assert.match(error.message, /未知字段 appearance\.backgrounds\.sidebar\.unknown/);
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

test("Layout Profile 解析最终 ID、路径、动态 tabs、Widget 数组和首页评论参数袋", () => {
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
            navigation: {
              active_menu: "notes",
              tabs: [{ title: "朋友文章", url: "/friends/rss/" }]
            },
            sidebar: {
              left: ["recent", { layout: "markdown", content: "hello" }],
              right: ["toc"]
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
    navigation: { activeMenu: "notes", tabs: [{ title: "朋友文章", url: "/friends/rss/" }] },
    sidebar: {
      left: ["recent", { layout: "markdown", content: "hello" }],
      right: ["toc"]
    }
  });
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
            base_dir: "blog",
            unknown: true,
            path: 42,
            navigation: { menu: "post", tabs: [] },
            sidebar: { left: { widgets: [true] } }
          },
          error: { "404": "/404.html" },
          home: { comments: "true" }
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
    assert.match(error.message, /layout\.profiles\.blog_index\.sidebar\.left 应为 array/);
    assert.match(error.message, /layout\.profiles\.error\.404 已移除/);
    assert.match(error.message, /layout\.profiles\.home\.comments 应为 object/);
    return true;
  });
});

test("site Shell 解析封闭对象数组、动态 action 记录并完整替换数组", () => {
  const config = parseStellarConfig({
    themeConfig: {
      site: {
        brand: {
          image: { src: "/avatar.webp", variant: "icon", href: "/about/" },
          name: "Site",
          tagline: { text: "Subtitle" },
          href: "/home/"
        },
        menu: {
          items: [
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
      image: { src: "/avatar.webp", variant: "icon", href: "/about/" },
      name: "Site",
      wordmark: null,
      tagline: { text: "Subtitle", hover: null },
      href: "/home/"
    },
    menu: {
      items: [
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
        brand: { image: { style: "avatar", variant: "round" } },
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
    assert.match(error.message, /site\.brand\.image\.style 已移除/);
    assert.match(error.message, /site\.brand\.image\.variant 的值不在 avatar \| icon \| plain 中/);
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
        post: { path: "/post/", navigation: { active_menu: "missing", tabs: [] } }
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
  assert.equal(ctx.stellar.config.site.brand.tagline.text, null);
  assert.equal(ctx.stellar.config.site.menu.items[0].id, "post");
  assert.deepEqual(ctx.stellar.config.seo.canonical.allowedHosts, ["mirror.example.com"]);
  assert.deepEqual(ctx.stellar.config.seo.structuredData.sameAs, ["https://github.com/example"]);
  assert.equal(ctx.stellar.config.inject.headEnd, "<meta name=\"site\">");
  assertDeepFrozen(ctx.stellar.config);
});
