---
title: 间距令牌响应式分档（16/32px）
date: 2026-08-16
status: 已通过
---

# 间距令牌简化为 --gap-base + --gap-page 方案

## 1. 问题与目标

- 原间距令牌 `--gap-margin` / `--gap-padding` / `--gap-max` 职责重叠且与页面级留白混用，断点分散、易漂移；侧边栏内部间距不应随大屏放大。
- 目标：
  1. 简化为两个令牌：`--gap-base`（固定 16px，组件内部 margin/padding 统一）与 `--gap-page`（≤1180px 16px / ≥1180px 32px，页面级留白）。
  2. 所有页面级规则只引用 `--gap-page`，内部引用只使用 `--gap-base`，不再为间距写逐规则媒体查询。
  3. `--width-sidebar` 恢复 `calc(var(--gap-base) * 4 + var(--side-content-width))`（288px 固定），侧边栏内部观感恢复原值。

## 2. 技术方案

- 涉及文件（`source/css/`）：
  - `_custom.styl`：删除 `--gap-margin` / `--gap-padding` / `--gap-max`；新增 `--gap-base: 16px` 与 `--gap-page: 16px` + `@media (min-width: $device-laptop) { --gap-page: 32px }`。
  - `_components/layout.styl`：grid-gap 与吸顶/高度公式改用 `--gap-page`；`--width-sidebar` 改 `calc(var(--gap-base) * 4 + var(--side-content-width))`。
  - `_components/sidebar/sidebar.styl`：`.l_left` / `.l_right` margin、max-height、`.leftbar-container` height、2K 居中改用 `--gap-page`；内部 `.header` 用 `--gap-base`。
  - `_components/main.styl` / `_components/partial/navbar.styl` / `_components/widgets/toc.styl` 与 `widgets` / `logo` / `footer` / `search` / `timeline` / `read/*` / `pin-slider`：页面级规则用 `--gap-page`，内部引用统一 `--gap-base`。
- 实测效果（宽松档）：1181–1920px 无横向溢出；内容列 1440px ≈ 672px、1280px ≈ 512px、1920px 恢复 720px；侧边栏四周留白 32px、内部间距固定 16px、列间距 64px。

## 3. 影响范围

- 对外行为：≥1180px 侧边栏贴边时四周间距统一为 32px，内部组件间距固定 16px，列间距 64px；≤1180px 四周 16px，移动端 8pt/64px 规则不变。
- 破坏性变更：删除公开令牌 `--gap-margin` / `--gap-padding` / `--gap-max`，引用旧令牌的自定义 CSS 需迁移到 `--gap-base` / `--gap-page`（已记入 CHANGELOG 升级注意）。
- 需要同步的知识库页面：
  - `docs/knowledge/01-样式系统/responsive-design.md`、`design-tokens.md`、`styling-overview.md`
  - `docs/knowledge/02-布局系统/sidebar-system.md`
  - `docs/knowledge/09-高级主题/custom-styling-overrides.md`
  - `docs/knowledge/VERIFICATION.md`

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库硬事实核查）。
- 主工程 `npm run g` 全量构建。
- CDP 布局实测：1181/1280/1366/1440/1536/1920px × 首页/文章/Wiki 页，无横向溢出、内容列达标、吸顶对齐。
- 按需 `npm run s` 目视验收。
