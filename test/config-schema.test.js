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

function withoutLayout(config) {
  const { layout, ...rest } = config;
  return rest;
}

test("site/layout/head Schema 提供默认值并忽略尚未迁移的根域", () => {
  const config = parseStellarConfig({
    source: "themes/stellar/_config.yml",
    themeConfig: { article: { type: "tech" } },
    siteConfig: { avatar: "/avatar.webp", title: "Stellar", subtitle: "每个人的独立博客" }
  });

  assert.deepEqual(withoutLayout(config), {
    site: {
      brand: {
        image: { src: "/avatar.webp", variant: "avatar", url: null, background: null },
        name: "Stellar",
        tagline: "每个人的独立博客",
        url: "/"
      },
      menu: { items: [] },
      footer: { actions: {}, sections: [], content: "" }
    },
    seo: {
      canonical: { host: "", allowedHosts: ["localhost"] },
      openGraph: { enabled: true, twitterId: null },
      structuredData: { sameAs: [] }
    },
    resources: { preconnect: [] },
    inject: { head: "", script: "" }
  });
  assert.deepEqual(Object.keys(config.layout.profiles), [
    "home", "blogIndex", "topicIndex", "wikiIndex", "post", "topic", "wiki",
    "notebookIndex", "noteIndex", "note", "author", "error", "page"
  ]);
  assert.deepEqual(config.layout.profiles.blogIndex, {
    path: "/blog/",
    navigation: { activeMenu: "post", tabs: {} },
    sidebar: { left: { widgets: ["welcome", "recent"] }, right: { widgets: [] } }
  });
  assert.equal(config.layout.profiles.home.navigation.activeMenu, "post");
  assert.equal(config.layout.profiles.page.navigation.activeMenu, "post");
  assert.deepEqual(config.layout.profiles.error, {
    path: "/404.html",
    navigation: { activeMenu: "post", tabs: {} },
    sidebar: { left: { widgets: ["recent"] }, right: { widgets: [] } }
  });
  assertDeepFrozen(config);
});

test("站点覆盖完成规范化、数组替换、稳定去重并保留注入原文", () => {
  const head = "<meta name=\"first\">\n  <meta name=\"second\">";
  const config = parseStellarConfig({
    source: "_config.stellar.yml",
    themeConfig: {
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
      inject: { head, script: "<script>window.example = true</script>" }
    }
  });

  assert.deepEqual(withoutLayout(config), {
    site: {
      brand: {
        image: { src: null, variant: "avatar", url: null, background: null },
        name: "",
        tagline: "",
        url: "/"
      },
      menu: { items: [] },
      footer: { actions: {}, sections: [], content: "" }
    },
    seo: {
      canonical: { host: "xaoxuu.com", allowedHosts: ["mirror.example.com", "localhost"] },
      openGraph: { enabled: false, twitterId: "  xaoxuu  " },
      structuredData: { sameAs: ["https://github.com/xaoxuu"] }
    },
    resources: { preconnect: ["https://cdn.example.com"] },
    inject: { head, script: "<script>window.example = true</script>" }
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
              tabs: { "朋友文章": "/friends/rss/" }
            },
            sidebar: {
              left: { widgets: ["recent", { layout: "markdown", content: "hello" }] },
              right: { widgets: ["toc"] }
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
    navigation: { activeMenu: "notes", tabs: { "朋友文章": "/friends/rss/" } },
    sidebar: {
      left: { widgets: ["recent", { layout: "markdown", content: "hello" }] },
      right: { widgets: ["toc"] }
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
    assert.match(error.message, /layout\.profiles\.blog_index\.path 应为 string \| null/);
    assert.match(error.message, /layout\.profiles\.blog_index\.navigation\.menu 已移除/);
    assert.match(error.message, /layout\.profiles\.blog_index\.navigation\.tabs 应为 object/);
    assert.match(error.message, /layout\.profiles\.blog_index\.sidebar\.left\.widgets\[0\] 应为 string \| object/);
    assert.match(error.message, /layout\.profiles\.error\.404 已移除/);
    assert.match(error.message, /layout\.profiles\.home\.comments 应为 boolean \| object \| null/);
    return true;
  });
});

test("site Shell 解析封闭对象数组、动态 action 记录并完整替换数组", () => {
  const config = parseStellarConfig({
    siteConfig: { avatar: "/avatar.webp", title: "Site", subtitle: "Subtitle" },
    themeConfig: {
      site: {
        brand: { image: { variant: "icon", url: "/about/" }, url: "/home/" },
        menu: {
          items: [{ id: "post", title: "Blog", icon: "documents", url: "/", accent: "#abc" }]
        },
        footer: {
          actions: {
            more: {
              variant: "dropdown",
              icon: "more",
              title: "More",
              items: [{ title: "About", url: "/about/" }]
            },
            command: { icon: "play", action: "run()" }
          },
          sections: [{ title: "Links", items: ["[Home](/)"] }],
          content: "Footer"
        }
      }
    }
  });

  assert.deepEqual(config.site, {
    brand: {
      image: { src: "/avatar.webp", variant: "icon", url: "/about/", background: null },
      name: "Site",
      tagline: "Subtitle",
      url: "/home/"
    },
    menu: {
      items: [{ id: "post", title: "Blog", icon: "documents", url: "/", accent: "#abc" }]
    },
    footer: {
      actions: {
        more: {
          variant: "dropdown",
          icon: "more",
          title: "More",
          url: null,
          action: null,
          items: [{ icon: null, title: "About", url: "/about/" }]
        },
        command: {
          variant: null,
          icon: "play",
          title: null,
          url: null,
          action: "run()",
          items: []
        }
      },
      sections: [{ title: "Links", items: ["[Home](/)"] }],
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
    assert.match(error.message, /site\.footer\.actions\.more\.type 已移除/);
    assert.match(error.message, /未知字段 site\.footer\.actions\.more\.unknown/);
    assert.match(error.message, /site\.footer\.sections\[0\]\.items 应为 array/);
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
        inject: { head: ["<meta>"] }
      }
    }),
    error => {
      assert.ok(error instanceof ConfigSchemaError);
      assert.deepEqual(error.issues.map(item => [item.path, item.actualType, item.expected]), [
        ["seo.canonical.host", "number", "string | null"],
        ["seo.open_graph.enabled", "string", "boolean"],
        ["inject.head", "array", "string"]
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

test("构建事件把最终路径冻结挂载到 hexo.stellar.config", () => {
  const ctx = {
    config: {
      avatar: "/avatar.webp",
      title: "Example",
      subtitle: "Example subtitle",
      theme_config: {
        site: { menu: { items: [{ id: "post", title: "Blog", icon: "documents", url: "/" }] } },
        seo: {
          canonical: { host: "example.com", allowed_hosts: ["mirror.example.com"] },
          structured_data: { same_as: ["https://github.com/example"] }
        },
        inject: { head: "<meta name=\"site\">" }
      }
    }
  };

  attachConfig(ctx);

  assert.equal(ctx.stellar.config.seo.canonical.host, "example.com");
  assert.equal(ctx.stellar.config.site.brand.image.src, "/avatar.webp");
  assert.equal(ctx.stellar.config.site.brand.name, "Example");
  assert.equal(ctx.stellar.config.site.menu.items[0].id, "post");
  assert.deepEqual(ctx.stellar.config.seo.canonical.allowedHosts, ["mirror.example.com"]);
  assert.deepEqual(ctx.stellar.config.seo.structuredData.sameAs, ["https://github.com/example"]);
  assert.equal(ctx.stellar.config.inject.head, "<meta name=\"site\">");
  assertDeepFrozen(ctx.stellar.config);
});
