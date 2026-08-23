---
title: 评论系统
domain: 外部集成
tags:
  - 评论
  - Artalk
  - Waline
  - Twikoo
  - Giscus
---

# 评论系统

Stellar 内置 Beaudar、Utterances、Giscus、Twikoo、Waline 与 Artalk 六种评论 provider。主题级配置位于 `extensions.comments`；Collection 与 Front Matter 使用统一的 `comments.provider/options` 覆盖。

## 主题配置

```yaml
extensions:
  comments:
    provider: giscus
    title: 快来参与讨论吧~
    providers:
      giscus:
        data-repo: owner/repo
        data-repo-id:
        data-category:
        data-category-id:
        data-mapping: pathname
        data-theme: preferred_color_scheme
      artalk:
        server: https://comments.example.com
        site: Example
```

`provider` 选择全局实现，`title` 是默认评论区标题，`providers.<provider>` 是第三方参数袋。参数袋保留上游字段名并按键合并；官方脚本、样式和注入资源由主题内部注册表提供，`js/css/src/inject` 不能作为资源覆盖入口。旧 `comments.service/comment_title/custom_css` 和 `comments.<service>` 不兼容读取。

主题级配置没有全局 `enabled`；未配置 provider 即停用。页面/Profile/Collection 可用内容作用域的 `comments.enabled` 关闭或开启既有 provider：

```yaml
comments:
  enabled: true
  title: 参与讨论
  id: stable-thread-id
  provider: giscus
  options:
    data-theme: dark
```

页面 `options` 覆盖主题激活 provider 的参数袋。数组完整替换，对象与参数袋按键合并，不做类型强转。

## 运行时模型

普通 Post 在构建期把最终评论设置投影到 `PageViewModel.render.article.comments`：

- `enabled`：provider 非空且页面未显式禁用；
- `service`：供现有评论 partial 使用的内部 provider ID；
- `title/id/pageTitle`：渲染与线程标识；
- `options`：主题 provider 参数袋与页面 `comments.options` 的合并结果。

这里的内部 `service` 不是公开 YAML 字段。Wiki、Topic 与 Notebook 也通过统一 Collection/Front Matter Schema 生成相同评论模型。

## 懒加载与线程标识

评论 partial 只接收显式 `comments` local 并输出容器。Runtime Manifest 声明 `comments` Extension，[source/js/runtime/extensions/comments.mjs](../../../source/js/runtime/extensions/comments.mjs) 在容器进入视口时加载第三方库；延迟任务支持取消并把初始化失败交给 Registry 的 `stellar:extension-error` 隔离。Artalk URL 含 `?atk_comment=<id>` 或 `#atk-comment-<id>` 时立即初始化，以完成通知链接定位。

Twikoo、Waline 与 Artalk 的线程键优先取容器 `comment_id`，缺失时使用当前 URL pathname。Beaudar、Utterances 与 Giscus 把参数袋渲染为上游脚本属性。

## Provider 说明

| Provider | 主要参数 | 加载方式 |
|----------|----------|----------|
| `beaudar` | `repo`、`issue-term`、`theme` 等 | 内部固定脚本，容器属性透传 |
| `utterances` | `repo`、`issue-term`、`theme` 等 | 内部固定脚本，容器属性透传 |
| `giscus` | `data-*` 与 `crossorigin` | 内部固定脚本，容器属性透传 |
| `twikoo` | `envId` 及 Twikoo 原生选项 | 内部资源 + `twikoo.init()` |
| `waline` | `serverURL` 及 Waline 原生选项 | 内部 ESM/CSS + `init()` |
| `artalk` | `server/site/darkMode/imageUploader` | 内部 JS/CSS + `Artalk.init()` |

Artalk、Waline 与 Twikoo 的 `imageUploader` 仍是上游业务参数，不是 Extension 资源地址。各评论系统的 Stellar 视觉覆盖位于 `source/css/comments/`，按 provider 初始化路径加载；`comments.custom_css` 已删除。

相关源码：[scripts/lib/models/index.js](../../../scripts/lib/models/index.js)、[layout/_partial/comments/](../../../layout/_partial/comments/)、[source/js/runtime/extensions/comments.mjs](../../../source/js/runtime/extensions/comments.mjs)、[scripts/lib/extension-assets.js](../../../scripts/lib/extension-assets.js)、[source/css/comments/](../../../source/css/comments/)。
