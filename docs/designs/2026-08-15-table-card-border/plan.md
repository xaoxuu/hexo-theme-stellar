---
title: 所有表格统一 wrap 同款圆角边框执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] `table.styl` 边框规则上移到 `.tag-plugin.table table` 共享层，wrap 去重
2. [x] `md-table.styl` 增加同款边框规则
3. [x] 主工程 `npm run g` 构建验证
4. [x] 无头 Chrome 计算样式抽查
5. [x] 同步 `docs/knowledge/` 与主仓库 wiki 文档

## 风险与回退

- 风险：`overflow: hidden` 对 `display: table` 的裁剪行为与 wrap 现有实现一致，无新增风险。
- 回退：移除共享边框规则即回到原有样式。
