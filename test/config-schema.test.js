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

test("site/head Schema 提供派生默认值并忽略尚未迁移的根域", () => {
  const config = parseStellarConfig({
    source: "themes/stellar/_config.yml",
    themeConfig: { article: { type: "tech" } },
    siteConfig: { avatar: "/avatar.webp", title: "Stellar", subtitle: "每个人的独立博客" }
  });

  assert.deepEqual(config, {
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

  assert.deepEqual(config, {
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
