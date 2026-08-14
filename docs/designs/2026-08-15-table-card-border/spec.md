---
title: 所有表格统一 wrap 同款圆角边框
date: 2026-08-15
status: 已实施
---

# 所有表格统一 wrap 同款圆角边框 方案

## 1. 问题与目标

- 问题：只有 `{% table style:wrap %}` 有圆角卡片边框，普通 Markdown 表格、`scroll`、`compact` 均为直角无边框，视觉不统一。
- 目标：所有内容表格（md 默认 / scroll / wrap / compact）统一使用 wrap 同款的圆角边框卡片样式。

## 2. 技术方案

- 把 `table.styl` 中 `.table-wrap` 的边框规则（`border-collapse: separate`、`border-spacing: 0`、`border: 1px solid var(--block-border)`、`border-radius: $border-card`、`overflow: hidden`、`th { border-top: none }`、单元格 `border-left` 分隔线）上移到共享的 `.tag-plugin.table table`，wrap 只保留自身特性（固定列宽、换行、padding）。
- `md-table.styl` 中 `.md-table-scroll > table:not([class])` 增加同款边框规则。
- 行分隔线、表头背景、hover 等沿用基础样式，因此所有表格呈现与 wrap 一致的视觉层次。

涉及文件：`source/css/_components/tag-plugins/table.styl`、`source/css/_components/md-table.styl`。

## 3. 影响范围

- 对外行为：md 默认、scroll、compact 表格新增圆角卡片边框；wrap 视觉不变；代码高亮表格不受影响。
- 需同步文档：`docs/knowledge/01-样式系统/typography.md`、`docs/knowledge/知识库全量.md`、`docs/knowledge/VERIFICATION.md`；主仓库 `source/wiki/stellar/tag-plugins/container.md`。

## 4. 验证方式

- 构建：主工程 `npm run g`。
- 渲染实测：无头 Chrome 检查四种样式的 `border` / `border-radius` 计算样式与 HTML 结构。
