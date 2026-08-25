---
title: 可选配色选择器与 Dropdown Action
date: 2026-08-25
status: 已实施
---

# 可选配色选择器与 Dropdown Action 方案

## 1. 问题与目标

- `/js/theme.js` 名称含糊且在所有页面无条件加载，但主题没有内置手动切换入口。
- Footer Action 已禁止 `onclick`，通用 Dropdown 也只能渲染链接，站点无法用语义明确的按钮提供配色选择器。
- 默认站点不得支付配色选择功能的请求与文案成本；显式启用后必须能直接选择 `light`、`dark` 或 `auto`。

成功标准：默认 Runtime Manifest 不声明配色选择 Extension；启用 `extensions.features.color_scheme_switch.enabled` 后才加载明确命名的模块并暴露 `window.setColorScheme(mode)`；Footer Dropdown 支持严格区分的 link/button 子项。

## 2. 技术方案

- 在 Extension Schema 增加默认关闭的 `color_scheme_switch`，由 Contribution Registry 投影 `/js/runtime/extensions/color-scheme-switch.mjs`。
- Extension 只接受 `light`、`dark`、`auto`，使用 `Stellar.colorScheme` 持久化，写入既有 `data-theme` CSS 接缝，并派发 `stellar:color-scheme-change`。
- `site.footer.actions` 与 Dropdown 子项使用 `type` 判别：link 只消费 `url`，button 只消费 `onclick`；HTML 属性统一转义。
- 通用 Dropdown 为按钮项渲染原生 `<button type="button">`，运行时在条目激活后关闭浮层。
- Voice 直接解析当前 DOM/系统配色并订阅配色变化，不再依赖 `utils.dark`。

复用入口：既有 Runtime Manifest、Contribution Registry、`data-theme` CSS 契约、`hud.toast`、通用 Dropdown partial/Feature 与 `ui-collection` 样式。新增定义只包括公开 Feature、严格 Action 字段、配色 Extension 模块及事件。

## 3. 影响范围

- 公开配置：新增 `extensions.features.color_scheme_switch.enabled`、`site.footer.actions[].onclick` 和 Dropdown 子项 `type/onclick`。
- 浏览器 API：启用 Feature 时提供 `window.setColorScheme(mode)`；不保留 `switchTheme`、`switchColorScheme` 或 `Stellar.theme` 兼容层。
- 默认行为：删除 `/js/theme.js` 请求与无条件切换文案；站点若不启用 Feature，服务端 `appearance.color_scheme` 与系统偏好仍是唯一配色来源。
- 文档：同步前端交互、侧栏、Dropdown/性能知识库、配置 Reference、配置审计与核查记录；v2 未发布，不更新公开 Wiki。

## 4. 验证方式

- Schema、Manifest、浏览器 Extension、Dropdown、Voice 单元测试。
- Reference/配置审计与性能基线生成、漂移检查。
- `npm run check`、`npm run integration:check`、主工程 `npm run g`。
