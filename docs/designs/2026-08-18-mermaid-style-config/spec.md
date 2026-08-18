---
title: Mermaid 样式配置修复
date: 2026-08-18
status: 已实施
---

# Mermaid 样式配置修复

## 1. 问题与目标

- 修复 #693 中 `style_optimization` 配置不生效的问题。
- 保持历史行为：`true` 使用 Stellar 自定义样式，`false` 使用 Mermaid 官方主题。
- 修复 Stellar 自定义样式下节点文字、边标签和箭头文字不可读的问题。

## 2. 技术方案

- Mermaid 插件仅在 `conf.style_optimization === true` 时按需加载 Stellar CSS。
- 移除无条件的 `themeVariables.darkMode`，让 Mermaid 的 `theme` 和主题明暗模式选择正常工作。
- 收窄 Mermaid SVG 选择器，并使用 Stellar CSS 变量统一处理文字、节点和边标签的对比度。
- 同步主题配置、知识库和主站 Wiki 说明。

## 3. 影响范围

- 影响启用 Mermaid 的页面；未启用 Mermaid 的页面不变。
- 旧配置键继续保留，不新增迁移要求。
- 涉及 `layout/_plugins/mermaid.ejs`、`source/css/plugins/mermaid.styl`、配置与 Mermaid 文档。

## 4. 验证方式

- 检查官方样式与 Stellar 样式两种模式。
- 检查浅色、深色、自动主题，以及 flowchart、subgraph、sequence、gantt 和 tabs 场景。
- 执行主题 `npm run check`、知识库核查和主工程 `npm run g`。
