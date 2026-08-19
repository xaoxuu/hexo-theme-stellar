---
title: Grid 集合激活态移除圆点执行计划
date: 2026-08-20
---

# 执行计划

## 实施步骤

1. [x] 在 collection 的 grid 样式作用域隐藏 active indicator。
2. [x] 为开发预览增加 active grid 条目，保留 list 对照状态。
3. [x] 同步主题知识库、核查记录与主工程 Wiki 行为说明。
4. [x] 运行知识库核查和主工程全量构建，记录结果。

## 风险与回退

- grid 仍输出 indicator DOM，仅由布局样式隐藏；若需回退，删除 grid 作用域中的 `display: none` 即可恢复原视觉。
