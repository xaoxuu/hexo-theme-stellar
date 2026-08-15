---
title: Navbar 未吸顶卡片样式、吸顶恢复玻璃
date: 2026-08-15
status: 已实施
---

# Navbar 背景条状态切换方案

## 1. 问题与目标

- 列表页 `.navbar.top` 的背景条（`.navbar-blur`）需要随吸顶状态切换观感：未吸顶时与文章卡片一致（`var(--card)` 底色 + `$boxshadow-card` 阴影），吸顶后保持原有的玻璃效果（`bar-glass()`）。
- 用户反馈渐显玻璃效果不佳，调整为只在未吸顶时改变样式，吸顶后与之前一致。

## 2. 技术方案

- `source/css/_components/partial/navbar.styl`：`.navbar-blur` 基础态改为卡片样式（`background: var(--card)` + `box-shadow: $boxshadow-card`，保留 `$border-bar-container` 圆角与 `corner-shape`），`&.pinned` 时调用 `bar-glass()` 并置 `background: transparent`（玻璃伪元素与 `newblur()` 阴影按特异性覆盖卡片样式）；`trans1: all` 提供 0.2s 平滑切换。
- `source/js/main.js`：`init.navbarPin()`（在 `stellar.initPage()` 注册）对每个 `.navbar.top` 用 `offsetTop` 链求自然文档顶部，减去 `getComputedStyle(el).top`（自动兼容桌面 `var(--n)` 与移动端 `8pt`）得到吸顶起点 `pinStart`，在 `scrollY >= pinStart` 时切换 `.navbar-blur.pinned` 类；rAF 节流监听 scroll，resize/pageshow 重算，初始化立即执行一次（兼容恢复滚动位置）。

## 3. 影响范围

- 对外行为：列表页（博客/专栏/Wiki 首页、分类、标签、归档）navbar top 未吸顶时为卡片样式，吸顶后恢复原有玻璃效果；内容页无 `.navbar.top`，不受影响；`.float-panel` 仍使用 `bar-glass()`，不受影响。
- 不新增配置项、不涉及模板与 `languages/`。
- 需要同步的知识库：`docs/knowledge/02-布局系统/logo-navigation-headers.md`、`docs/knowledge/05-前端交互/client-side-overview.md`、`docs/knowledge/知识库全量.md`，并在 `VERIFICATION.md` 登记；主仓库 `source/wiki/stellar/advanced-settings.md` 补充说明。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库硬事实核查）。
- 主工程 `npm run g` 全量构建（含 gulp minify / Babel 转译）。
- `npm run s` 手动验收：首页（有/无置顶轮播）、Wiki 首页、分类/标签/归档页；桌面与移动端；未吸顶为卡片样式、吸顶后玻璃效果与之前一致；深浅色模式；刷新/前进后退恢复滚动位置时状态正确。
