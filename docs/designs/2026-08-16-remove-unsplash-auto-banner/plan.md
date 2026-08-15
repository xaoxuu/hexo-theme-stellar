---
title: 移除 auto_banner 执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] 方案文档：spec.md / plan.md / checklist.md 就位
2. [x] 代码清理：删除 `article.auto_banner` 配置、删除 `post_cover.ejs`、清理 `cover/index.ejs` 注释
3. [x] 列表卡片清理：简化 `post_card.ejs`，移除 auto_cover / Unsplash 兜底
4. [x] 知识库同步：configuration.md、content-overview.md、post-lists-cards.md、知识库全量.md、VERIFICATION.md
5. [x] 主题验证：`npm run check`
6. [x] 主工程验证：`npm run g`

## 风险与回退

- 风险：删除 `post_cover.ejs` 前需确认无其他引用（已通过 `rg` 确认仅 `cover/index.ejs` 的注释引用）。
- 回退：改动保留在工作区，可通过 git 恢复；知识库改动集中在 `docs/knowledge/`，可单独还原。
