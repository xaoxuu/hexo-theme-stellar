---
title: 文章卡片标签 # 前缀替换为 hashtag 图标
date: 2026-08-16
status: 已通过
---

# 文章卡片标签 # 前缀替换为 hashtag 图标

## 1. 问题与目标

标签页（`/blog/tags/`）与文章页标签前缀已于 2026-08-15 统一为内联 `default:hashtag` 图标，但文章列表卡片（`post_card.ejs`）的标签仍为 `#` 字符前缀，视觉不统一。

目标：文章列表卡片标签前缀由 `#` 替换为与标签页一致的 `default:hashtag` 图标，图标随文字色变化（1em、`opacity: .4`），不改动卡片标签的纯文字布局（不引入胶囊底色）。

## 2. 技术方案

- `layout/_partial/main/post_list/post_card.ejs`：标签渲染由 `#${escape_html(tag.name)}` 改为 `${icon('default:hashtag')}${escape_html(tag.name)}`；icon 输出为受信 HTML，不转义，与同文件 calendar/category 图标用法一致。
- `source/css/_components/list.styl` 的 `.card-tags`：新增 `svg` 规则（`width/height: 1em`、`margin-right: .25em`、`opacity: .4`），与 `tag-chip()` mixin 的 svg 样式一致；该规则同时覆盖异步替换前的占位符与替换后的内联 SVG（替换后无 `icon` class，必须靠此规则控制尺寸）。
- 不改动：笔记页标签（`note_tags` 与 notebook.styl 的 `:before`）、wiki 卡片标签、标签页与文章页现有图标实现。

涉及文件：`layout/_partial/main/post_list/post_card.ejs`、`source/css/_components/list.styl`、`docs/knowledge/03-内容系统/post-lists-cards.md`、`docs/knowledge/知识库全量.md`、`VERIFICATION.md`、主工程 `source/wiki/stellar/advanced-settings.md`。

## 3. 影响范围

- 对外行为：文章卡片标签前缀由字符 `#` 变为 hashtag 图标（仅 `article.card_tags` 开启时可见）。
- 兼容性：`icon('default:hashtag')` 已存在，无配置项变化；首页、归档页、分类页、搜索页、置顶轮播均复用 `post_card.ejs`，一处改动全部生效。
- 需要同步的知识库：`03-内容系统/post-lists-cards.md`（补充卡片标签描述）、`知识库全量.md`、`VERIFICATION.md`、主工程 `source/wiki/stellar/advanced-settings.md`。

## 4. 验证方式

- 主题仓库 `python3 docs/knowledge/tools/verify.py` 硬事实核查。
- 主工程 `npm run g` 全量构建（模板/样式变更需产物确认）。
- 页面抽查：首页/归档页文章卡片标签含 hashtag 图标、无 `#` 字符；`/blog/tags/` 与文章页标签不变；卡片标签仍为纯文字（无胶囊背景）；图标异步替换后尺寸正常（1em）。
