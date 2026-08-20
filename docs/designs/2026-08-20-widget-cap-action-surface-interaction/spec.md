---
title: Widget Header Cap Action Surface 交互
date: 2026-08-20
status: 已实施
---

# Widget Header Cap Action Surface 交互方案

## 1. 问题与目标

- widget header 的 `.cap-action` 在 hover 时直接调用 `sidebar-light()`，未与 collection 共享 surface 交互令牌。
- 成功标准：glass 左栏的 cap action hover 与 collection 使用同一背景和阴影，其余几何、透明度、文字和图标反馈不变。

## 2. 技术方案

- 复用现有 `--ui-item-bg-hover` 与 `--ui-item-shadow-hover`，不新增配置、模板字段、设计令牌或 mixin。
- 将 `.cap-action:hover` 的 `sidebar-light()` 替换为 collection surface 变量；glass 自动获得半透明顶部光照和高光边，其它 surface 按现有令牌降级。
- 保留 opacity transition、accent 文字/图标、按钮内边距与圆角。

## 3. 影响范围

- 影响 widget header 中的 cap action，包括 recent RSS 和 TOC 折叠按钮的 hover 基础样式。
- TOC 右栏已有的折叠态与局部覆盖保持不变。
- 同步侧栏系统知识库、核查登记和主工程 Stellar 侧栏文档。

## 4. 验证方式

- 在主工程执行 `npm run g`。
- 执行 `python3 docs/knowledge/tools/verify.py`。
- 核对生成 CSS：cap action hover 消费 collection hover 背景/阴影令牌，不再调用 `sidebar-light()`。
