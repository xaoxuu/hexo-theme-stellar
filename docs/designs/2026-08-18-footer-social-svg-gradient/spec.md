---
title: Footer Social SVG 主题渐变
date: 2026-08-18
status: 已实施
---

# Footer Social SVG 主题渐变方案

## 1. 问题与目标

左栏 Footer Social 按钮在悬停时会取消灰阶，但内联 SVG 尚未复用主题通用渐变。目标是在不改变图标尺寸、链接、下拉菜单或默认灰阶状态的前提下，让可着色 SVG 使用当前主题渐变。

## 2. 技术方案

- 在 Footer Social 容器输出现有 `grad-def` partial，并以唯一 ID 暴露 `--item-grad`。
- 按钮悬停时，仅将 SVG 内 `fill` 或 `stroke` 为 `currentColor` 的元素指向该渐变；图标自身的显式多色内容不受影响。
- 复用 `--item-theme-light`、`--item-theme` 与 `style.gradient.angle`，不新增配置项或客户端逻辑。

## 3. 影响范围

- `layout/_partial/sidebar/index_leftbar.ejs`：Footer Social 渲染渐变定义。
- `source/css/_components/sidebar/footer.styl`：悬停 SVG 的填充与描边渐变。
- `docs/knowledge/02-布局系统/sidebar-system.md`、`docs/knowledge/VERIFICATION.md`：行为说明与核查记录。

## 4. 验证方式

- 核查生成 HTML 的 gradient ID 与 `--item-grad` 引用一致。
- 检查普通按钮、外链图标与 dropdown 触发器的未悬停、悬停和打开状态。
