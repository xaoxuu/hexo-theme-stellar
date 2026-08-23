---
title: 时间线与媒体标签
---

# 时间线与媒体标签

本页汇总 timeline、gallery、chat、emoji、voice、video、download-file、copy 与 OKR 等标签的配置边界。标签语法仍由各自处理器定义；跨页面默认统一进入 `extensions.tags`。

## 主题默认

```yaml
extensions:
  tags:
    timeline:
      max_height: 80vh
    gallery:
      layout: grid
      size: mix
      ratio: square
    chat:
      endpoint: https://siteinfo.listentothewind.cn/api/v1
    okr:
      border: true
      status:
        in_track: {color: blue}
```

运行时分别使用 `maxHeight`、`endpoint` 等 camelCase 键。`emoji.<provider>`、`okr.status.<status>` 与 `quot.<variant>` 是明确开放的动态记录，其值仍受 Schema 约束。OKR 内置状态的标签来自语言包；自定义状态可显式提供 `label`。

## 服务模块

timeline、voice、video 与 download-file 等动态能力使用 `.data-service` 占位。客户端模块路径由 `scripts/lib/extension-assets.js` 内部注册，站点不能覆盖。标签只读取最终业务参数；例如 chat 的自动信息端点来自 `extensions.tags.chat.endpoint`。

## 常用语法

- timeline：用成对标签组织时间节点，可受 `max_height` 限制并滚动。
- gallery：`layout` 支持 `grid/flow`，`size` 与 `ratio` 控制媒体几何。
- emoji：provider 模板中的 `{name}` 替换为表情名。
- copy：复制成功后显示当前语言的 `message.copied`。
- OKR：`status` 参数必须匹配 `extensions.tags.okr.status` 中的键；内置键默认使用 `tag_plugins.okr.status.*` 翻译。

## 参考源码

- [scripts/tags/lib/](../../../scripts/tags/lib/)
- [source/css/_components/tag-plugins/](../../../source/css/_components/tag-plugins/)
- [scripts/lib/extension-assets.js](../../../scripts/lib/extension-assets.js)
- [标签插件总览](tag-plugins-overview.md)
