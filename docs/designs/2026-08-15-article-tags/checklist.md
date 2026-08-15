---
title: 文章末尾新增标签行检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [x] `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（行号/版本异常 0；未解析文件与配置键为存量报告项，与本次无关）
- [x] 页面类型覆盖：带标签文章页（标签行 + 链接）/ 无标签文章页 / wiki、笔记页（不渲染）——局部渲染冒烟验证输出结构，`page.ejs` 条件分支代码审查确认
- [x] 配置 `article.tags: false` 时不渲染（`page.ejs` 条件 `theme.article.tags` 审查确认）
- [x] EJS 语法编译检查通过（`article_tags.ejs` / `page.ejs` / `article_footer.ejs`）
- [x] 本次无 `scripts/` / `source/js/` / `languages/` 改动，按仓库门禁不强制 `npm run g`

## 文档同步

- [x] `docs/designs/2026-08-15-article-tags/` 方案文档已建立
- [x] `docs/knowledge/00-总览与安装配置/configuration.md` 已更新
- [x] `docs/knowledge/03-内容系统/article-footer-metadata.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 wiki（hexo-theme-stellar-docs）`advanced-settings.md`、`pages.md` 已同步
