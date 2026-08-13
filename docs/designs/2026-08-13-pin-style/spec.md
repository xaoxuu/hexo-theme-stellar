---
title: 置顶文章平铺样式（article.pin_style）
date: 2026-08-13
status: 已实施
---

# 置顶文章平铺样式（`article.pin_style`）方案

## 1. 问题与目标

- 新增主题配置 `article.pin_style`，默认 `carousel`（轮播，行为与现状一致）；切换为 `flat`（平铺）后，博客列表页不再渲染置顶文章轮播，置顶文章改为在首页第一页文章列表顶部按轮播同款规则排序展示。
- wiki 置顶轮播不受该配置影响。
- 成功标准：carousel 模式与现状完全一致；flat 模式无文章轮播，首页第一页顶部按轮播顺序展示全部置顶文章，且同页不重复。

## 2. 技术方案

- `_config.yml`：补全现有空的 `article.pin_style` 为 `carousel`，注释说明两种取值。
- `layout/_partial/main/navbar/nav_tabs_blog.ejs`：`theme.article.pin_style === 'flat'` 时跳过 post 类型的 `pin_slider`；`nav_tabs_wiki.ejs` 不动。
- `layout/index.ejs`：
  - 内置与 `pin_slider.ejs` 一致的置顶判定/权重逻辑（`pin` 优先、兼容 `sticky`；`false`/未设置不置顶，`true` 视作 1，数值降序，非数字视作 0），权重相同按 `site.posts` 原顺序稳定排序。
  - `pinSliderActive = is_home_first_page() && !pinFlat`，carousel 模式维持「首页第一页列表排除置顶文章」现状。
  - flat 且首页第一页：从 `site.posts` 收集全部置顶文章按权重降序渲染到列表顶部，再渲染 `page.posts` 切片中非置顶文章（按 `post.path` 去重，避免同页重复）；其它页面（归档/分类/标签/首页第二页起）不做特殊排序。
- 涉及文件：`_config.yml`、`layout/_partial/main/navbar/nav_tabs_blog.ejs`、`layout/index.ejs`、`docs/knowledge/00-总览与安装配置/configuration.md`、`docs/knowledge/VERIFICATION.md`、`docs/designs/2026-08-13-pin-style/`。

## 3. 影响范围

- 对外行为：新增配置项 `article.pin_style`；默认值不改变现状；flat 模式下文章轮播消失、首页列表靠前展示置顶文章。
- 兼容性：`article.pin_style` 未设置/为 `null` 时按默认 `carousel` 处理；`sticky` 别名与 `pin` 语义保持一致。
- 需同步的知识库页面：`docs/knowledge/00-总览与安装配置/configuration.md`（article 配置表 + 置顶内容轮播小节）；主工程 `source/wiki/stellar/advanced-settings.md`、`source/wiki/stellar/front-matter.md`。

## 4. 验证方式

- 主工程 `npm run g` 全量构建（默认 carousel 回归 + 临时 flat 配置验证）。
- 页面类型覆盖：首页第一页/第二页、分类、标签、归档、wiki 列表。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查。
