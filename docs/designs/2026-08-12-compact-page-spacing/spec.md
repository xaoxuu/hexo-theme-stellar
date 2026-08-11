---
title: 压缩页面顶部与侧边栏间距
date: 2026-08-12
status: 已实施
---

# 压缩页面顶部与侧边栏间距 方案

## 1. 问题与目标

- 当前桌面布局中，左右边栏卡片与正文区域距离页面顶部/底部均为 `calc(var(--gap-margin) * 2)`（32px），视觉留白偏大。
- 目标：
  1. 左右边栏上下边距网页的间距调小一半（32px → 16px）。
  2. 正文区域顶部距离网页的间距调小一半（32px → 16px）。
  3. 移动端左右边栏浮动面板距离顶部改为 `8pt`。

## 2. 技术方案

- 保持间距令牌 `--gap-margin`（16px）不变，只调整消费该令牌的布局规则，避免影响其它组件。
- 涉及文件（`source/css/`）：
  - `_components/sidebar/sidebar.styl`：`.l_left`/`.l_right` 上下 margin 由 `calc(var(--gap-margin) * 2)` 改为 `var(--gap-margin)`；同步修正 `max-height` / `.leftbar-container` 高度公式中的上下预留量。
  - `_components/layout.styl`：`.l_left` 吸顶 `top` 改为 `var(--gap-margin)`；`.l_right` 桌面 `max-height` 公式同步减半；平板（laptop）浮动面板 `top` 同步减半；移动端（mobile）浮动面板 `top` 改为 `8pt`，并新增 `.l_right` 的移动端 `top: 8pt`。
  - `_components/partial/navbar.styl`：navbar 吸顶 `top` 由 `calc(var(--gap-margin) * 2)` 改为 `var(--gap-margin)`，移动端由 `8px` 改为 `8pt` 与侧边栏对齐。
  - `_components/widgets/toc.styl`：TOC 作为右栏首个小部件时的吸顶 `top` 由 `calc(var(--gap-margin) * 2)` 改为 `var(--gap-margin)`。
  - `_components/main.styl`：`.l_main` 桌面 `padding-top` 由 `calc(var(--gap-margin) * 2)` 改为 `var(--gap-margin)`。
  - `_defines/const.styl`：右栏底部预留常量减半（`$rightbar-bottom-margin` 96px→48px）；左栏 `$leftbar-bottom-margin` 保持 32px 不变（用户确认左栏底部留白不需要调整）。
- `8pt` 为 CSS 合法单位（1pt = 1/72 inch ≈ 1.333px，8pt ≈ 10.67px），按用户原文采用。

## 3. 影响范围

- 对外行为：桌面/平板/移动端页面顶部与侧边栏留白变小；无配置项变化、无功能变化。
- 兼容性：`pt` 单位在所有现代浏览器有效；不涉及 IE8 专属语法。
- 需要同步的文档：
  - `docs/knowledge/02-布局系统/sidebar-system.md`：侧边栏间距表格与高度约束描述。
  - `docs/knowledge/VERIFICATION.md`：登记本次知识库变更。
  - 主仓库 `source/wiki/stellar/`：经检索无页面记录这些间距值，无需改动。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库核查）。
- 主工程 `npm run g` 全量构建验证。
- 按需 `npm run s` 预览首页、文章页、Wiki 页与移动端视口。
