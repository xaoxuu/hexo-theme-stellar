---
title: 胶囊形状元素取消连续曲率圆角
date: 2026-08-12
status: 已实施
---

# 胶囊形状元素取消连续曲率圆角 方案

## 1. 问题与目标

- 全局样式 `_common/html.styl` 中 `* { corner-shape: $corner-shape }`（默认 `superellipse(1.2)`）会把所有带圆角的元素套上连续曲率（superellipse）圆角。
- navbar top 中的胶囊按钮（`.navbar nav a`，`border-radius: 32px`）因此被渲染为连续曲率形状，不再是标准胶囊（正圆端帽）外形。
- 移动端悬浮面板 `.float-panel`（`border-radius: 64px`，含 `newblur()` 的 `:before`/`:after` 背景层）同为胶囊形状，同样被连续曲率扭曲。
- 目标：上述胶囊形状元素使用标准圆角（`corner-shape: round`），保持两端正圆端帽。

## 2. 技术方案

- 在 `source/css/_components/partial/navbar.styl` 的 `.navbar nav a` 规则中加入 `corner-shape: round`，覆盖全局 `*` 的 superellipse。
- 在 `source/css/_common/device.styl` 的 `.float-panel` 及其 `:before`/`:after` 中同样加入 `corner-shape: round`。
- 与 `source/css/_components/sidebar/logo.styl` 中头像 `corner-shape: round // 保持正圆（连续曲率会使正圆变成类方形曲线）` 的处理思路一致。

涉及文件：

- `source/css/_components/partial/navbar.styl`（修改）
- `source/css/_common/device.styl`（修改）
- `docs/knowledge/02-布局系统/logo-navigation-headers.md`（知识库同步）
- `docs/knowledge/01-样式系统/responsive-design.md`（知识库同步）
- `docs/knowledge/VERIFICATION.md`（登记）

## 3. 影响范围

- 仅影响 navbar top（`.navbar nav a`）胶囊按钮与 `.float-panel` 悬浮面板的角形状，不影响其他组件。
- 不涉及配置项、模板或脚本，无兼容性风险；不支持 `corner-shape` 的浏览器按现有回退行为渲染（border-radius 仍生效）。

## 4. 验证方式

- 主工程 `npm run g` 构建通过。
- `npm run s` 预览首页/Wiki 页与移动端，检查 navbar top 胶囊按钮与 float-panel 为两端正圆端帽。
- 主题仓库 `npm run check`（lint + 单测 + 知识库核查）通过。
