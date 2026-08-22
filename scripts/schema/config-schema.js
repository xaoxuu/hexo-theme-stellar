/* global hexo */
"use strict";

const { deepFreeze } = require("./schema-utils");
const {
  CONFIG_TARGET_FIELDS,
  PROFILE_ID_MIGRATIONS,
  PROFILE_IDS
} = require("./config-target");

function literal(value) {
  return { kind: "literal", value };
}

function structuralOptions(options) {
  const result = {};
  for (const key of [
    "items",
    "values",
    "properties",
    "additionalProperties",
    "additionalPropertyKey",
    "allowedPropertyKeys",
    "minimum",
    "exclusiveMinimum",
    "externalProperties",
    "removedProperties",
    "requiredProperties",
    "sealed"
  ]) {
    if (options[key] !== undefined) result[key] = options[key];
  }
  return result;
}

function field(type, options) {
  return {
    type: Array.isArray(type) ? type : [type],
    default: options.default,
    scope: options.scope,
    cascade: options.cascade,
    normalizer: options.normalizer,
    normalization: options.normalization,
    consumers: options.consumers,
    example: options.example,
    migration: options.migration,
    runtimeKey: options.runtimeKey,
    validator: options.validator,
    ...structuralOptions(options)
  };
}

function deliveredField(path, options) {
  const target = CONFIG_TARGET_FIELDS.find(item => item.path === path && item.scopes.includes("theme"));
  if (!target || target.status !== "delivered") {
    throw new Error(`配置目标 ${path} 尚未交付`);
  }
  return field(target.type, {
    ...options,
    default: target.default,
    scope: target.scopes[0],
    cascade: target.cascade,
    normalizer: options.normalizer,
    normalization: target.normalization,
    consumers: target.consumers,
    example: options.example,
    migration: target.migration,
    runtimeKey: target.runtimePath.split(".").pop(),
    items: options.items ?? target.items,
    values: target.values,
    minimum: target.minimum,
    exclusiveMinimum: target.exclusiveMinimum
  });
}

function object(options) {
  return {
    type: ["object"],
    default: literal({}),
    scope: "theme",
    cascade: ["schema default", "site theme override"],
    normalizer: "object",
    normalization: "merge declared child fields; deep-freeze the normalized JavaScript object",
    sealed: true,
    ...options
  };
}

const SEO_CONSUMERS = Object.freeze([
  "Post PageViewModel",
  "head renderer",
  "JSON-LD helper",
  "browser canonical check",
  "Reference generator"
]);
const SITE_CONSUMERS = Object.freeze([
  "PageViewModel",
  "Shell renderer",
  "menu renderer",
  "footer renderer",
  "Reference generator"
]);
const LAYOUT_CONSUMERS = Object.freeze([
  "CollectionModel",
  "PageViewModel",
  "page generators",
  "navigation renderer",
  "sidebar renderer",
  "Reference generator"
]);
const PRECONNECT_CONSUMERS = Object.freeze(["head renderer", "Reference generator"]);
const INJECT_CONSUMERS = Object.freeze(["head renderer", "script renderer", "Reference generator"]);
const CONTENT_CONSUMERS = Object.freeze([
  "CollectionModel",
  "PageViewModel",
  "article renderer",
  "listing renderer",
  "Reference generator"
]);

const AI_LABEL_DEFAULTS = Object.freeze({
  manual: { color: "#03a9f4", icon: "default:shield-user" },
  reviewed: { color: "#4caf50", icon: "default:shield-check" },
  polished: { color: "#4caf50", icon: "default:shield-up" },
  generated: { color: "#ff9800", icon: "default:shield-warning" }
});

function aiLabelLevelSchema() {
  return object({
    consumers: CONTENT_CONSUMERS,
    example: { color: "#03a9f4", icon: "default:shield-user" },
    migration: "configuration/content",
    runtimeKey: "<level>",
    properties: {
      color: deliveredField("content.article.ai_label.<level>.color", {
        normalizer: "identity",
        example: "#03a9f4"
      }),
      icon: deliveredField("content.article.ai_label.<level>.icon", {
        normalizer: "identity",
        example: "default:shield-user"
      })
    }
  });
}

function runtimeProfileKey(profile) {
  return profile.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function layoutProfileSchema(profile) {
  const base = `layout.profiles.${profile}`;
  const removedProperties = { base_dir: "path" };
  if (profile === "error") removedProperties["404"] = "path";

  const properties = {
    path: deliveredField(`${base}.path`, {
      normalizer: "root_relative_path",
      example: profile === "error" ? "/404.html" : "/blog/"
    }),
    navigation: object({
      consumers: LAYOUT_CONSUMERS,
      example: { active_menu: "post", tabs: {} },
      migration: "configuration/layout",
      runtimeKey: "navigation",
      removedProperties: { menu: "active_menu" },
      properties: {
        active_menu: deliveredField(`${base}.navigation.active_menu`, {
          normalizer: "identity",
          example: "post"
        }),
        tabs: deliveredField(`${base}.navigation.tabs`, {
          normalizer: "object",
          example: { "朋友文章": "/friends/rss/" },
          sealed: false,
          additionalPropertyKey: "<title>",
          additionalProperties: deliveredField(`${base}.navigation.tabs.<title>`, {
            normalizer: "identity",
            example: "/friends/rss/"
          })
        })
      }
    }),
    sidebar: object({
      consumers: LAYOUT_CONSUMERS,
      example: { left: { widgets: ["recent"] }, right: { widgets: ["toc"] } },
      migration: "configuration/layout",
      runtimeKey: "sidebar",
      properties: {
        left: object({
          consumers: LAYOUT_CONSUMERS,
          example: { widgets: ["recent"] },
          migration: "configuration/layout",
          runtimeKey: "left",
          properties: {
            widgets: deliveredField(`${base}.sidebar.left.widgets`, {
              normalizer: "array",
              example: ["recent"]
            })
          }
        }),
        right: object({
          consumers: LAYOUT_CONSUMERS,
          example: { widgets: ["toc"] },
          migration: "configuration/layout",
          runtimeKey: "right",
          properties: {
            widgets: deliveredField(`${base}.sidebar.right.widgets`, {
              normalizer: "array",
              example: ["toc"]
            })
          }
        })
      }
    })
  };

  if (profile === "home") {
    properties.comments = deliveredField("layout.profiles.home.comments", {
      normalizer: "identity",
      example: { enabled: true, provider: "giscus", options: {} },
      properties: {
        enabled: deliveredField("layout.profiles.home.comments.enabled", {
          normalizer: "identity",
          example: true
        }),
        title: deliveredField("layout.profiles.home.comments.title", {
          normalizer: "identity",
          example: "留言"
        }),
        id: deliveredField("layout.profiles.home.comments.id", {
          normalizer: "identity",
          example: "home"
        }),
        provider: deliveredField("layout.profiles.home.comments.provider", {
          normalizer: "identity",
          example: "giscus"
        }),
        options: deliveredField("layout.profiles.home.comments.options", {
          normalizer: "parameter_bag",
          example: { "data-repo": "owner/repo" },
          sealed: false
        })
      }
    });
  }

  return object({
    consumers: LAYOUT_CONSUMERS,
    example: {},
    migration: "configuration/layout",
    runtimeKey: runtimeProfileKey(profile),
    removedProperties,
    properties
  });
}

function layoutProfilesSchema() {
  const properties = Object.fromEntries(PROFILE_IDS.map(profile => [profile, layoutProfileSchema(profile)]));
  const removedProperties = Object.fromEntries(
    Object.entries(PROFILE_ID_MIGRATIONS).filter(([legacy, target]) => legacy !== target)
  );
  return deliveredField("layout.profiles", {
    normalizer: "object",
    example: { blog_index: { path: "/blog/" } },
    sealed: true,
    removedProperties,
    properties
  });
}

const CONFIG_SCHEMA = deepFreeze({
  type: ["object"],
  scope: "theme",
  sealed: false,
  migration: "configuration/v2",
  removedProperties: {
    brand: "site.brand",
    menubar: "site.menu",
    footer: "site.footer",
    site_tree: "layout.profiles",
    preconnect: "resources.preconnect",
    canonical: "seo.canonical",
    open_graph: "seo.open_graph",
    structured_data: "seo.structured_data",
    article: "content.article",
    notebook: "content.notebook"
  },
  properties: {
    site: object({
      consumers: SITE_CONSUMERS,
      example: {
        brand: { name: "Stellar", tagline: "每个人的独立博客", url: "/" },
        menu: { items: [{ id: "post", title: "博客", icon: "default:documents", url: "/", accent: "#1BCDFC" }] },
        footer: { actions: {}, sections: [], content: "" }
      },
      migration: "configuration/site",
      runtimeKey: "site",
      properties: {
        brand: object({
          consumers: SITE_CONSUMERS,
          example: {
            image: { src: "/avatar.webp", variant: "avatar", url: "/about/" },
            name: "Stellar",
            tagline: "每个人的独立博客",
            url: "/"
          },
          migration: "configuration/site",
          runtimeKey: "brand",
          properties: {
            image: object({
              consumers: SITE_CONSUMERS,
              example: { src: "/avatar.webp", variant: "avatar", url: "/about/" },
              migration: "configuration/site",
              runtimeKey: "image",
              removedProperties: { style: "variant" },
              properties: {
                src: deliveredField("site.brand.image.src", { normalizer: "identity", example: "/avatar.webp" }),
                variant: deliveredField("site.brand.image.variant", { normalizer: "identity", example: "avatar" }),
                url: deliveredField("site.brand.image.url", { normalizer: "identity", example: "/about/" }),
                background: deliveredField("site.brand.image.background", { normalizer: "identity", example: "var(--block)" })
              }
            }),
            name: deliveredField("site.brand.name", { normalizer: "identity", example: "Stellar" }),
            tagline: deliveredField("site.brand.tagline", { normalizer: "identity", example: "每个人的独立博客" }),
            url: deliveredField("site.brand.url", { normalizer: "identity", example: "/" })
          }
        }),
        menu: object({
          consumers: SITE_CONSUMERS,
          example: { items: [{ id: "post", title: "博客", icon: "default:documents", url: "/", accent: "#1BCDFC" }] },
          migration: "configuration/site",
          runtimeKey: "menu",
          properties: {
            items: deliveredField("site.menu.items", {
              normalizer: "array",
              example: [{ id: "post", title: "博客", icon: "default:documents", url: "/", accent: "#1BCDFC" }],
              items: object({
                consumers: SITE_CONSUMERS,
                example: { id: "post", title: "博客", icon: "default:documents", url: "/", accent: "#1BCDFC" },
                migration: "configuration/site",
                removedProperties: { theme: "accent" },
                properties: {
                  id: deliveredField("site.menu.items[].id", { normalizer: "identity", example: "post" }),
                  title: deliveredField("site.menu.items[].title", { normalizer: "identity", example: "博客" }),
                  icon: deliveredField("site.menu.items[].icon", { normalizer: "identity", example: "default:documents" }),
                  url: deliveredField("site.menu.items[].url", { normalizer: "identity", example: "/" }),
                  accent: deliveredField("site.menu.items[].accent", { normalizer: "identity", example: "#1BCDFC" })
                }
              })
            })
          }
        }),
        footer: object({
          consumers: SITE_CONSUMERS,
          example: { actions: {}, sections: [], content: "" },
          migration: "configuration/site",
          runtimeKey: "footer",
          removedProperties: { social: "actions", sitemap: "sections" },
          properties: {
            actions: deliveredField("site.footer.actions", {
              normalizer: "object",
              example: { github: { icon: "default:github", title: "GitHub", url: "https://github.com/" } },
              sealed: false,
              additionalPropertyKey: "<id>",
              additionalProperties: deliveredField("site.footer.actions.<id>", {
                normalizer: "object",
                example: { icon: "default:github", title: "GitHub", url: "https://github.com/" },
                sealed: true,
                properties: {
                  variant: deliveredField("site.footer.actions.<id>.variant", { normalizer: "identity", example: "dropdown" }),
                  icon: deliveredField("site.footer.actions.<id>.icon", { normalizer: "identity", example: "default:github" }),
                  title: deliveredField("site.footer.actions.<id>.title", { normalizer: "identity", example: "GitHub" }),
                  url: deliveredField("site.footer.actions.<id>.url", { normalizer: "identity", example: "https://github.com/" }),
                  action: deliveredField("site.footer.actions.<id>.action", { normalizer: "trusted_text", example: "window.example()" }),
                  items: deliveredField("site.footer.actions.<id>.items", {
                    normalizer: "array",
                    example: [{ icon: "default:github", title: "GitHub", url: "https://github.com/" }],
                    items: object({
                      consumers: SITE_CONSUMERS,
                      example: { icon: "default:github", title: "GitHub", url: "https://github.com/" },
                      migration: "configuration/site",
                      properties: {
                        icon: deliveredField("site.footer.actions.<id>.items[].icon", { normalizer: "identity", example: "default:github" }),
                        title: deliveredField("site.footer.actions.<id>.items[].title", { normalizer: "identity", example: "GitHub" }),
                        url: deliveredField("site.footer.actions.<id>.items[].url", { normalizer: "identity", example: "https://github.com/" })
                      }
                    })
                  })
                },
                removedProperties: { type: "variant", onclick: "action" }
              })
            }),
            sections: deliveredField("site.footer.sections", {
              normalizer: "array",
              example: [{ title: "博客", items: ["[归档](/blog/archives/)"] }],
              items: object({
                consumers: SITE_CONSUMERS,
                example: { title: "博客", items: ["[归档](/blog/archives/)"] },
                migration: "configuration/site",
                properties: {
                  title: deliveredField("site.footer.sections[].title", { normalizer: "identity", example: "博客" }),
                  items: deliveredField("site.footer.sections[].items", { normalizer: "identity", example: ["[归档](/blog/archives/)"] })
                }
              })
            }),
            content: deliveredField("site.footer.content", { normalizer: "trusted_text", example: "本站由 Stellar 生成。" })
          }
        })
      }
    }),
    layout: object({
      consumers: LAYOUT_CONSUMERS,
      example: { profiles: { blog_index: { path: "/blog/" } } },
      migration: "configuration/layout",
      runtimeKey: "layout",
      properties: {
        profiles: layoutProfilesSchema()
      }
    }),
    content: object({
      consumers: CONTENT_CONSUMERS,
      example: { article: { listing: { card_layout: "hero" } }, notebook: { listing: { order_by: "-updated" } } },
      migration: "configuration/content",
      runtimeKey: "content",
      properties: {
        article: object({
          consumers: CONTENT_CONSUMERS,
          example: { type: "tech", listing: { pinned_layout: "carousel", card_layout: "hero" } },
          migration: "configuration/content",
          runtimeKey: "article",
          removedProperties: {
            pin_style: "listing.pinned_layout",
            cover_ratio: "listing.cover_ratio",
            card_style: "listing.card_layout",
            banner_ratio: "banner.ratio",
            auto_excerpt: "listing.excerpt_length",
            category_color: "category_colors",
            license: "footer.license",
            share: "footer.share",
            reading_time: "show_reading_time",
            card_tags: "listing.show_tags",
            tags: "show_tags"
          },
          properties: {
            type: deliveredField("content.article.type", { normalizer: "identity", example: "tech" }),
            indent: deliveredField("content.article.indent", { normalizer: "identity", example: null }),
            listing: object({
              consumers: CONTENT_CONSUMERS,
              example: { pinned_layout: "carousel", card_layout: "hero", cover_ratio: 2, excerpt_length: 128, show_tags: false },
              migration: "configuration/content",
              runtimeKey: "listing",
              removedProperties: { pin_style: "pinned_layout", card_style: "card_layout", auto_excerpt: "excerpt_length", card_tags: "show_tags" },
              properties: {
                pinned_layout: deliveredField("content.article.listing.pinned_layout", { normalizer: "identity", example: "carousel" }),
                card_layout: deliveredField("content.article.listing.card_layout", { normalizer: "identity", example: "hero" }),
                cover_ratio: deliveredField("content.article.listing.cover_ratio", { normalizer: "identity", example: 2, exclusiveMinimum: 0 }),
                excerpt_length: deliveredField("content.article.listing.excerpt_length", { normalizer: "identity", example: 128, minimum: 0 }),
                show_tags: deliveredField("content.article.listing.show_tags", { normalizer: "identity", example: false })
              }
            }),
            banner: object({
              consumers: CONTENT_CONSUMERS,
              example: { ratio: 2.5 },
              migration: "configuration/content",
              runtimeKey: "banner",
              properties: {
                ratio: deliveredField("content.article.banner.ratio", { normalizer: "identity", example: 2.5, exclusiveMinimum: 0 })
              }
            }),
            category_colors: deliveredField("content.article.category_colors", {
              normalizer: "object",
              example: { "探索号": "#f44336" },
              sealed: false,
              additionalPropertyKey: "<category>",
              additionalProperties: deliveredField("content.article.category_colors.<category>", {
                normalizer: "identity",
                example: "#f44336"
              })
            }),
            ai_label: object({
              default: literal({ default: null, ...AI_LABEL_DEFAULTS }),
              consumers: CONTENT_CONSUMERS,
              example: { default: null, manual: AI_LABEL_DEFAULTS.manual },
              migration: "configuration/content",
              runtimeKey: "aiLabel",
              sealed: false,
              allowedPropertyKeys: ["default", "manual", "reviewed", "polished", "generated"],
              properties: {
                default: deliveredField("content.article.ai_label.default", { normalizer: "identity", example: null })
              },
              additionalPropertyKey: "<level>",
              additionalProperties: aiLabelLevelSchema()
            }),
            footer: object({
              consumers: CONTENT_CONSUMERS,
              example: { license: true, share: ["wechat", "link"] },
              migration: "configuration/content",
              runtimeKey: "footer",
              properties: {
                license: deliveredField("content.article.footer.license", { normalizer: "identity", example: true }),
                share: deliveredField("content.article.footer.share", { normalizer: "identity", example: ["wechat", "link"] })
              }
            }),
            related_posts: object({
              consumers: CONTENT_CONSUMERS,
              example: { enabled: false, limit: 5 },
              migration: "configuration/content",
              runtimeKey: "relatedPosts",
              removedProperties: { enable: "enabled", max_count: "limit" },
              properties: {
                enabled: deliveredField("content.article.related_posts.enabled", { normalizer: "identity", example: false }),
                limit: deliveredField("content.article.related_posts.limit", { normalizer: "identity", example: 5, minimum: 0 })
              }
            }),
            show_reading_time: deliveredField("content.article.show_reading_time", { normalizer: "identity", example: false }),
            show_tags: deliveredField("content.article.show_tags", { normalizer: "identity", example: true })
          }
        }),
        notebook: object({
          consumers: CONTENT_CONSUMERS,
          example: { listing: { excerpt_length: 128, per_page: null, order_by: "-updated" }, tag_icons: {} },
          migration: "configuration/content",
          runtimeKey: "notebook",
          properties: {
            listing: object({
              consumers: CONTENT_CONSUMERS,
              example: { excerpt_length: 128, per_page: null, order_by: "-updated" },
              migration: "configuration/content",
              runtimeKey: "listing",
              properties: {
                excerpt_length: deliveredField("content.notebook.listing.excerpt_length", { normalizer: "identity", example: 128, minimum: 0 }),
                per_page: deliveredField("content.notebook.listing.per_page", { normalizer: "identity", example: null, minimum: 0 }),
                order_by: deliveredField("content.notebook.listing.order_by", { normalizer: "identity", example: "-updated" })
              }
            }),
            tag_icons: deliveredField("content.notebook.tag_icons", {
              normalizer: "object",
              example: { "": "quot:hashtag" },
              sealed: false,
              additionalPropertyKey: "<tag>",
              additionalProperties: deliveredField("content.notebook.tag_icons.<tag>", {
                normalizer: "identity",
                example: "quot:hashtag"
              })
            }),
            footer: object({
              consumers: CONTENT_CONSUMERS,
              example: { license: false, share: false },
              migration: "configuration/content",
              runtimeKey: "footer",
              properties: {
                license: deliveredField("content.notebook.footer.license", { normalizer: "identity", example: false }),
                share: deliveredField("content.notebook.footer.share", { normalizer: "identity", example: false })
              }
            })
          }
        })
      }
    }),
    seo: object({
      consumers: SEO_CONSUMERS,
      example: {
        canonical: { host: "example.com", allowed_hosts: ["mirror.example.com"] },
        open_graph: { enabled: true, twitter_id: "stellar" },
        structured_data: { same_as: ["https://github.com/xaoxuu"] }
      },
      migration: "configuration/seo",
      runtimeKey: "seo",
      properties: {
        canonical: object({
          consumers: SEO_CONSUMERS,
          example: { host: "example.com", allowed_hosts: ["mirror.example.com"] },
          migration: "configuration/seo#canonical",
          runtimeKey: "canonical",
          removedProperties: {
            original_host: "host",
            official_hosts: "allowed_hosts",
            originalHost: "host",
            officialHosts: "allowed_hosts"
          },
          properties: {
            host: deliveredField("seo.canonical.host", {
              normalizer: "nullable_host",
              example: "example.com"
            }),
            allowed_hosts: deliveredField("seo.canonical.allowed_hosts", {
              normalizer: "host_list",
              example: ["mirror.example.com", "localhost"]
            })
          }
        }),
        open_graph: object({
          consumers: SEO_CONSUMERS,
          example: { enabled: true, twitter_id: "stellar" },
          migration: "configuration/seo#open-graph",
          runtimeKey: "openGraph",
          removedProperties: { enable: "enabled", twitterId: "twitter_id" },
          properties: {
            enabled: deliveredField("seo.open_graph.enabled", {
              normalizer: "identity",
              example: true
            }),
            twitter_id: deliveredField("seo.open_graph.twitter_id", {
              normalizer: "identity",
              example: "stellar"
            })
          }
        }),
        structured_data: object({
          consumers: SEO_CONSUMERS,
          example: { same_as: ["https://github.com/xaoxuu"] },
          migration: "configuration/seo#structured-data",
          runtimeKey: "structuredData",
          removedProperties: { links: "same_as", sameAs: "same_as" },
          properties: {
            same_as: deliveredField("seo.structured_data.same_as", {
              normalizer: "trimmed_string_list",
              example: ["https://github.com/xaoxuu"]
            })
          }
        })
      }
    }),
    resources: object({
      consumers: PRECONNECT_CONSUMERS,
      example: { preconnect: ["https://cdn.jsdelivr.net"] },
      migration: "configuration/resources",
      runtimeKey: "resources",
      properties: {
        preconnect: deliveredField("resources.preconnect", {
          normalizer: "origin_list",
          example: ["https://cdn.jsdelivr.net"]
        })
      }
    }),
    inject: object({
      consumers: INJECT_CONSUMERS,
      example: { head: "<meta name=\"example\" content=\"stellar\">", script: "<script>console.log('stellar')</script>" },
      migration: "configuration/inject",
      runtimeKey: "inject",
      properties: {
        head: deliveredField("inject.head", {
          normalizer: "trusted_text",
          example: "<meta name=\"example\" content=\"stellar\">"
        }),
        script: deliveredField("inject.script", {
          normalizer: "trusted_text",
          example: "<script>console.log('stellar')</script>"
        })
      }
    })
  }
});

module.exports = {
  CONFIG_SCHEMA,
  literal
};
