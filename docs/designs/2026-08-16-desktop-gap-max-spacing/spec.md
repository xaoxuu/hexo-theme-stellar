---
title: 桌面侧边栏与内容区上下间距恢复为 var(--gap-max)
date: 2026-08-16
status: 已通过
---

# 桌面侧边栏与内容区上下间距恢复为 var(--gap-max) 方案

## 1. 问题与目标

- 当前桌面（PC，>667px 含平板/笔记本）左栏卡片与内容区顶部间距为 `var(--gap-margin)`（16px），右栏卡片无上下 margin，视觉留白偏小且左右不齐。
- 目标：
  1. 左栏卡片四周、右栏卡片上下与内容区顶部间距改为 `var(--gap-max)`（32px），左栏左右与上下一致。
  2. 吸顶 `top` 与高度公式同步，保持吸顶对齐与视口内高度一致。
  3. 左栏 `.header` 顶部 margin 改为与其左侧 margin 一致的 `var(--gap-margin)`，header 视觉位置不变。

## 2. 技术方案

- 保持间距令牌不变，只调整消费规则；移动端（≤667px）浮动面板 8pt/64px 规则不受影响。
- 涉及文件（`source/css/`）：
  - `_components/sidebar/sidebar.styl`：`.l_left` margin 改 `var(--gap-max)`（四周）；`.l_right` margin 改 `var(--gap-max) 0`；`.l_left .header` margin 改 `var(--gap-margin) var(--gap-margin) 0`；`.l_left` / `.leftbar-container` 高度公式改 `calc(100vh - var(--gap-max) * 2)`。
  - `_components/layout.styl`：`.l_left` 吸顶 `top` 改 `var(--gap-max)`；`.l_right` 桌面 `max-height` 改 `calc(100% - var(--gap-max) * 2)`；平板浮动右栏 `top` / `max-height` 同步改 `var(--gap-max)` / `calc(100vh - var(--gap-max) * 2)`。
  - `_components/main.styl`：`.l_main` 桌面 `padding-top` 改 `var(--gap-max)`（底部已是 `var(--gap-max)`）。
  - `_components/partial/navbar.styl`：navbar 吸顶 `top` 改 `var(--gap-max)`（移动端 8pt 覆盖不动）。
  - `_components/widgets/toc.styl`：右栏 TOC 作为首个小部件时吸顶 `top` 改 `var(--gap-max)`。
- 吸顶逻辑无需改 JS：`init.navbarPin()` 读取 `getComputedStyle(el).top` 自动兼容。

## 3. 影响范围

- 对外行为：桌面/平板侧边栏与内容区间距由 16px 变为 32px（左栏四周、右栏上下、内容区顶部）；吸顶位置同步；移动端不变（左栏 header 顶部 margin 一并改为 16px）。
- 无配置项变化、无功能变化。
- 需要同步的知识库页面：
  - `docs/knowledge/02-布局系统/sidebar-system.md`（间距表格、右栏 margin 描述、高度约束）
  - `docs/knowledge/05-前端交互/client-side-overview.md`（navbar 吸顶自动兼容值）
  - `docs/knowledge/VERIFICATION.md`（样式变更登记）

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 依赖声明检查 + 知识库硬事实核查）。
- 主工程 `npm run g` 全量构建。
- 按需 `npm run s` 预览：桌面视口首页/文章页/Wiki 页间距与吸顶对齐。
