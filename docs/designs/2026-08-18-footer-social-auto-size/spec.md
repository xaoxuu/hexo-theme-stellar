---
title: Footer Social 自适应尺寸方案
date: 2026-08-18
status: 已实施
---

# Footer Social 自适应尺寸方案

## 1. 问题与目标

Footer Social 按钮此前按 32px 固定宽度排布，无法保留图标自身的横纵比。目标是只固定按钮高度为 32px，让宽度随内容自然计算；按钮以 4px 内边距提供留白，图标使用自身尺寸，按钮圆角统一为 8px。

## 2. 技术方案

在 `source/css/_components/sidebar/footer.styl` 中将普通 social 按钮与 dropdown 容器的 flex 基准改为 `auto`，移除固定宽度；普通按钮改为居中 `inline-flex`，仅通过 32px 高度与 4px 内边距控制尺寸，不再覆写 SVG 的宽高。

## 3. 影响范围

- 仅影响左侧栏 `theme.footer.social` 的普通链接和 dropdown 触发器尺寸。
- 不新增配置项，不改变模板、交互或图标数据。
- 同步更新 Sidebar 知识库对该尺寸规则的说明，并登记验证记录。

## 4. 验证方式

- 检查 Stylus 规则不再设置按钮或 dropdown 容器的固定宽度。
- 在主工程预览左侧栏含普通按钮、dropdown 与 spacer 的页面，确认高度、图标原始比例、换行与右侧对齐正常。
