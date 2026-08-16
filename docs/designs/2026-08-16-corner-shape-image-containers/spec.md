---
title: 轮播区/文章封面/banner 图片跟随连续曲率圆角配置
date: 2026-08-16
status: 已实施
---

# 图片容器跟随连续曲率圆角 方案

## 1. 问题与目标

全局 `* { corner-shape: $corner-shape }`（默认 `superellipse(1.25)`）只作用于元素自身背景/边框绘制，不作用于子内容裁剪：

- 文章封面 `.post-card`、页顶横幅 `.article.banner` 上的 `clip-path: inset(0 round $border-card-l)`（Safari 模糊层方角兜底）把图片角落硬裁为普通圆角，corner-shape 完全不生效；
- 轮播 `.pin-slider` 与 `{% banner %}` 依赖 `overflow: hidden`，Chromium 不把 corner-shape 传递给子内容裁剪，图片角落仍为普通圆角；
- 给 `<img>` 自身加 `border-radius + corner-shape` 在 Chromium 中会整图消失/过度裁剪，不可作为修复手段（Chrome 151 实测）。

成功标准：在支持 corner-shape 的 Chromium 中，轮播区、文章封面（hero）、页顶横幅与 `{% banner %}` 的图片角落与其它元素一致地应用配置曲率；Safari/Firefox 维持普通圆角回退；hover 变暗/放大等既有行为不回归。

## 2. 技术方案

把图片 URL 同时作为**容器自身背景**承载（`background-image: var(--cover-url / --bg-url / --pin-cover-url)`），容器自身的 corner-shape 绘制即作用于图片角落；子图保留以维持 hover 滤镜与放大动画，角落楔形区由容器背景（同图）无缝补位。

### 2.1 文章封面（hero）

- `layout/index.ejs`：hero 卡片（`layout == 'post' && cover && card_style == 'hero'`）在 `.post-card` 内联 `--cover-url`（沿用 `post_card.ejs` 的转义规则）。
- `source/css/_components/list.styl`：`.post-list .post-card` 增加 `background-image: var(--cover-url)` + cover 定位；`clip-path: inset(0 round $border-card-l)` 用 `@supports not (corner-shape: superellipse(1))` 守卫（Chromium 移除、Safari/Firefox 保留）。
- 专栏最新文章卡片 `.post-list.topic .post-card .cover`（`latest_post_card.ejs` 已有内联 `--cover-url`）同样改为自身背景承载 + clip-path 守卫。
- 经典布局 `.post-cover`（顶部封面 + 正文）保持子图结构：顶部封面角落受 Chromium 子内容裁剪限制仍为普通圆角，属已知边界（站点使用 hero 布局）。

### 2.2 页顶横幅

`source/css/_components/partial/article-banner.styl`：`.article.banner` 增加 `background-image: var(--bg-url)`（模板已内联 `--bg-url`）；主 `clip-path` 与模糊伪元素 `clip-path` 均加 `@supports not (corner-shape: superellipse(1))` 守卫。

### 2.3 `{% banner %}` 标签

`source/css/_components/tag-plugins/banner.styl`：`.tag-plugin.banner` 增加 `background-image: var(--bg-url)`（标签脚本已内联 `--bg-url`）；该容器无 clip-path，无需守卫；移动端 `.banner.top` 圆角归零逻辑不变。

### 2.4 轮播

- `layout/_partial/main/pin_slider.ejs`：`initPinSlider()` 在初始化与 `goTo()` 时把当前幻灯片的内联 `--pin-cover-url` 同步到 `.pin-slider` 自身。
- `source/css/_components/pin-slider.styl`：`.pin-slider` 增加 `background-image: var(--pin-cover-url)` + cover 定位；`.pin-slide:not(.no-cover)` 背景改透明，让容器自身背景在角落楔形区透出；无封面幻灯片维持白卡。

## 3. 影响范围

- 仅样式与模板，无配置项、无脚本依赖、无新依赖。
- Chromium 139+：图片角落随容器自身背景应用 `corner-shape`（当前 Chrome 对 `superellipse(1.25)` 渲染本身较细微，目标为与其它元素一致）；Safari/Firefox 保持普通圆角。
- hover 行为（封面放大、变暗、模糊层）不变；`.post-card` 计算样式在 Chromium 下 `clip-path` 为 `none`。
- 需同步知识库：`docs/knowledge/01-样式系统/`（corner-shape 说明）、`docs/knowledge/04-标签插件/link-grid-banner-tags.md`（banner 圆角裁剪说明）、`docs/knowledge/VERIFICATION.md`。

## 4. 验证方式

- 主工程 `npm run g` 全量构建通过。
- Chrome 151 本地预览：轮播/hero 封面/文章横幅/`{% banner %}` 四角与其它 corner-shape 元素一致；DevTools 确认 Chromium 下相关 `clip-path` 为 `none`、容器 `background-image` 生效。
- 回归：轮播滑动/自动播放/箭头、hero hover 放大与模糊层、横幅文字自适应、移动端 `.banner.top` 圆角归零、无封面白卡。
