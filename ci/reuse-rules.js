"use strict";

const INTERNAL = require("../scripts/lib/internal-constants");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function protectedAddresses(value, prefix = "INTERNAL") {
  if (typeof value === "string" && (/^(?:https?:)?\//.test(value))) {
    return [{
      id: `internal-address:${prefix.replace(/^INTERNAL\./, "")}`,
      pattern: new RegExp("[\"'`]" + escapeRegExp(value) + "[\"'`]", "g"),
      canonical: prefix,
      excludedFiles: ["scripts/lib/internal-constants.js"],
      exceptions: []
    }];
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) => protectedAddresses(child, `${prefix}.${key}`));
}

const INTERNAL_ADDRESS_RULES = [
  ...protectedAddresses(INTERNAL.assets, "INTERNAL.assets")
];

module.exports = Object.freeze({
  SOURCE_GLOBS: [
    "layout/**/*.ejs",
    "scripts/**/*.js",
    "source/js/**/*.{js,mjs}",
    "source/css/**/*.styl"
  ],
  CONTROL_GLOBS: [
    "layout/_partial/components/**/*.ejs",
    "layout/_partial/regions/**/*.ejs",
    "layout/_partial/sidebar/**/*.ejs",
    "layout/_partial/widgets/**/*.ejs",
    "layout/_partial/dropdown.ejs",
    "layout/_partial/menubtn.ejs",
    "layout/_partial/search/**/*.ejs"
  ],
  RAW_CAPABILITY_EXCLUSIONS: [
    "scripts/lib/ui-capabilities.js"
  ],
  PLAIN_LINK_EXCEPTIONS: [
    {
      file: "layout/_partial/sidebar/brand.ejs",
      selector: "brand-navigation__back",
      reason: "Collection Brand 返回入口拥有独立胶囊语义，不消费通用控件表面"
    },
    {
      file: "layout/_partial/widgets/author.ejs",
      selector: "follow",
      reason: "作者关注入口由 Author Widget 独立定义品牌动作表面"
    },
    {
      file: "layout/_partial/widgets/ghrepo.ejs",
      selector: "repo",
      reason: "仓库主体链接是内容容器，不是标准 Shell 控件"
    },
    {
      file: "layout/_partial/widgets/ghuser.ejs",
      selector: "gh-url",
      reason: "GitHub 用户名是资料内容链接，不具有控件表面"
    },
    {
      file: "layout/_partial/widgets/ghuser.ejs",
      selector: "btn",
      reason: "GitHub 统计链接保留第三方资料卡专属交互"
    },
    {
      file: "layout/_partial/widgets/ghuser.ejs",
      selector: "follow",
      reason: "GitHub 关注入口保留第三方资料卡专属交互"
    }
  ],
  DYNAMIC_CONTROL_RULES: [
    {
      file: "source/js/main.js",
      selector: "toc-link",
      capability: "ctx.ui.classes.interactive",
      pattern: /a\.className = 'toc-link ' \+ ctx\.ui\.classes\.interactive/
    },
    {
      file: "source/js/search/local-search.js",
      selector: "search-result-link",
      capability: "ctx.ui.classes.interactiveSpotlight",
      pattern: /a\.className = ctx\.ui\.classes\.interactiveSpotlight/
    },
    {
      file: "source/js/search/algolia-search.js",
      selector: "search-result-link",
      capability: "ctx.ui.classes.interactiveSpotlight",
      pattern: /link\.className = ctx\.ui\.classes\.interactiveSpotlight/
    }
  ],
  PROTECTED_LITERALS: [
    {
      id: "main-article-width",
      pattern: /\b(?:width|max-width):\s*720px\b/g,
      canonical: "--width-main-article",
      excludedFiles: [],
      exceptions: [
        {
          file: "source/css/_components/pages/collection-preview.styl",
          selector: ">h1, >p",
          reason: "Collection Preview 标题与说明的局部行长不表达页面 Main 宽度"
        },
        {
          file: "source/css/_components/pages/collection-preview.styl",
          selector: ".collection-preview__theme",
          reason: "Collection Preview 工具栏与预览面板对齐，不表达页面 Main 宽度"
        }
      ]
    },
    {
      id: "main-default-width",
      pattern: /\b(?:width|max-width):\s*900px\b/g,
      canonical: "--width-main-default",
      excludedFiles: [],
      exceptions: []
    },
    {
      id: "button-radius",
      pattern: /border-radius:\s*8px\b/g,
      canonical: "$border-button",
      excludedFiles: ["source/css/_custom.styl"],
      exceptions: [
        {
          file: "source/css/_common/canonical.styl",
          selector: ".canonical-tip",
          reason: "Canonical 提示面板的局部容器圆角，不表达按钮语义"
        },
        {
          file: "source/css/_common/toast.styl",
          selector: "div.toast",
          reason: "Toast 浮层的局部容器圆角，不表达按钮语义"
        },
        {
          file: "source/css/_components/tag-plugins/chat.styl",
          selector: ".md-text .tag-plugin.chat",
          reason: "聊天卡片容器的局部圆角，不表达按钮语义"
        },
        {
          file: "source/css/_components/tag-plugins/chat.styl",
          selector: ".news-num",
          reason: "未读数量徽标的局部形状，不表达按钮语义"
        },
        {
          file: "source/css/_components/tag-plugins/gallery.styl",
          selector: ".grid-cell,img",
          reason: "网格图片裁剪圆角属于 Gallery 局部几何"
        },
        {
          file: "source/css/_components/tag-plugins/gallery.styl",
          selector: ".flow-cell",
          reason: "流式图片单元圆角属于 Gallery 局部几何"
        },
        {
          file: "source/css/_components/tag-plugins/gallery.styl",
          selector: "img",
          reason: "图片裁剪圆角属于 Gallery 局部几何"
        },
        {
          file: "source/css/_components/tag-plugins/gallery.styl",
          selector: ".image-meta",
          reason: "图片元数据遮罩圆角属于 Gallery 局部几何"
        },
        {
          file: "source/css/_components/tag-plugins/mbti.styl",
          selector: ".mbti-dot",
          reason: "MBTI 数据点尺寸是可视化局部几何"
        },
        {
          file: "source/css/_components/tag-plugins/okr.styl",
          selector: "&:before",
          reason: "OKR 时间线标记是组件局部光学尺寸"
        },
        {
          file: "source/css/_components/tag-plugins/timeline.styl",
          selector: "&:before",
          reason: "Timeline 标记是组件局部光学尺寸"
        }
      ]
    },
    {
      id: "request-timeout",
      pattern: /\btimeoutMs\s*[:=]\s*5000\b/g,
      field: "timeoutMs",
      canonical: "INTERNAL.runtime.request.timeoutMs",
      excludedFiles: ["scripts/lib/internal-constants.js"],
      exceptions: []
    },
    {
      id: "request-retries",
      pattern: /\bretries\s*[:=]\s*2\b/g,
      field: "retries",
      canonical: "INTERNAL.runtime.request.retries",
      excludedFiles: ["scripts/lib/internal-constants.js"],
      exceptions: []
    },
    {
      id: "cache-default-ttl",
      pattern: /\bdefaultTtl\s*[:=]\s*3600\b/g,
      field: "defaultTtl",
      canonical: "INTERNAL.runtime.cache.defaultTtl",
      excludedFiles: ["scripts/lib/internal-constants.js"],
      exceptions: []
    },
    {
      id: "cache-max-entries",
      pattern: /\bmaxEntries\s*[:=]\s*200\b/g,
      field: "maxEntries",
      canonical: "INTERNAL.runtime.cache.maxEntries",
      excludedFiles: ["scripts/lib/internal-constants.js"],
      exceptions: []
    },
    {
      id: "request-idle-timeout",
      pattern: /\bidleTimeoutMs\s*[:=]\s*3000\b/g,
      field: "idleTimeoutMs",
      canonical: "INTERNAL.runtime.request.idleTimeoutMs",
      excludedFiles: ["scripts/lib/internal-constants.js"],
      exceptions: []
    },
    {
      id: "request-max-cache-entry-bytes",
      pattern: /\bmaxCacheEntryBytes\s*[:=]\s*200\s*\*\s*1024\b/g,
      field: "maxCacheEntryBytes",
      canonical: "INTERNAL.runtime.request.maxCacheEntryBytes",
      excludedFiles: ["scripts/lib/internal-constants.js"],
      exceptions: []
    },
    ...INTERNAL_ADDRESS_RULES
  ]
});
