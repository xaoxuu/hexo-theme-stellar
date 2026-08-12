---
title: 分页器翻页图标改为 solar 双箭头
date: 2026-08-12
status: 已实施
---

# 分页器翻页图标改为 solar 双箭头 方案

## 1. 问题与目标

文章列表底部分页器的 prev/next 图标目前通过 `style.paginator.prev/next` 配置的 CDN 背景图渲染，与置顶轮播区翻页按钮（solar 双箭头）视觉不统一。

目标：分页器 prev/next 图标换成与置顶轮播翻页按钮同一套 solar 图标（`solar:double-alt-arrow-left-bold-duotone` / `solar:double-alt-arrow-right-bold-duotone`），并移除不再使用的背景图配置。

## 2. 技术方案

- `layout/_partial/main/post_list/paginator.ejs`、`layout/_partial/main/notebook/paginator.ejs`：`paginator()` helper 的 `prev_text` / `next_text` 直接传入 `icon('solar:double-alt-arrow-left/right-bold-duotone')` 内联 SVG，并设置 `escape: false`（Hexo `htmlTag` 默认转义文本，需关闭才能输出 SVG HTML）。
- `source/css/_components/partial/paginator.styl`：`.extend` 移除 `background-image` / `background-size` / `background-origin` / `background-clip`，改为内联 `svg` 尺寸（1.5rem × 1.5rem、block，为原 1rem 的 150%），原有边框、padding、grayscale、hover 行为不变。
- `_config.yml` 与主工程 `_config.stellar.yml`：删除 `style.paginator.prev/next`（不再被引用）。

涉及文件：

- `layout/_partial/main/post_list/paginator.ejs`
- `layout/_partial/main/notebook/paginator.ejs`
- `source/css/_components/partial/paginator.styl`
- `_config.yml`、主工程 `_config.stellar.yml`
- `docs/knowledge/VERIFICATION.md`

## 3. 影响范围

- 对外行为：分页器 prev/next 图标视觉变为 solar 双箭头（`currentColor` 跟随文字色）；`style.paginator.prev/next` 配置项移除，站点无法再自定义分页图标 URL。
- 兼容性：图标为内联 SVG，不依赖外部资源；`escape: false` 仅影响 prev/next 的文本内容（SVG），页码与省略号渲染不变。

## 4. 验证方式

- 主题仓库 `npm run check` / 主工程 `npm run g` 全量构建，检查列表页、归档页、分类/标签页、笔记页分页器图标渲染正常。
