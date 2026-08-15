---
title: 文章末尾新增标签行执行计划
date: 2026-08-15
---

# 执行计划

## 实施步骤

1. [x] `_config.yml` 新增 `article.tags: true`
2. [x] 新建 `layout/_partial/main/article/article_tags.ejs` 标签行 partial
3. [x] `layout/page.ejs` 在 `article_footer` 之前按条件渲染标签行
4. [x] 新建 `source/css/_components/partial/article-tags.styl`（复用 `tag-chip()` 胶囊样式，与标签页统一）
5. [x] 新建 `docs/designs/2026-08-15-article-tags/` 方案文档（spec / plan / checklist）
6. [x] 同步 `docs/knowledge/`（configuration / article-footer-metadata / VERIFICATION）
7. [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查
8. [x] 同步主工程 wiki（hexo-theme-stellar-docs）`advanced-settings.md` / `pages.md`

## 风险与回退

- 风险：标签名含特殊字符破坏 HTML；通过 `escape_html()` 转义输出。
- 风险：hover 背景导致布局抖动；padding + 负 margin 抵消，布局不变化。
- 回退：设置 `article.tags: false` 即可恢复原行为。
