---
title: navbar top 与 float-panel 统一 bar UI
date: 2026-08-12
status: 已实施
---

# navbar top 与 float-panel 统一 bar UI

## 1. 问题与目标

- 当前 navbar top（`.navbar-blur` / `.navbar-container`）与 `.float-panel`（移动端侧边栏开关）圆角均硬编码为 `64px` 胶囊形，不随主题 `style.border-radius.bar`（默认 `12px`，横条类元素圆角）变化。
- 目标：navbar top 与 `.float-panel` 圆角改由 `$border-bar` 定义，用户可通过 `style.border-radius.bar` 统一调整横条类元素（含 navbar top、浮动面板）的圆角。

## 2. 技术方案

- `source/css/_defines/func.styl`：`newblur()` 混入增加可选参数 `$radius = 64px`，`&:before,&:after` 的 `border-radius` 使用该参数。
- `source/css/_components/partial/navbar.styl`：`.navbar-blur` 的 `border-radius` 改为 `$border-bar` 并调用 `newblur($border-bar)`；`.navbar-container` 的 `border-radius` 改为 `$border-bar`。
- `source/css/_common/device.styl`：`.float-panel` 及其 `&:before,&:after` 的 `border-radius` 改为 `$border-bar`，调用 `newblur($border-bar)`；`corner-shape: round` 保留。
- 导航链接（`.navbar nav a`）第一轮保持不变，后续跟进（§5）改为与按钮共用 `bar-item()`（圆角改为与容器同心）。

## 3. 影响范围

- 对外行为：navbar top 与 `.float-panel` 从固定 64px 胶囊改为由 `style.border-radius.bar` 定义（默认 12px）；navbar top 的 `corner-shape` 仍随全局设置，`.float-panel` 保留 `corner-shape: round`（后续跟进 §5 改为连续曲率）。
- 不涉及配置项新增、模板或脚本。
- 需同步的知识库：`docs/knowledge/01-样式系统/styling-overview.md`、`stylus-utilities.md`、`responsive-design.md`、`docs/knowledge/02-布局系统/logo-navigation-headers.md`、`docs/knowledge/知识库全量.md`，并在 `VERIFICATION.md` 登记。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库核查）。
- 主工程 `npm run s` 预览首页/Wiki 页与移动端，检查 navbar top 圆角与链接、`.float-panel` 外观。

## 5. 跟进：复用一套 UI 并复用 navbar item 激活样式

### 5.1 问题与目标

- 上一轮仅统一了两处圆角，但 navbar top 与 `.float-panel` 的「长条圆角矩形 + 玻璃」样式仍是各自书写；侧边栏打开时 `.float-panel` 用的是主题色光晕 + `--bg-a50`，与 navbar item 激活样式不统一。
- 目标：两处复用同一套 bar UI（共享 mixin）；侧边栏打开时，`.float-panel` 中对应的按钮（`button.leftbar-toggle` / `button.rightbar-toggle`）完整复用 navbar item 激活视觉（`var(--bg-a60)` 背景 + 多层阴影 + `saturate(300%)`）。

### 5.2 技术方案

- `source/css/_defines/func.styl` 新增共享 mixin：
  - `bar-glass($radius = $border-bar)`：`border-radius` + `newblur($radius)`，两处共用。
  - `bar-item()`：navbar 导航项与 float-panel 按钮共用的基础 UI（`padding: .25rem .75rem`、`line-height: 2`、`font-size: $fs-14`、圆角 `$border-bar`、`corner-shape: $corner-shape` 连续曲率），一处修改两处生效；间距由容器统一控制，不写在 item 上。
  - `bar-item-active()`：从 `.navbar nav a.active` 抽取的视觉块（浅色 `var(--bg-a60)` / 深色 `rgba(white, 0.25)` 背景、多层 `box-shadow`、`backdrop-filter: saturate(300%)`），不含 `cursor` / `pointer-events`。
- `source/css/_custom.styl` 新增：间距令牌 `$bar-item-gap`（当前 2px，按钮间间距与距边距离）；派生圆角令牌 `$border-bar-container = calc($border-bar + $bar-item-gap)`（bar 容器圆角 = 按钮圆角 + 间距，当前 12+2=14px，与按钮保持同心）。
- `source/css/_components/partial/navbar.styl`：`.navbar-blur` 与 `.navbar-container` 圆角使用 `$border-bar-container`；`.navbar nav` 设 `gap: $bar-item-gap`、`padding: $bar-item-gap`（按钮间与距边均为 `$bar-item-gap`），移除 `a+a { margin-left: 4px }`；`.navbar nav a` 调用 `bar-item()`（圆角直接使用 `$border-bar`，由 32px 胶囊改为 12px）；`.navbar nav a.active` 调用 `bar-item-active()` 并保留 `cursor: default`、`pointer-events: none`、`&.active:after`。
- `source/css/_common/device.styl`：`.float-panel` 调用 `bar-glass()`（圆角 `$border-bar-container`）并设 `gap: $bar-item-gap`、`padding: $bar-item-gap`；按钮调用 `bar-item()`（圆角 `$border-bar`）并覆盖为 1:1（`box-sizing: border-box`、36×36、`padding: 4px`、图标 flex 居中），尺寸与 navbar item 同高（36px）；侧边栏打开时，`.l_body[leftbar]/[rightbar] .float-panel button.leftbar-toggle/rightbar-toggle` 调用 `bar-item-active()`，观感与 navbar item 激活一致；面板本身不设激活样式，按钮主题色图标保留。
- 连续曲率：`bar-glass()` / `bar-item()` 显式应用 `corner-shape: $corner-shape`（superellipse），`newblur()` 的 `&:before,&:after` 玻璃层同步应用；移除 `.float-panel` 的 `corner-shape: round` 覆盖。

### 5.3 影响范围

- 对外行为：按钮/item 圆角直接使用 `$border-bar`（当前 12px），bar 容器圆角 = `$border-bar + $bar-item-gap`（当前 14px），内外保持同心；条内按钮与按钮之间、按钮距条边均为 `$bar-item-gap`（当前 2px，容器 `gap` / `padding` 统一引用，移除 navbar 旧的 `a+a` 额外间距）；bar 容器与内部元素均应用连续曲率圆角（`corner-shape: $corner-shape`）；float-panel 按钮尺寸由固定 48×48 改为 36×36（与 navbar item 同高）；侧边栏打开时对应的按钮复用 `bar-item-active()`（bg-a60 填充 + 阴影 + saturate），面板保持玻璃效果。
- 不涉及配置项新增、模板或脚本。

### 5.4 验证方式

- 主题仓库 `npm run check`。
- 主工程 `npm run s` 预览：首页 navbar top 与激活 item；移动端打开左/右侧边栏时 float-panel 激活观感，深浅色模式。
