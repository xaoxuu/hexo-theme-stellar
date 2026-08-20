---
title: Markdown Widget Collection 默认背景
date: 2026-08-20
status: 已实施
---

# Markdown Widget Collection 默认背景方案

## 1. 问题与目标

- 通用 collection 条目默认透明，但 markdown widget 会把 linklist 与说明文字组合在同一内容区，透明条目缺少必要的分组层次。
- 成功标准：`.widget-wrapper.markdown` 内的 collection 条目默认显示背景；glass surface 使用 `var(--bg-a10)`，其它 surface 使用 `var(--block)`，交互态与布局保持不变。

## 2. 技术方案

- 复用现有 `data-ui-surface` 与 `--ui-item-bg`，不新增配置、模板字段或公共设计令牌。
- 在 widget 样式中仅为 markdown widget 覆盖 `--ui-item-bg`：默认回退 `var(--block)`，glass surface 改为 `var(--bg-a10)`。
- 不修改 collection 的全局默认、hover/active 背景、阴影、图标反馈、density、layout 或 variant。

## 3. 影响范围

- 影响 markdown widget 中所有 collection 布局和变体，包括内嵌 linklist；普通 linklist、recent、related、tree 等 widget 不受影响。
- 同步组件架构、侧栏系统知识库、核查登记与主工程 Stellar Widget 文档。

## 4. 验证方式

- 在主工程执行 `npm run g`，确认 Stylus 编译和站点生成通过。
- 执行 `python3 docs/knowledge/tools/verify.py`。
- 核对生成样式：markdown widget 在 glass surface 下默认使用 `var(--bg-a10)`，其它 surface 使用 `var(--block)`；普通 collection 仍默认透明。
