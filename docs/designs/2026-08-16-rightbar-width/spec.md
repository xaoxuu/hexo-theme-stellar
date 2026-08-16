---
title: 右边栏加宽 32px
date: 2026-08-16
status: 已通过
---

# 右边栏加宽 32px 方案

## 1. 问题与目标

- 当前左右栏共用 `--width-sidebar`（288px，内容 256px），右栏 TOC 等小部件略显局促。
- 目标：右栏单独加宽 32px（桌面 320px、内容 288px），左栏不变；加宽量可配置、随令牌体系保持比例。

## 2. 技术方案

- 新增公开令牌 `--rightbar-width-extra: calc(var(--gap-base) * 2)`（=32px）。
- `source/css/_components/layout.styl`：`.l_body .l_right` 增加 `width: calc(var(--width-sidebar) + var(--rightbar-width-extra))`（特异性高于 `.l_body aside` 的基础宽度，仅右栏生效）；左栏与 `--width-sidebar` 公式不变。
- 加宽在所有断点生效（含平板固定抽屉与移动端），无需额外媒体查询。

## 3. 影响范围

- 对外行为：桌面右栏由 288px 变为 320px；内容列 1440px 由约 672px 变为约 640px，无横向溢出。
- 无配置项变化；新增公开令牌供站点覆盖。
- 需要同步的知识库页面：
  - `docs/knowledge/02-布局系统/sidebar-system.md`
  - `docs/knowledge/01-样式系统/responsive-design.md`、`design-tokens.md`
  - `docs/knowledge/VERIFICATION.md`

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库硬事实核查）。
- 主工程 `npm run g` 全量构建。
- headless Chrome 实测：桌面右栏 320px、左栏 288px，内容列 1280≈480、1440≈640、1536+ 恢复约 688/720，无横向溢出。
- 按需 `npm run s` 目视验收。
