---
title: 文章卡片标签 hashtag 图标执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] `post_card.ejs` 标签前缀由 `#` 改为 `icon('default:hashtag')`。
2. [x] `list.styl` 的 `.card-tags` 新增 svg 规则（1em、`margin-right`、`opacity: .4`），与 `tag-chip()` 一致。
3. [x] 同步知识库 `post-lists-cards.md`、`知识库全量.md`、`VERIFICATION.md` 与主工程 `source/wiki/stellar/advanced-settings.md`。
4. [x] 验证：`verify.py`、主工程 `npm run g`、产物抽查。

## 风险与回退

- 图标替换依赖客户端 `/js/icons.js` 异步加载 `js/icons/default.json`，与标签页/文章页同一机制，无新增风险；加载失败时占位符为空 svg，可通过恢复模板 `#` 回退。
- `.card-tags svg` 规则仅作用于卡片标签容器，不影响其他图标；如需恢复 `#` 前缀，回退模板与样式即可。
