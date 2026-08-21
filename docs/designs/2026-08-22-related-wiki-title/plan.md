---
title: Wiki Related 条目标题修复执行计划
date: 2026-08-22
---

# 执行计划

1. [x] 增加 related widget 必须使用 Wiki `name` 的回归测试。
2. [x] 修正 `related.ejs` 的条目标题字段。
3. [x] 同步主题知识库和公开 Wiki。
4. [x] 执行全量检查、主工程构建、页面审计与补丁检查。

## 风险与回退

- 风险仅限 related widget 的 Wiki 条目名称。若出现回归，回退单行字段映射即可。
