---
title: 修复 banner 内导航激活项玻璃模糊导致 hover 圆角丢失
date: 2026-08-16
status: 已实施
---

# 修复 banner 内导航激活项玻璃模糊导致 hover 圆角丢失

## 1. 问题与目标

- `{% banner %}` 内嵌 `{% navbar %}` 且存在激活链接（如「用于独立页面顶部」示例）时，hover 放大背景图的过程中 banner 四角圆角丢失（变直角）；无 navbar 的另两个示例（个人资料页、文章摘要卡片）正常。
- 根因：`.tag-plugin.banner .navbar a.active` 使用 `blur-effect()`（`backdrop-filter`）。backdrop-filter 出现在 `overflow: hidden` + `border-radius` + `corner-shape`（squircle）裁剪容器 `.banner` 内时，部分浏览器（Safari / 旧版 Chromium）会绕过父级圆角裁剪；静止时背景图恰好填满容器不可见，hover `scale(1.05)` 时图片溢出四角即暴露直角。与主题知识库已记录的「corner-shape + overflow:hidden 合成层裁剪与 backdrop-filter 不兼容」同一类问题。
- 成功标准：含 navbar 激活项的 banner 在 hover 放大时四角保持圆角；激活项视觉仍清晰可辨。

## 2. 技术方案

- `source/css/_components/tag-plugins/banner.styl`：`.tag-plugin.banner .navbar a.active` 移除 `blur-effect()`，改用与 `.link:hover` 一致的半透明白底 `background: rgba(white, 0.25)`，保留 `&:hover { background-color: var(--card) }` 维持原 hover 行为。
- `blur-effect()` mixin 本身及页面其他使用处（navbar、toc 等）不变。

## 3. 影响范围

- 对外行为：`{% banner %}` 内导航激活项的玻璃模糊效果移除，改为半透明白底；其余 banner 视觉（hover 缩放、亮度/饱和度、圆角裁剪）不变。
- 无新增配置项、无 API 变化。
- 需要同步的知识库页面：`docs/knowledge/04-标签插件/link-grid-banner-tags.md`，并在 `docs/knowledge/VERIFICATION.md` 登记。

## 4. 验证方式

- 主工程 `npm run g` 全量构建通过。
- 无头浏览器：容器页三个 banner 中激活链接 computed `backdrop-filter` 为 `none`、背景为半透明白；强制 `scale(1.05)` 后四角仍为圆角裁剪（图片绘制不侵入圆角裁剪区）。
- `npm run s` 人工预览：container.md 三个例子、含 `{% navbar %}` 的 banner 页面、移动端宽度。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查。
