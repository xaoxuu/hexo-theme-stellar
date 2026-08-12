---
title: 侧边栏底部间距改为仅手机端生效
date: 2026-08-12
status: 已通过
---

# 侧边栏底部间距改为仅手机端生效 方案

## 1. 问题与目标

- 当前 `$leftbar-bottom-margin`（32px）与 `$rightbar-bottom-margin`（48px）在桌面、平板、手机三档布局的 `max-height` 计算中都在使用，但希望这两个底部间距只在手机端生效。
- 目标：
  1. PC（>667px，含平板/笔记本）侧边栏顶部沿用 `var(--gap-margin)`（16px），底部统一为 `var(--gap-margin)`（16px）。
  2. 手机端（≤667px）左右浮动面板底部间距统一为 64px，顶部保持 `8pt`。
  3. 两个常量重命名为 `-mobile` 后缀，仅移动端媒体查询引用。

## 2. 技术方案

- `source/css/_defines/const.styl`：`$leftbar-bottom-margin` → `$leftbar-bottom-margin-mobile = 64px`；`$rightbar-bottom-margin` → `$rightbar-bottom-margin-mobile = 64px`。
- `source/css/_components/sidebar/sidebar.styl`：基础规则中 `.l_left` 的 `max-height` 与 `.leftbar-container` 高度改为 `calc(100vh - var(--gap-margin) * 2)`；margin 保持不变。
- `source/css/_components/layout.styl`：
  - 平板浮动面板 `.l_right` 的 `max-height` 改为 `calc(100vh - var(--gap-margin) * 2)`，`top` 保持 `var(--gap-margin)`。
  - 手机端 `.l_left` / `.leftbar-container` 高度改用 `$leftbar-bottom-margin-mobile`；`.l_right` 新增显式 `max-height: calc(100vh - 8pt - $rightbar-bottom-margin-mobile)`（此前继承平板规则，改为 8pt 顶 + 64px 底）。
- 移动端 `.l_right` 的显式 `max-height` 是本次新增点，保证手机右栏底部 64px 与顶部 8pt 计算一致。

## 3. 影响范围

- 对外行为：PC/平板侧边栏底部间距由 32/48px 变为 16px；手机端左右浮动面板底部间距统一为 64px。
- 无配置项变化、无功能变化。
- 需要同步的知识库页面：
  - `docs/knowledge/02-布局系统/sidebar-system.md`（变量表、间距表格、高度约束）
  - `docs/knowledge/知识库全量.md`（同名段落，含此前未同步的桌面 margin 行一并校正）
  - `docs/knowledge/VERIFICATION.md`（样式变更登记）

## 4. 验证方式

- 主题仓库 `npm run check`（lint + 单测 + 知识库核查）。
- `python3 docs/knowledge/tools/verify.py` 知识库硬事实核查。
- 主工程 `npm run g` 全量构建。
- `npm run s` 按需预览：PC 视口与移动端视口下首页/文章页/Wiki 页侧边栏间距。
