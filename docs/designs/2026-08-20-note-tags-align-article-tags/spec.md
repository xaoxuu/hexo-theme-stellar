---
title: 笔记标签行对齐文章标签胶囊样式
date: 2026-08-20
status: 已实施
---

# 笔记标签行对齐文章标签胶囊样式方案

## 1. 问题与目标

- 笔记页正文末尾仍使用早期的 `.md-text .tag-list` 方形标签，与文章页统一后的标签胶囊样式不一致。
- 成功标准：笔记标签保持原有标签树解析与过滤页链接行为，同时与文章标签行共用容器、hashtag 图标、间距、圆角和交互反馈。

## 2. 技术方案

- 复用 `layout/_partial/main/article/article_tags.ejs` 已采用的 `article-tags` 容器、`scrollreveal(' ')`、`icon('default:hashtag')` 与 `escape_html()` 输出约定，不新增 partial 或 helper。
- 复用 `source/css/_components/partial/article-tags.styl` 的 `tag-chip()` 胶囊样式，删除 `source/css/_components/pages/notebook.styl` 中只服务旧标签行的重复规则，不新增设计令牌或样式变量。
- 保留 `notebook.tagTree.get()` 与 `pretty_url(tag.path)`，因此层级标签解析及笔记本标签过滤链接不变。
- 同步 `docs/knowledge/03-内容系统/article-footer-metadata.md`、`notebook-system.md` 与 `docs/knowledge/VERIFICATION.md`。

## 3. 影响范围

- 仅影响带 `tags` 的笔记内容页正文末尾标签行的结构与视觉表现。
- 不新增或修改配置项、语言文案、服务端脚本、客户端脚本和依赖。
- 博客文章、Wiki、笔记列表卡片及笔记本标签树行为不变。

## 4. 验证方式

- 运行 `npm run check`，覆盖 lint、单测、知识库硬事实与发版登记检查。
- 在 xaoxuu.com 主工程运行 `npm run g`，确认 Hexo 生成及 Gulp minify 通过。
- 检查生成的笔记页包含 `article-tags`、hashtag 图标及原标签过滤链接，并确认产物不再依赖 `.md-text .tag-list` 规则。
