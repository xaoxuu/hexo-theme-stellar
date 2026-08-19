---
title: Grid 集合激活态移除圆点
date: 2026-08-20
status: 已实施
---

# Grid 集合激活态移除圆点方案

## 1. 问题与目标

- collection 的 list 与 grid 布局共用 active 指示圆点；网格卡片已有完整背景高亮，右侧圆点造成重复表达。
- 成功标准：所有 `data-layout="grid"` 集合隐藏 active 圆点，同时保留激活背景、文字、图标与 `aria-current`；list 圆点不变。

## 2. 技术方案

- 复用现有 `data-layout`、`.ui-collection__indicator` 和 surface active 令牌，不新增配置、变量、mixin 或模板接口。
- 在 grid 样式作用域隐藏 indicator；模板继续输出相同 DOM，避免改变 collection item 的渲染契约。
- 在 collection 开发预览中为一个 grid 条目设置 active，稳定覆盖该视觉状态。

## 3. 影响范围

- 影响所有 collection grid variant；list、TOC/search adapter 及非 collection 组件不受影响。
- 同步 `docs/knowledge/06-数据服务与组件/widget-architecture.md`、`docs/knowledge/VERIFICATION.md` 与主工程 Stellar Wiki。

## 4. 验证方式

- 运行知识库硬事实核查与主工程全量构建。
- 检查开发预览和实际 grid linklist 的激活态；对照 list 激活圆点未变化。
