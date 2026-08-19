---
title: Collection Surface 交互统一
date: 2026-08-20
status: 已实施
---

# Collection Surface 交互统一方案

## 1. 问题与目标

- grid 与 summary 的静态背景选择器会覆盖 collection 通用 hover/active，list 与 grid 在同一 surface 下的反馈不一致。
- glass 渐变背景参与 transition 时可出现 hover 闪烁。
- 未激活 leading 图标统一叠加灰阶、亮度与透明度滤镜，会与 SVG 自身的分层透明度再次叠加，造成不同图标深浅不一。
- 成功标准：所有布局默认透明，glass 交互态与 menubar 一致，其它 surface 使用 `var(--block)`，状态立即切换；未激活 SVG 统一使用 `var(--text-p2)`，不再通过滤镜置灰，图标整体透明度为 `0.5`。

## 2. 技术方案

- 复用现有 `data-ui-surface`、`--ui-item-*` 语义变量与 menubar 玻璃高亮数值，不新增配置、令牌、mixin 或模板接口。
- 移除 `--ui-grid-item-bg` / `--ui-summary-item-bg` 及其背景覆盖，list/grid/summary 共用条目状态。
- 移除 collection item 的 color/background transition 和 leading 图标的 filter transition，暂不提供替代动画。
- 移除未激活 `img` / `svg` 的灰阶滤镜及交互态冗余的滤镜复位；内联 SVG 通过 leading 的 `color: var(--text-p2)` 与 `currentColor` 着色，外部图片保留原图颜色。未激活 `img` / `svg` 使用 `opacity: .5`，hover/active 恢复为 `1`，现有主题色与渐变规则不变。

## 3. 影响范围

- 仅影响真实 `.ui-collection` 条目的背景、过渡与 leading 图标默认颜色；密度、间距、激活圆点、focus-visible 与 `.ui-collection-adapter` 保持不变。
- 同步样式令牌、侧栏系统、组件架构知识库与主工程 Stellar Wiki。

## 4. 验证方式

- 在 light/dark/auto 下对比 glass/card/sidebar/content 的 list/grid/summary 默认、hover 与 active 状态。
- 快速反复移入移出条目，确认背景、文字和 leading 图标无过渡和闪烁。
- 检查未激活 SVG 的计算颜色为 `--text-p2`、无滤镜且透明度为 `0.5`，外部图片保留原图颜色；确认 hover/active 图标透明度恢复为 `1`，SVG 仍使用现有主题色或渐变。
- 执行主工程全量构建与知识库硬事实核查。
