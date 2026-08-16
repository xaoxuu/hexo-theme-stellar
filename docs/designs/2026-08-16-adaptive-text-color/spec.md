---
title: 文字自适应颜色通用能力
date: 2026-08-16
status: 已实施
---

# 文字自适应颜色通用能力

## 1. 问题与目标

- 背景图/背景色上方的文字目前硬编码为白色（`--text-banner: white`），在亮色背景上可读性与视觉协调性不足。
- 目标：封装可复用的“文字自适应颜色”能力，并按需接入现有背景图场景。
- 成功标准：
- 样式1（contrast）：背景偏暗 → 白色文字；背景偏亮 → 深色文字。
- 样式2（theme）：取背景图平均色为基色，背景偏暗 → 平均色 lighten 到高亮度；背景偏亮 → 平均色 darken 到低亮度（保留色相/饱和度）。
- 封面卡片（`.cover-info`）、页顶 banner、`{% banner %}` 标签接入后使用 `split` 模式：**大字（标题/headline）用 contrast，小字（caption/subtitle/面包屑/导航等）用 theme**；明暗判定默认阈值 0.6，偏向采纳浅色文字；不再提供 `poster.color` / `banner_info.color` 显式文字颜色设置，文字颜色一律自适应。

## 2. 技术方案

- `source/js/color.js`：纯函数颜色工具，挂载 `window.stellar.color`。提供 `parse`、`luminance`、`isDark`、`withLightness`、`lighten`、`darken`、`adaptiveTextColor`、`getAverageColor`（背景图平均色，等比缩至最长边 ≤64px 后 canvas 取 RGB 均值，按 URL 缓存；CORS/解码失败返回 `null`）。
- `source/js/plugins/adaptive-text.js`：DOM 插件，扫描 `[data-text-adaptive]`（属性值 `split` / `theme` 默认 / `contrast`），解析背景来源 `--cover-url` → `--bg-url` → `background-image` → `background-color`（透明跳过），计算后写入内联 `--text-banner` 与 `--text-banner-theme`（`split` 时大字 contrast、小字 theme，其余模式两变量同色）；已有内联 `--text-banner` 或内联 `color` 时跳过（用户覆盖优先）。
- `layout/_plugins/adaptive_text.ejs` + `_config.yml` 新增 `plugins.adaptive_text.enable: true`：按 on-demand 模式，页面存在目标元素才懒加载 `color.js` 与插件。
- 接入点：`post_card.ejs`（photo 封面）、`latest_post_card.ejs` 的 `.cover-info`；`pin_slider.ejs` 的 `.pin-slide-text`（post 幻灯片，仅封面存在时）/ `.pin-slide-info`（wiki 幻灯片）；`article_banner.ejs` 的 `.content`（仅 banner 有图时）；`scripts/tags/lib/banner.js` 的 `.content`。均使用 `data-text-adaptive="split"`。
- 样式：`list.styl` 的 `.topic` / `.caption`、`article-banner.styl` 的 `.subtitle` / `.reading` / `.meta-row`、`bread-nav.styl` 的面包屑、`tag-plugins/banner.styl` 的 `.subtitle` / `.navbar .link` / `.back` 图标改用 `var(--text-banner-theme, …)`（小字 theme）；标题/头像描边沿用 `var(--text-banner)`（大字 contrast）；默认仍为 `white`，JS 未运行或失败时回退一致。
- 默认值：亮度阈值 0.6（偏向浅色文字）；样式1 浅色背景文字 `#111111`；样式2 深色背景目标明度 0.85、浅色背景目标明度 0.3。

## 3. 影响范围

- 对外行为：photo 封面卡片、专栏最新文章卡片、页顶 banner、`{% banner %}` 的大字为黑白对比（contrast）、小字为背景图平均色变体（theme）；移除 `poster.color` / `banner_info.color` 显式文字颜色设置。
- 新配置项：`plugins.adaptive_text.enable`（默认 `true`）。
- 新增浏览器 JS（`stellar.color`）与懒加载插件；置顶轮播（pin-slider）同步接入（大字 headline/title contrast、小字 caption/chip/excerpt theme），无封面幻灯片保持普通文章文字颜色。
- 需要同步的知识库页面：`03-内容系统/post-lists-cards.md`、`content-overview.md`、`04-标签插件/link-grid-banner-tags.md`、`05-前端交互/client-side-overview.md`、`00-总览与安装配置/configuration.md`、`知识库全量.md`、`VERIFICATION.md`；主仓库 `docs/specs/adaptive-text-color/` 与 `source/wiki/stellar/` 相关页面。

## 4. 验证方式

- 单测 `test/color.test.js`（node:vm 加载浏览器脚本）：parse / luminance / isDark / lighten / darken / adaptiveTextColor 两种样式。
- 主工程 `npm run g` 全量构建（涉及 `scripts/tags/lib/banner.js`）。
- `npm run check`（lint + 单测 + 依赖声明 + 知识库核查）。
- 手动预览：亮/暗封面、页顶 banner、`{% banner %}`、无目标元素页面不加载脚本。
