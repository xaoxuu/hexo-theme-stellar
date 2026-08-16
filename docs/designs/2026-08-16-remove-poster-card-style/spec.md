---
title: 移除 poster 配置，统一文章卡片文字封面样式
date: 2026-08-16
status: 已通过
---

# 移除 poster 配置，统一文章卡片文字封面样式

## 1. 问题与目标

- 文章卡片的全图文字封面目前由 front-matter `poster`（headline/topic/caption）逐篇控制，配置分散且语义重复（headline 多数时候等于 title）。
- 目标：删除 `poster` 相关配置，改为全局配置 `article.card_style`（`hero` / `classic`）统一控制卡片样式；hero 卡片在有 cover 时渲染「标题 + 单行小字」，文字区固定底部。

成功标准（可验收的行为）：

- `article.card_style: hero`（默认）时，有 cover 的文章卡片为全图文字封面：标题取 `title`，小字取 `subtitle` > `description`，只显示一行；文字区固定 `bottom`，无 top 布局，无 topic 小字。
- `article.card_style: classic` 时，全部文章使用普通卡片（封面/标题/摘要/meta），与原默认卡片一致。
- 置顶轮播同步去掉 `poster` 回退：标题取 `title`，小字取 `subtitle` > `description` > excerpt（截断 50 字）。

## 2. 技术方案

- `_config.yml`：`article` 段新增 `card_style: hero`，注释说明 `hero` / `classic`。
- `layout/_partial/main/post_list/post_card.ejs`：删除 `post.poster` 读取；`div()` 判定改为「`card_style == 'hero'` 且有封面」；`div_photo()` 固定 `position="bottom"`，headline 取 `post.title`（无标题回退日期），caption 取 `post.subtitle` → `post.description`（非空才渲染），不再输出 topic；`div_default()` 不变。
- `layout/index.ejs`：`layout_post_card()` 的 `photo` 类判定由 `post.poster != undefined` 改为 `theme.article.card_style == 'hero'`（仍需 `post.cover`）。
- `layout/_partial/main/pin_slider.ejs`：headline 取 `post.title`；小字取 `post.subtitle` → `post.description` → excerpt（截断 50 字）。
- 小字取值抽成通用纯函数 + helper（`scripts/lib/subtitle.js` + `scripts/helpers/subtitle.js`）：`subtitle(post)` 返回 `post.subtitle` → `post.description` → `excerpt || content` 去 HTML、压缩空白、截断 50 字（省略号由 CSS 单行处理），hero 卡片与置顶轮播共用，并配套 `test/subtitle.test.js` 单测。
- `source/css/_components/list.styl`：删除 `.cover` / `.cover-info` 的 `[position=top]` 规则；`.cover-info` 固定 `bottom`；`.cover-info .caption` 增加单行省略（`white-space: nowrap` + `overflow: hidden` + `text-overflow: ellipsis`）；`.text.topic` 样式保留（专栏最新文章卡片仍使用）。

## 3. 影响范围

- 对外行为：移除 front-matter `poster.topic/headline/caption` 支持；新增 `article.card_style` 配置（默认 `hero`）与文章 `subtitle` 字段；hero 卡片不再有 top 布局与 topic 小字，caption 单行显示。
- `{% posters %}` 友链海报标签、wiki 卡片、专栏最新文章卡片不受影响。
- 需要同步的知识库页面：`docs/knowledge/00-总览与安装配置/configuration.md`、`03-内容系统/post-lists-cards.md`、`05-前端交互/client-side-overview.md`、`知识库全量.md`，并在 `docs/knowledge/VERIFICATION.md` 登记。
- 主仓库侧：`_config.stellar.yml` 启用 `card_style: hero`；清理旧 poster front-matter；同步 `source/wiki/stellar/` 文档与 `docs/specs/remove-poster-card-style/`。

## 4. 验证方式

- 主工程 `npm run g` 全量构建通过（模板改动可发现 EJS 渲染错误）。
- `npm run s` 预览：首页 hero 卡片（bottom 文字区、标题 + 单行小字）、无 cover 文章 classic 卡片、置顶轮播、专栏/归档/标签页、文章页 banner 不受影响；移动端单行省略与文字自适应颜色正常。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查。
- `rg -n "poster" source/` 确认主仓库内容无 poster 残留（`{% posters %}` 标签与历史文档除外）。
