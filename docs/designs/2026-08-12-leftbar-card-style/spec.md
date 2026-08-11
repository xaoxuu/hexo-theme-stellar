---
title: 左栏 UI 风格：glass 与 card
date: 2026-08-12
status: 已通过
---

# 左栏 UI 风格（glass / card）方案

## 1. 问题与目标

- 为左侧栏新增一种可配置的 UI 风格：容器呈现纯色卡片（浅色纯白、深色主题深灰黑，即 `var(--card)`），带介于卡片常规与 hover 之间的中间档阴影。
- 现有背景图 + 模糊 + 磨砂玻璃效果命名为 `glass`，作为保留风格。
- 成功标准：`style.leftbar.ui-style` 取 `glass` 时渲染与现状完全一致；取 `card` 时左栏为纯色卡片 + 中间阴影；其余内容与交互不变。

## 2. 技术方案

- 配置：`_config.yml` 的 `style.leftbar` 下新增 `ui-style: card`，取值 `glass` / `card`，默认 `card`。
- 模板：`layout/layout.ejs` 中 `<aside class="l_left">` 按 `theme.style.leftbar?.ui-style === 'card'` 追加 `leftbar-card` 类；`glass` 不加类。
- 样式：`source/css/_components/sidebar/sidebar.styl` 新增 `.l_left.leftbar-card` 规则：
  - `background: var(--card)`；
  - `box-shadow: $boxshadow-float`（`0 4px 8px 0 rgba(0,0,0,0.05)`，介于 `$boxshadow-card` 与 `$boxshadow-card-float` 之间）；
  - 隐藏 `.sidebg` 与 `.leftbar-container:before/:after`，避免背景图与磨砂叠加层干扰。
- 交互样式按风格隔离（未来新增风格沿用同一机制）：`sidebar-light()` 混入与搜索条底部条改为读取容器级 CSS 变量 `--leftbar-item-bg` / `--leftbar-item-shadow` / `--leftbar-search-line`；
  - `card` 时列表项（菜单、最近更新、页面树、链接列表、相关文章等）hover/active 背景为 `var(--block-border)`、无顶部光照阴影；
  - 搜索条底部条默认为 `var(--text-meta)`，输入/悬停高亮仍为彩虹渐变；
  - 组件白色半透明背景（`--bg-a20/a50/a60/a75`）统一覆盖为 `var(--block)`，`--bg-a100`（不透明白）覆盖为 `var(--block-border)` 保留 hover 反馈，与右栏观感一致；
  - `glass` 与右栏（TOC 等）未设置变量，回退保持原效果。
- 涉及文件：`layout/layout.ejs`、`source/css/_components/sidebar/sidebar.styl`、`source/css/_defines/func.styl`、`source/css/_components/sidebar/search.styl`、`_config.yml`、`docs/knowledge/02-布局系统/sidebar-system.md`、`docs/knowledge/02-布局系统/layout-overview.md`。

## 3. 影响范围

- 对外行为：新增配置项 `style.leftbar.ui-style`；主题默认值从「无此配置」变为 `card`，未显式设置该键的站点升级后默认显示卡片风格，需 `ui-style: glass` 恢复原效果。
- 兼容性：`glass` 为现有行为，无样式分支，等价于不写该项。
- 需要同步的知识库页面：`docs/knowledge/02-布局系统/sidebar-system.md`、`docs/knowledge/02-布局系统/layout-overview.md`；主仓库 `source/wiki/stellar/sidebar.md`。

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库核查）。
- `python3 docs/knowledge/tools/verify.py` 硬事实核查。
- 主工程 `npm run g` 全量构建；`npm run s` 预览首页、文章页、Wiki 页的 glass / card 两种取值与深色模式。
