---
title: loading 自包含化（内联 SVG + --icon-loading CSS 变量，颜色跟随主题色）
date: 2026-08-17
status: 已通过
---

# loading 自包含化 方案

## 1. 问题与目标

- 上一轮统一后的 `default:loading` 仍是外部 URL（api.iconify.design），占位依赖 CDN 可用性（未 preconnect、被墙/挂掉时空白），且颜色写死为青色 `#1cd0fd`。
- 成功标准：icons.yml 存三圆点内联 SVG（`fill="currentColor"`，随上下文主题色）；head.ejs 生成 `--icon-loading` CSS 变量，`.lazy-icon` 背景统一走变量；所有消费方去掉内联 style；每页只出现一份 data URI，占位离线可用、无外部请求。

## 2. 技术方案

- 图标值：`_data/icons.yml` 的 `default:loading` 改为内联 SVG（3 个 circle `fill="currentColor"`，SMIL 动画）；移除 `default.loading` 配置入口，loading 图标仅由 icons.yml 提供。
- CSS 变量桥接：`layout/_partial/head.ejs` 的 `iconCssVars` 新增 `--icon-loading`：由 `icons['default:loading']` 内联 SVG 经 `encodeURIComponent` 生成 data URI。
- 样式：`lazyload.styl` 的 `.lazy-icon` 基础规则用 `svg-mask-icon(var(--icon-loading, url("…cyan URL")))` 蒙版 + `background-color: var(--theme)` 上色（变量缺失回退旧 URL）；颜色跟随主题色，避免 `currentColor` 在 SVG-as-image（Safari）退化黑色。
- 消费方去内联：6 个标签插件、6 个评论 layout、`utils.onLoading`、`wrapLazyloadImages` 的 `.lazy-icon` 去掉内联 `background-image`；`defines.ejs` 移除 `def.loading`。
- 涉及模块：`_data/`、`_config.yml`、`layout/_partial/head.ejs`、`layout/_partial/scripts/{defines,lazyload}.ejs`、`layout/_partial/comments/*/layout.ejs`、`scripts/tags/lib/`、`source/js/utils.js`、`source/css/_plugins/lazyload.styl`、`docs/`。

## 3. 影响范围

- 对外行为：加载占位颜色从固定青色变为主题色（`var(--theme)`），深浅色自适应；占位不再依赖外部 CDN；`{% icon default:loading %}` 从 `<img>`（URL）变为内联 SVG 图标。
- 兼容性：无配置覆盖项；`--icon-loading` 缺失时回退旧青色外部 URL（仅防御路径）。
- 需要同步的知识库：`docs/knowledge/04-标签插件/icon-tag.md`、`docs/knowledge/00-总览与安装配置/configuration.md`、`docs/knowledge/VERIFICATION.md`。

## 4. 验证方式

- `npm run check`（lint + 单测 + icons 键完整性）。
- 主工程 `npm run g` 全量构建；核对 `<head>` 的 `--icon-loading`、`.lazy-icon` 无内联背景、`def.loading` 移除、`js/icons/default.json` 含 `default:loading`。
- 浏览器目验：各占位场景显示当前文字色三圆点，无 api.iconify.design 请求。
