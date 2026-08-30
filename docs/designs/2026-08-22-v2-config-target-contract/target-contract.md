---
title: Stellar v2 最终配置字段树与迁移映射
date: 2026-08-22
status: 冻结
---

# 最终字段树

下列 YAML 是目标契约，不是当前可用配置。字段默认值、类型、级联、运行时键和消费方以 `scripts/schema/config-target.js` 为机器事实；只有状态变为 `delivered` 的节点才允许进入运行时和公开 Reference。

```yaml
site:
  brand:
    image:
      src:
      variant: avatar
      url:
      background:
    name:
    tagline:
    url: /
  menu:
    items: [] # id/title/icon/url/accent
  footer:
    actions: {} # 动态 action ID；dropdown items 为 icon/title/url 封闭记录
    sections: [] # 每项为 title + string[] items 封闭记录
    content: |

seo:
  canonical:
    host:
    allowed_hosts: [localhost]
  open_graph:
    enabled: true
    twitter_id:
  structured_data:
    same_as: []

layout:
  profiles:
    home: {}
    blog_index: {}
    topic_index: {}
    wiki_index: {}
    post: {}
    topic: {}
    wiki: {}
    notebook_index: {}
    note_index: {}
    note: {}
    author: {}
    error: {}
    page: {}
    # 适用 Profile 使用 path/navigation/sidebar/comments：
    # path:
    # navigation: { active_menu: null, tabs: {} }
    # sidebar:
    #   left: { widgets: [] }
    #   right: { widgets: [] }
    # comments:

content:
  article:
    type: tech
    indent:
    listing:
      pinned_layout: carousel
      card_layout: hero
      cover_ratio: 2
      excerpt_length: 128
      show_tags: false
    banner: { ratio: 2.5 }
    category_colors: {}
    ai_label:
      default:
      manual: {}
      reviewed: {}
      polished: {}
      generated: {}
    footer: { license: '默认许可文本', share: false }
    related_posts: { enabled: false, limit: 5 }
    show_reading_time: false
    show_tags: true
  notebook:
    listing: { excerpt_length: 128, per_page: null, order_by: -updated }
    tag_icons: { '': quot:hashtag }
    footer: { license: false, share: false }

appearance:
  color_scheme: auto
  typography:
    font_size: { root: 16px, inline_code: 85%, code_block: 0.8125rem }
    font_family: { body: system-ui, inline_code: monospace, code_block: monospace }
    text_align: left
    heading_prefixes: { h2: '#', h3: '=', h4: '|', h5: ':' }
  shape:
    corner: superellipse(1.25)
    radius:
      card_large: 24px
      card: 16px
      card_small: 12px
      bar: 12px
      image_large: 24px
      image: 16px
      image_small: 8px
  colors: { theme: null, accent: null, link: null }
  gradients: { primary_action: null, search_bar: null, angle: 210deg }
  code_block: { scrollbar_width: 4px, highlight_theme: null }
  backgrounds:
    sidebar:
      surface: card
      color: { light: var(--card), dark: var(--card) }
      image:
      opacity: 0.8
      blur: { radius: 100px, overlay: var(--bg-a60) }
    page:
      image:
      blur: { radius: 100px, overlay: var(--bg-a75), saturation: 300% }

resources:
  preconnect: []
  fallbacks:
    avatar:
    link_card:
    cover:
    project_icon:
    banner:
    topic_cover:
    image: { content: null, tag_plugin: null }
    error_page:

extensions:
  search:
    provider: local
    providers:
      local: { scope: all, index_path: /search.json, include_content: true, lazy: true, cache_ttl: 86400, exclude: [] }
      algolia: {} # 上游参数袋
  comments:
    provider:
    title: ''
    providers: {} # providers.<provider> 为上游参数袋
  tags: {} # 已注册 Stellar tag ID
  features:
    lazy_loading: {}
    preload: {}
    lightbox: { provider: fancybox }
    reveal: { provider: scrollreveal }
    ai_summary: { provider: tianli_gpt }
    math: { provider: null }
    diagrams: { provider: mermaid }
    code_copy: {}
    adaptive_text: {}
    card_hover: {}
    cjk_typography: {}
  services:
    site_info: { endpoint: null }
    rating: { endpoint: null }
    vote: { endpoint: null }
    contributors: { edit_page: {} }
    github: { api_url: https://api.github.com, raw_url: https://raw.githubusercontent.com, gist_url: https://gist.github.com, card_url: https://github-readme-stats.vercel.app }
  cache: { enabled: true, default_ttl: 3600, ttl: {}, max_entries: 200 }

inject:
  head: |
  script: |
```

## 根域迁移

| 当前域 | 最终位置 | 结论 |
|---|---|---|
| `brand`、`menubar`、`footer` | `site` | 站点身份和 Shell 外壳 |
| `canonical`、`open_graph`、`structured_data` | `seo` | 索引与分享 |
| `site_tree` | `layout.profiles` | 页面 Profile 默认布局 |
| `article`、`notebook` | `content` | 内容类型默认值 |
| `style` | `appearance` | 视觉语义令牌 |
| `preconnect`、`default`、`style.error_page` | `resources` | 资源提示与兜底 |
| `search`、`comments`、`tag_plugins`、`plugins`、`dependencies`、`data_services`、`data_cache`、`api_host` | `extensions` | 注册式扩展、服务与缓存 |
| 站点与页面 `inject` | `inject` | 可信原文逃生口 |
| `stellar`、`system`、官方资源、派生对象 | 无公开路径 | 内部化 |
| `cache`、`language_switcher`、Hexo `inject` | 无公开路径 | 移除 |
| Hexo 配置与 Hexo Front Matter | 原路径 | 保持 Hexo 所有权 |

## 关键命名与层级

| 当前路径 | 目标路径 |
|---|---|
| `canonical.original_host` | `seo.canonical.host` |
| `canonical.official_hosts` | `seo.canonical.allowed_hosts` |
| `brand.image.style` | `site.brand.image.variant` |
| `menubar.items[].theme` | `site.menu.items[].accent` |
| `footer.social` / `footer.sitemap` | `site.footer.actions` / `site.footer.sections` |
| `site_tree.<profile>.base_dir` | `layout.profiles.<profile>.path` |
| `navigation.menu` | `navigation.active_menu` |
| `article.pin_style/card_style` | `content.article.listing.pinned_layout/card_layout` |
| `article.auto_excerpt` | `content.article.listing.excerpt_length` |
| `article.related_posts.enable/max_count` | `content.article.related_posts.enabled/limit` |
| `style.font-size/font-family` | `appearance.typography.font_size/font_family` |
| `style.border-radius` / `corner-shape` | `appearance.shape.radius` / `appearance.shape.corner` |
| `style.leftbar` / `style.site` | `appearance.backgrounds.sidebar` / `appearance.backgrounds.page` |
| `search.service` | `extensions.search.provider` |
| `comments.service/comment_title` | `extensions.comments.provider/title` |
| `data_services.<service>.api` | `extensions.services.<service>.endpoint` |
| `data_cache.enable` | `extensions.cache.enabled` |
| `api_host.*` | `extensions.services.github.*_url` |

Profile ID 固定迁移：`index_blog/index_topic/index_wiki → blog_index/topic_index/wiki_index`，`notebooks/notes → notebook_index/note_index`，`error_page → error`。

Extension ID 固定迁移：`fancybox → lightbox`、`scrollreveal → reveal`、`tianli_gpt → ai_summary`、`katex/mathjax → math`、`mermaid → diagrams`、`copycode → code_copy`、`heti → cjk_typography`；Swiper 作为内置轮播实现内部化。服务 ID 中 `siteinfo → site_info`，其余官方服务使用 snake_case 注册 ID。

逐字段的唯一动作、理由、动态记录和外部边界不在文档中复制第二份；以 `CONFIG_DOMAIN_MIGRATIONS` 为唯一机器矩阵。

> #708 运行时切片落实默认值时，根据 #704 已声明的“类型与默认值由后续纵向切片交付”校正三项占位：`indent` 使用 `null` 保留 story 自动缩进，`card_layout` 保持现有 `hero` 行为，`footer.license` 保留当前协议文本。字段路径与信息架构未改变。

## Collection 与 Front Matter

Collection 级联顺序为主题 Profile → Collection → Front Matter；数组完整替换，对象和已声明参数袋按键合并，不做类型强转。

- Collection：`routing → route`、`base_dir → path`、`tree → navigation.tree`、`note.sidebar → note_defaults.sidebar`。
- Collection/Page 评论：`comments.service → comments.provider`，第三方覆盖进入 `comments.options`。
- Front Matter：`collection.type → collection.profile`；`katex/mathjax → render.math`；`mermaid → render.diagrams`；Stellar 分享覆盖进入 `seo.open_graph`。
- Hexo `title/date/tags/categories/robots` 等保持 Hexo 所有权和原名。

Collection 目标结构（不同 profile 只允许各自适用的节点）：

```yaml
name: # required
headline:
tagline:
description:
tags: []
audience:
identity: { icon: null }
card: { cover: null, tagline: null }
hero:
  enabled:
  background: { image: null, effect: null }
  preview: { type: null, src: null, alt: null, commands: [] }
  actions: []
sidebar:
  left: { widgets: [], search: null, menu: null, brand: null, wiki_home: null }
  right: { widgets: [] }
navigation:
  menu:
  breadcrumb:
  tree: [] # Wiki only；array/object 按实际值应用替换/合并规则
article: { type: null, indent: null, author: null, ai_label: null }
footer: { references: [], license: null, share: null }
comments: { enabled: null, title: null, id: null, provider: null, options: {} }
source: { repository: null, branch: null }
route: { path: null, start: null }
listing: { priority: null, sort: null, excerpt_length: null, per_page: null, order_by: null }
note_defaults: { sidebar: {} } # Notebook only
```

Stellar Front Matter 目标结构；未列出的 Hexo 自有字段继续使用 Hexo 原名：

```yaml
collection: { profile: null, id: null }
card: { cover: null, tagline: null }
banner: { enabled: null, image: null, avatar: null, headline: null, tagline: null }
sidebar:
  left: { widgets: [], search: null, menu: null, brand: null, wiki_home: null }
  right: { widgets: [] }
navigation: { menu: null, breadcrumb: null }
article: { type: null, indent: null, author: null, ai_label: null }
footer: { references: [], license: null, share: null }
comments: { enabled: null, title: null, id: null, provider: null, options: {} }
visibility: { listed: true, searchable: true }
listing: { priority: 0 }
source: { repository: null, branch: null }
render: { math: false, diagrams: false }
seo: { open_graph: {} }
inject: { head: '', script: '' }
```

`route`、`navigation.tree` 与 `note_defaults` 只属于 Collection，不开放为页面 Front Matter。联合类型由实际值决定合并方式：数组完整替换，对象按声明键或参数袋键合并，标量完整替换。
