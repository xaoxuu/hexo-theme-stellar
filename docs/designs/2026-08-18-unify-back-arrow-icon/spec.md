---
title: 统一返回图标
date: 2026-08-18
status: 已实施
---

# 统一返回图标方案

## 1. 问题与目标

Wiki 左栏、banner 与 about 返回入口使用了单独的返回图标，与文章列表分页上一页的视觉不一致。

目标是三处均复用 `default:arrow-left`，并移除不再使用的专用图标定义，保持原有链接和交互不变。

## 2. 技术方案

- `layout/_partial/sidebar/logo.ejs`、`scripts/tags/lib/banner.js`、`scripts/tags/lib/about.js` 统一引用 `default:arrow-left`。
- 删除 `_data/icons.yml` 中无引用的专用返回 SVG；左栏保留 `inline=true`，继续作为首屏图标内联。
- 同步图标系统、侧边栏知识库与主工程 Stellar Wiki 文档。

## 3. 影响范围

- 不新增配置项，不改变 Wiki 返回入口的显示开关、目标链接或 banner 的浏览器历史返回行为。
- 删除的图标键不再作为主题内置可覆盖项提供。

## 4. 验证方式

- 搜索确认主题与主工程 Wiki 中不存在被删除键。
- 在主工程执行 `npm run g`，并执行主题知识库硬事实核查。
