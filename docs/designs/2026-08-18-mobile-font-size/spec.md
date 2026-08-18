---
title: 移动端基础字号优化
date: 2026-08-18
status: 已实施
---

# 统一清理字号兼容别名

## 1. 问题与目标

- 当前字号体系同时存在旧名称和新基准，组件局部覆盖不够明确。
- 收口为 `--fs-root`、`--fs-content-base`、`--fs-content` 三个动态变量；移动端 root 增加 2px，story 在页面基准上再增加 2px。

## 2. 技术方案

- `--fs-root` 作为 HTML/rem 根字号，桌面端取 `style.font-size.root`，移动端自动增加 2px。
- `--fs-content-base` 默认引用 `--fs-root`，story 内容区使用 `calc(var(--fs-root) + 2px)`。
- `--fs-content` 默认引用 `--fs-content-base`，组件可局部覆盖。
- `$fsp0..3` 重命名为 `$fs-content-0..3`；`$fs-12..15` 从页面基准派生。
- 移除 `style.font-size.body`、旧 CSS 变量和旧 Stylus 变量，不保留兼容别名。

## 3. 影响范围

- `source/css/_custom.styl`：字号令牌和响应式基准。
- `source/css/_common/html.styl`：html rem 基准。
- `source/css/_components/pages/article-story.styl` 及正文组件：跟随页面/组件动态基准。
- `_config.yml`：移除 `style.font-size.body` 默认字段。
- `docs/knowledge/01-样式系统/`、`docs/knowledge/09-高级主题/`：同步字号和配置清理说明。

## 4. 验证方式

- 主题知识库硬事实核查。
- 主工程首页、普通文章、story、Wiki、列表、侧栏、标签插件和评论区全量构建。
- 检查生成 CSS 不含旧变量或带引号的 `calc()`。
