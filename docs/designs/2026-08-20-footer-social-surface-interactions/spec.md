---
title: Footer Social 复用 Collection Surface 交互
date: 2026-08-20
status: 已实施
---

# Footer Social 复用 Collection Surface 交互方案

## 1. 问题与目标

左栏 Footer Social 的 hover/open 背景固定使用 `var(--bg-a20)`，没有消费左栏已声明的 `data-ui-surface="glass|card"`，因此与同一区域的 collection 条目出现交互样式差异。

成功标准：普通 Social hover 与 dropdown 打开态根据左栏 surface 分别采用 glass/card 的 collection 背景和阴影；按钮几何、图标渐变、灰阶、透明度、spacer 与浮层菜单行为保持不变。

## 2. 技术方案

- 复用 `collection.styl` 已有的 `--ui-item-bg`、`--ui-item-bg-hover`、`--ui-item-bg-active`、`--ui-item-shadow-hover` 与 `--ui-item-shadow-active`，不新增配置、令牌、mixin 或模板结构。
- Footer Social 默认态读取 `--ui-item-bg`；普通 hover 读取 hover 令牌；dropdown 打开态读取 active 令牌。
- 移除 Footer 对背景和阴影的独立 transition，使 surface 状态与 collection 一样立即切换；保留取消灰阶、图标透明度恢复和 SVG 渐变高亮。
- dropdown 菜单移入 `body` 后继续使用自身声明的 glass surface；只有留在 `.l_left` 中的 trigger 继承左栏 glass/card surface。

## 3. 影响范围

- 样式仅涉及左栏 Footer Social 按钮与 dropdown trigger，不改变页面主 Footer、文章分享栏或 dropdown 菜单条目。
- 同步 Sidebar 知识库、核查记录及主工程 Stellar Wiki；不涉及 `layout/`、`scripts/`、`source/js/`、`languages/` 或公开接口。

## 4. 验证方式

- 执行主题知识库硬事实核查与主工程全量构建。
- 检查编译 CSS 中普通 hover 使用 hover 令牌、dropdown open 使用 active 令牌，并确认无 Footer 背景/阴影 transition。
- 分别核对 glass/card surface 的令牌来源，确认 glass 保留顶部光照与高光边，card 使用 `var(--block)` 且无阴影。
