---
title: 标签 # 前缀替换执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] `layout/tags.ejs` 标签链接内插入 `icon('solar:hashtag-outline')`（icons.yml 新增该键）。
2. [x] `article_tags.ejs` 标签链接内插入同一图标。
3. [x] `func.styl` 的 `tag-chip()`：移除 `:before content:"#"`，改为 `.tag svg` 样式与 hover 主题色。
4. [x] 同步知识库 `article-footer-metadata.md`、`知识库全量.md`、`VERIFICATION.md`。
5. [x] 验证：`npm run check`、主工程 `npm run g`、产物抽查。

## 风险与回退

- `tag-chip()` 影响面：仅标签页与文章页复用，已确认；如需恢复 `#` 前缀可回退 mixin 的 `:before` 并移除模板内图标。
- 图标尺寸/对齐：`.tag svg` 固定 1em + `margin-right`，与 `$fs-13` 文字基线对齐由 `inline-flex align-items: center` 保证。
