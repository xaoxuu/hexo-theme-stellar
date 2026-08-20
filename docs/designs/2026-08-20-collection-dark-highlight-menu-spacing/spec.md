---
title: Collection 深色高亮与菜单间距收敛
date: 2026-08-20
status: 已实施
---

# Collection 深色高亮与菜单间距收敛

## 1. 问题与目标

- glass collection 在深色模式下以 `--bg-a50` 为 hover/active 基底，叠加顶部光照后偏亮。
- menubar 属于 `auto` collection，但另外将条目间距改为 2px，与通用 `auto` 几何不一致。
- 目标是降低深色 glass 交互面亮度，并让 menubar 复用 collection 默认 4px 间距。

## 2. 技术方案

- 复用现有 glass surface 令牌、顶部光照渐变和高光边，不新增配置、变量或 mixin。
- 深色显式模式和跟随系统深色模式的 hover/active 基底统一从 `var(--bg-a50)` 调整为 `var(--bg-a20)`。
- 删除 nav-area 内对 `--ui-collection-gap` 的 2px 覆盖，menubar 回归 `auto` collection 的默认 4px 间距。

## 3. 影响范围

- 影响所有 glass surface collection 的深色 hover/active 亮度。
- 仅 menubar 条目间距由 2px 改为 4px；标题字号、条目密度、圆角和激活反馈不变。
- 不改变 card/sidebar/content surface 或 compact density。

## 4. 验证方式

- 运行主工程全量构建与主题 lint。
- 检查深色、跟随系统深色的 glass hover/active 计算背景。
- 检查 menubar 与普通 `auto` collection 的计算 gap 均为 4px。
