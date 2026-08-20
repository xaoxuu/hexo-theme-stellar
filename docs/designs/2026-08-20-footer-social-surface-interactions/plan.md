---
title: Footer Social 复用 Collection Surface 交互执行计划
date: 2026-08-20
---

# 执行计划

## 实施步骤

1. [x] 将 Footer Social 默认、hover 与 dropdown open 状态映射到 collection surface 令牌。
2. [x] 同步 Sidebar 知识库、核查记录与主工程 Wiki。
3. [x] 执行知识库核查、主工程构建和差异检查。

## 风险与回退

- Footer 只消费 surface 的背景与阴影令牌，不组合 collection DOM 类，避免其 padding、最小高度和内容布局覆盖现有图标按钮几何。
- dropdown 浮层菜单保留自身的 glass surface 声明，避免移动到 `body` 后丢失交互令牌。
