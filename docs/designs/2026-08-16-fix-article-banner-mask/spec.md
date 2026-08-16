---
title: 修复页面顶部横幅黑色蒙版（始终显示 + 贴边）
date: 2026-08-16
status: 已实施
---

# 修复页面顶部横幅黑色蒙版（始终显示 + 贴边）

## 1. 问题与目标

- 页面顶部横幅（`.article.banner`）的黑色渐变蒙版 div 类名为 `banner-mask top` / `banner-mask bottom`，与横幅内容区布局类 `.top` / `.bottom` 撞名。`.article.banner .content .top { margin: 1rem calc(1rem - 4px) }` 等规则命中蒙版，实测 `.banner-mask.top` 在 `position: absolute; inset: 0` 下被 margin 挤压成 576×208、距边 12px/16px，即「蒙版没贴边」。
- 蒙版 `opacity: var(--blur-opacity)` 导致仅在 hover 时可见；实际需求是黑色蒙版始终显示（含触屏无 hover 场景），且贴满横幅边缘。
- 成功标准（可验收的行为）：
  - 友链等带图横幅页面：顶部/底部黑色渐变蒙版始终可见，蒙版盒与横幅盒完全重合（贴边）。
  - hover 时同图模糊层仍淡入，蒙版不位移、不消失。

## 2. 技术方案

- `layout/_partial/main/navbar/article_banner.ejs`：蒙版 div 类名改为 `banner-mask banner-mask-top` / `banner-mask banner-mask-bottom`，避开 `.top` / `.bottom` 撞名。
- `source/css/_components/partial/article-banner.styl`：
  - `.banner-mask` 的 `opacity: var(--blur-opacity)` 改为 `opacity: 1`（常显），移除不再生效的 `trans1 all`。
  - 变体选择器改为 `.banner-mask-top` / `.banner-mask-bottom`，渐变不变（文字所在边缘不透明度约 0.5 → 垂直中线 0）。
  - hover 时同图模糊层（`:before` / `:after`）淡入行为保留。

## 3. 影响范围

- 对外行为：页面顶部横幅（文章页、友链等 page）的黑色蒙版由 hover 淡入改为始终显示；poster 卡片、置顶轮播、`{% banner %}` 标签不受影响。
- 无新增配置项、无 API 变化；CSS 类名仅内部 DOM/样式。
- 需要同步的知识库页面：`docs/knowledge/03-内容系统/content-overview.md`，并在 `docs/knowledge/VERIFICATION.md` 登记。

## 4. 验证方式

- 主工程 `npm run g` 全量构建通过（捕获 EJS/CSS 错误）。
- `npm run s` 预览：友链页（story + 头像下块）、文章页有图 banner、无 banner 页面、`{% banner %}` 标签页面、移动端宽度。
- 无头浏览器几何断言：`.banner-mask-top` / `.banner-mask-bottom` 的 `getBoundingClientRect` 与 `.article.banner` 一致，未 hover 时 computed opacity 为 1；hover 时蒙版无位移、模糊层淡入。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查。
