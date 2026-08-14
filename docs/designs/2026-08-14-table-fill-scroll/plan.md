---
title: 表格宽度策略统一执行计划
date: 2026-08-14
---

# 执行计划

## 实施步骤

1. [x] 渲染实测定位：`display: block` 表格不铺满、compact 无滚动容器
2. [x] 新增 `scripts/filters/lib/md_table.js` 并在 `scripts/filters/index.js` 注册 `after_post_render`
3. [x] 新增 `source/css/_components/md-table.styl`；compact 补滚动容器与 `min-width: max-content`
4. [x] 新增 `test/md_table.test.js` 并跑 `npm run check`
5. [x] 主工程 `npm run g` 全量构建验证
6. [x] 无头 Chrome 渲染实测（窄表格铺满 / 宽表格滚动 / compact 滚动 / wrap 换行）
7. [x] 更新 `docs/knowledge/`（typography.md、知识库全量.md、VERIFICATION.md）并同步主仓库 wiki 文档

## 风险与回退

- 风险：`after_post_render` 处理整个内容片段，cheerio 重序列化可能改写实体编码；用单测覆盖实体保留。
- 回退：移除过滤器注册与 `.md-table-scroll` 样式即回到当前行为。
