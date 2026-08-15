---
title: 标签页与文章页标签 # 前缀替换为 solar:hashtag-bold-duotone
date: 2026-08-15
status: 已实施
---

# 标签 # 前缀替换为 Solar hashtag 图标方案

## 1. 问题与目标

标签页（`/blog/tags/`）与文章页（`layout: post` 正文后标签行）的标签胶囊前缀 `#` 由 CSS `:before { content: "#" }` 提供，与主题 Solar 图标体系不统一。

目标：两处前缀替换为内联 `solar:hashtag-outline` 图标（填充型、无方框，全实色无 duotone 淡出），图标随文字色变化（默认半透明，hover 主题色），与标签页/文章页共用同一套 `tag-chip()` 样式。

## 2. 技术方案

- `layout/tags.ejs`：标签链接内、标签名前插入 `<%- icon('solar:hashtag-outline') %>`。
- `layout/_partial/main/article/article_tags.ejs`：`<a class="tag">` 内先输出 `icon('solar:hashtag-outline')` 再输出标签名。
- `_data/icons.yml`：新增 `solar:hashtag-outline` 键（Iconify 当前版）。
- `source/css/_defines/func.styl` 的 `tag-chip()` mixin：删除 `&:before { content: "#" }` 块，改为 `.tag svg` 样式（`width/height: 1em`、`margin-right: .25em`、`opacity: .4`），hover 时 `svg` 变主题色且不透明。
- 不改动：笔记页 `note_tags`（`.md-text .tag-list a.tag:before`）、文章卡片 `post_card.ejs`（`#${tag.name}`）仍保留 `#`。

涉及文件：`layout/tags.ejs`、`layout/_partial/main/article/article_tags.ejs`、`source/css/_defines/func.styl`、`docs/knowledge/03-内容系统/article-footer-metadata.md`、`VERIFICATION.md`。

## 3. 影响范围

- 对外行为：标签页与文章页标签胶囊前缀由字符 `#` 变为 Solar hashtag 图标；图标 `currentColor` 跟随文字色。
- 兼容性：`tag-chip()` 仅被标签页与文章页复用，笔记页/卡片标签不受影响；无配置项变化。
- 需要同步的知识库：`03-内容系统/article-footer-metadata.md`、`知识库全量.md`、`VERIFICATION.md`。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库硬事实核查）。
- 主工程 `npm run g` 全量构建（模板/样式变更需产物确认）。
- 页面抽查：`/blog/tags/` 标签胶囊含 hashtag 图标；文章页标签行含 hashtag 图标；笔记页/文章卡片 `#` 不变。
