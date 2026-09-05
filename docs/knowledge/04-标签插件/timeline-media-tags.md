---
title: 时间线与媒体标签
---

# 时间线与媒体标签

本页汇总 timeline、gallery、chat、emoji、voice、video、download-file、copy 与 OKR 等标签的配置边界。标签语法仍由各自处理器定义；跨页面默认统一进入 `tags`。

## 主题默认

```yaml
tags:
  emoji:
    default_source: blobcat
    sources:
      blobcat: https://cdn.example/{name}.gif
  gallery:
    size: mix
    aspect_ratio: square
```

Emoji 使用 `default_source + sources`，每个模板必须含 `{name}`；`quot.<variant>` 是受约束的动态记录。Timeline、Chat 与 OKR 使用主题内部固定策略。

## 服务模块

timeline、voice、video 与 download-file 等动态能力使用 `.data-service` 占位。客户端模块与 Chat 自动信息端点由内部资源注册表固定，站点不能覆盖。

Voice 波形颜色不依赖全局暗色工具状态：显式 `<html data-theme="light|dark">` 优先，否则读取 `prefers-color-scheme`。组件同时监听 `stellar:color-scheme-change` 与系统偏好变化并重绘；Services Extension 卸载时会释放两类监听，已卸载的波形不再响应配色变化。

## 常用语法

- timeline：用成对标签组织时间节点。
- gallery：布局策略由主题内部维护，公开配置只用 `size` 与 `aspect_ratio` 控制媒体几何。
- emoji：provider 模板中的 `{name}` 替换为表情名。
- copy：复制成功后显示当前语言的 `message.copied`。
- OKR：`status` 参数使用主题内置状态键与当前语言翻译。

## 参考源码

- [scripts/tags/lib/](../../../scripts/tags/lib/)
- [source/css/_components/tag-plugins/](../../../source/css/_components/tag-plugins/)
- [scripts/lib/internal-constants.js](../../../scripts/lib/internal-constants.js)
- [标签插件总览](tag-plugins-overview.md)
