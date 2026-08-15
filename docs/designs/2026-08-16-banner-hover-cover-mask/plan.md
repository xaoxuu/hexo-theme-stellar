---
title: banner hover 动画对齐封面 + 渐变模糊层黑色蒙版执行计划
date: 2026-08-16
---

# 执行计划

## 实施步骤

1. [x] `source/css/_components/tag-plugins/banner.styl`：修复并对齐 banner hover 动画。
2. [x] `source/css/_components/list.styl`：poster 卡片 `.cover` 新增黑色渐变蒙版，移除 cover-info 0.2 渐变。
3. [x] `source/css/_components/pin-slider.styl`：轮播文章幻灯片新增底部蒙版，移除文字区 0.2 渐变。
4. [x] `layout/_partial/main/navbar/article_banner.ejs`：插入 `banner-mask` 两个空 div。
5. [x] `source/css/_components/partial/article-banner.styl`：`.banner-mask` 样式与 `.bg+.content` 定位。
6. [x] 同步主题知识库（post-lists-cards / client-side-overview / link-grid-banner-tags / 知识库全量 / VERIFICATION）与主仓库 `source/wiki/stellar/advanced-settings.md`。

## 风险与回退

- 蒙版 `z-index` 与层级：`.cover` 中 `:after` 与 `:before` 同为 z1 时依赖 DOM 顺序，`.cover-info` z2 恒在顶层；文章页 banner 蒙版与文字同为 z1，靠 DOM 顺序保证文字在上。若层级异常，可单独提高/降低 z-index 或调整插入位置。
- 黑色蒙版若过重：回退方案为调低 0.5 系数或改用 `--blur-height` 约束渐变范围。
