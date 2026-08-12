---
title: 置顶轮播区悬停翻页按钮
date: 2026-08-12
status: 已实施
---

# 置顶轮播区悬停翻页按钮 方案

## 1. 问题与目标

置顶内容轮播目前仅可通过底部圆点点击或触摸滑动切换幻灯片，缺少鼠标用户最直观的左右翻页入口。

目标：鼠标悬停到轮播区时，左右两侧出现翻页按钮，样式与 swiper 组件的导航按钮一致；点击可切换上一张/下一张。其余交互保持不变。

## 2. 技术方案

- `layout/_partial/main/pin_slider.ejs`：幻灯片多于 1 张时，在 `.pin-slider` 内渲染 `.pin-slider-nav.prev` / `.pin-slider-nav.next` 两个 `<button>`，内部通过 `icon()` helper 输出 solar 双箭头 SVG（`solar:double-alt-arrow-left/right-bold-duotone`，已定义于 `_data/icons.yml`）；`initPinSlider` 中绑定点击事件到 `prev()` / `next()`，并在清理函数中解绑。
- `source/css/_components/pin-slider.styl`：新增 `.pin-slider-nav` 样式——容器复用 navbar 玻璃效果（`bar-glass(40px)`：半透明模糊层 + 柔和阴影 + 40px 胶囊圆角），44px 高胶囊 + 上下 `1rem` 内边距、`margin-top: -2rem` 垂直定位，SVG 尺寸 1.25rem，hover 图标变主题色（`var(--theme)`）。默认 `opacity: 0`，`.pin-slider:hover` / `.pin-slider:focus-within` 时显示。

涉及文件：

- `layout/_partial/main/pin_slider.ejs`
- `source/css/_components/pin-slider.styl`
- `docs/knowledge/05-前端交互/client-side-overview.md`、`docs/knowledge/知识库全量.md`、`docs/knowledge/VERIFICATION.md`

## 3. 影响范围

- 对外行为：轮播区悬停/聚焦时显示左右翻页按钮；仅幻灯片多于 1 张时渲染，不改变单张置顶的布局；按钮无文字，视觉与 swiper 导航按钮一致。
- 兼容性：按钮为原生 `<button>`，样式不依赖 swiper 资源；未开启轮播或键盘不可用时无影响。

## 4. 验证方式

- UI 改动量小，按主题仓库规范无需自检流程；由用户通过 `npm run s` 预览验收。
