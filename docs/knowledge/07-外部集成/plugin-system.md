---
title: Extension 系统
domain: 外部集成
tags:
  - Extension
  - 条件加载
  - 构建期
---

# Extension 系统

Stellar v2 把搜索、评论、标签能力、可选功能、数据服务与缓存统一归入 `extensions`。构建期生成严格的页面 Runtime Manifest，浏览器由单一 ESM bootstrap 建立 Extension 生命周期与 request/cache 客户端。

## 配置结构

```yaml
extensions:
  search: {}
  comments: {}
  tags: {}
  features: {}
  services: {}
```

YAML 中 Stellar 自有字段统一使用 snake_case，解析后的 JavaScript 使用 camelCase。已声明对象按键合并，数组完整替换，不做类型强转；第三方 provider 参数袋保留上游字段名。

旧根 `search/comments/tag_plugins/dependencies/data_services/data_cache/plugins/api_host` 已退出运行时并由 Schema 直接拒绝。

## Feature 注册表

| ID | 默认 | 用途 |
|----|------|------|
| `lazy_loading` | 始终启用 | 图片懒加载的 `transition/auto_aspect_ratio` 行为 |
| `link_prefetch` | enabled | Flying Pages 链接预取 |
| `lightbox` | enabled | Fancybox 图片灯箱 |
| `reveal` | enabled | ScrollReveal 入场动画 |
| `math` | provider=null | KaTeX / MathJax provider |
| `diagrams` | provider=null | Mermaid 图表 |
| `card_hover` | disabled | 卡片光斑与倾斜 |
| `heti` | disabled | Heti 中文排版 |

```yaml
extensions:
  features:
    lightbox:
      enabled: true
      selector: .timenode p>img
    reveal:
      enabled: true
      distance: 8px
      duration_ms: 1000
      interval_ms: 100
      scale: 1
    card_hover:
      enabled: true
```

Fancybox 与 ScrollReveal 的实现固定；MathJax 只使用 v3。Mermaid 通过 `diagrams.provider: mermaid` 选择并使用官方样式。代码复制与自适应文字固定开启，不公开配置；AI Summary 已整体删除。

页面 Front Matter 通过 `render.math` 与 `render.diagrams` 选择内容渲染能力，不直接配置官方资源 URL。

## Tag Extension

标签插件行为位于 `extensions.tags.<tag_id>`。公开配置只注册 `note/checkbox/quot/emoji/icon/button/mark/hashtag/gallery`；Image、Timeline、OKR 与 Chat 的固定策略不再公开配置。

```yaml
extensions:
  tags:
    emoji:
      default_source: blobcat
      sources:
        blobcat: https://cdn.example/{name}.gif
    gallery:
      size: mix
      aspect_ratio: square
```

标签渲染器只读取冻结的 `hexo.stellar.config.extensions.tags`，不再访问 `theme.tag_plugins`。

## 内部资源所有权

官方 Extension 的 JS/CSS/inject、Marked、LazyLoad、评论库、数据服务脚本，以及固定 provider 与 request/cache 策略由 [internal-constants.js](../../../scripts/lib/internal-constants.js) 深度冻结登记。`extension-assets.js` 仅保留兼容导出。公开 Schema 不提供这些实现细节。

这条边界把业务配置与主题实现资源分开：升级资源版本随主题代码评审和发布，不让站点配置形成第二套依赖锁。

## 加载链

```mermaid
flowchart LR
  A[extensions.features] --> B[声明式 Schema]
  B --> C[冻结 camelCase runtime]
  C --> D[Runtime Manifest]
  D --> E[ExtensionRegistry]
  E --> F[dynamic import adapter]
  F --> G[internal asset registry]
  F --> H[mount root context]
```

`layout/_partial/scripts/runtime.ejs` 只输出 `#stellar-runtime-config` JSON 和 `/js/runtime/index.mjs`。manifest 条目含 `id/module/config/when`；`when.selector` 未命中时不会 import adapter。`ExtensionRegistry.mount(root, context)` 顺序挂载，重复 mount 先释放旧实例，`unmount(root)` 逆序清理；import、mount、unmount 失败只派发 `stellar:extension-error`，不会阻断其它 Extension。Runtime 启动失败时立即添加 `sr-fallback`，正文保持可见。

旧 `document.write`、同步 utils 补载、`_pluginQueue`、`stellar.initPlugin` 与插件恢复看门狗已删除。`utils.js` 只保留迁移期 DOM/经典资源工具，不再拥有 Extension 注册或网络缓存算法。

非首屏 SVG 占位符替换和 dropdown 浮层也使用内部 selector Extension：只有页面出现 `svg.icon[data-icon]` 或 `details.dropdown` 时，runtime 才加载 `/js/icons.js` 或 `/js/plugins/dropdown.js`。脚本通过内部 `stellar:legacy-feature-ready` 事件向 runtime 交付 `mount(root)` 适配器，不暴露新的全局 API；Extension 卸载时会中止图标请求，或断开 dropdown observer、全局监听与待执行动画帧。它们不新增公开配置，并保持原 DOM 与交互。

核心防闪烁样式在构建期按 `extensions.features.*.enabled` 条件导入；Swiper、Fancybox、Mermaid 与评论样式在 DOM 命中时按需注入。

## 服务与内部缓存

```yaml
extensions:
  services:
    site_info:
      endpoint: https://api.xaox.cc/site_info/v1?url={href}
    rating:
      endpoint: https://star-vote.xaox.cc/api/rating
    vote:
      endpoint: https://star-vote.xaox.cc/api/vote
    github:
      api_url: https://api.github.com
      raw_url: https://raw.githubusercontent.com
      gist_url: https://gist.github.com
    github_card:
      endpoint: https://github-readme-stats.vercel.app
```

Site Info、Rating 与 Vote 默认使用 xaox.cc 公共实例，可覆盖为自部署地址或以 `null` 关闭；三者的预期远程失败完全静默并保留静态兜底。GitHub 地址统一为完整 URL。Runtime Manifest 携带主题内部注入且冻结的 cache/request policy；`createRequestClient()` 提供同 method+URL 并发去重、按 service TTL、超时重试、fresh 命中、stale 失败回退、200 KiB 单条限制和最旧条目淘汰。站点不再调节这些实现常量。客户端调用原生 `fetch` 而不替换 `window.fetch` 或 XHR 原型，并以 `stellar:request-start/end` 通知锚点稳定器。

相关源码：[_config.yml](../../../_config.yml)、[scripts/schema/config-schema.js](../../../scripts/schema/config-schema.js)、[scripts/lib/internal-constants.js](../../../scripts/lib/internal-constants.js)、[scripts/lib/browser-runtime.js](../../../scripts/lib/browser-runtime.js)、[layout/_partial/scripts/runtime.ejs](../../../layout/_partial/scripts/runtime.ejs)、[source/js/runtime/index.mjs](../../../source/js/runtime/index.mjs)、[source/js/runtime/extension-registry.mjs](../../../source/js/runtime/extension-registry.mjs)、[source/js/runtime/request-cache.mjs](../../../source/js/runtime/request-cache.mjs)、[source/css/_plugins/index.styl](../../../source/css/_plugins/index.styl)。
