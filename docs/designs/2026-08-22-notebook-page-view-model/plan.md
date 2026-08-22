---
title: Notebook PageViewModel 执行计划
date: 2026-08-22
---

# 执行计划

1. [x] 用失败测试锁定 `buildNotebookPageViewModel()` 的同构字段、Notebook 语义和深度冻结。
2. [x] 用失败测试锁定 `generateBefore` 的严格 Notebook 归属、缺失集合错误和非 Notebook 隔离。
3. [x] 抽取 #695 模型构建器的共享能力，实现 Notebook Collection 与 Note ContentItem 投影。
4. [x] 同步 v2 架构状态、内容配置知识库、笔记本知识库与验证记录。
5. [x] 运行聚焦测试、`npm run check`、知识库核查和主工程 `npm run g`。
6. [x] 对未提交 diff 执行 Standards / Spec 双轴 code review 并处理发现。
