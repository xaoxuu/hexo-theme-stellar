---
title: 文章末尾新增标签行方案
date: 2026-08-15
status: 已实施
---

# 文章末尾新增标签行方案

## 1. 问题与目标

- 博客文章页正文结束后只有 `article-footer`，正文中未展示本文标签，阅读完文章后无法直接跳转到对应标签页。
- 目标：在 `layout: post` 文章页正文结束后、`article-footer` 之前新增一行标签链接，点击进入对应 Hexo 标签页；默认开启，可通过配置关闭。
- 成功标准：带标签的文章页在 `article-footer` 前显示一行标签胶囊（复用 `tag-chip()`，hover 高亮）；无标签或配置关闭时不渲染；wiki / 笔记页不受影响。

## 2. 技术方案

- `_config.yml` 的 `article:` 下新增 `tags: true`（默认开启）。
- 新建 `layout/_partial/main/article/article_tags.ejs`：`page.tags` 非空时输出 `<div class="article-tags">`，逐个渲染 `<a class="tag" href="${pretty_url(tag.path)}">${escape_html(tag.name)}</a>`，`#` 前缀由 CSS `:before` 提供（与笔记标签、标签页 UI 一致）；无标签时输出空字符串。
- `layout/page.ejs`：在 `layout === 'post'` 且 `theme.article.tags` 时，于 `article_footer` partial 之前渲染 `article_tags` partial。
- 新建 `source/css/_components/partial/article-tags.styl`：容器 flex 换行、`justify-content: center` 居中、`margin: 2rem -0.5rem 0`；标签复用 [source/css/_defines/func.styl](../../../source/css/_defines/func.styl) 的 `tag-chip()` mixin（胶囊 `border-radius: 999px`、`var(--block)` 底色、`#` 前缀、hover 时 `var(--text)` + `var(--block-border)`），与标签页胶囊样式统一；间距由容器负外边距抵消。
- 涉及文件：`_config.yml`、`layout/page.ejs`、`layout/_partial/main/article/article_tags.ejs`（新增）、`source/css/_components/partial/article-tags.styl`（新增）、`docs/knowledge/`、`docs/designs/2026-08-15-article-tags/`。

## 3. 影响范围

- 对外行为：主题升级后博客文章页默认显示本文标签行；站点可设 `article.tags: false` 关闭。
- 兼容性：纯模板与样式改动，无 `scripts/` / `source/js/` / `languages/` 改动；标签链接使用 Hexo 标准 `tag.path`。
- 需要同步的知识库页面：`00-总览与安装配置/configuration.md`、`03-内容系统/article-footer-metadata.md`、`VERIFICATION.md`。

## 4. 验证方式

- 带标签文章页渲染出标签行且链接指向对应标签页；无标签文章不渲染。
- `article.tags: false` 时不渲染；wiki / 笔记 / 自定义页不受影响。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查通过（知识库有改动必跑）。
