---
title: Footer Social 弹性占位项
date: 2026-08-18
status: 已实施
---

# Footer Social 弹性占位项方案

## 1. 问题与目标

Footer Social 原先采用固定宽度网格，只能连续排列图标，无法在同一行中将一组按钮分居两端。

目标是在不引入新的业务配置结构的前提下，提供 `spacer` 占位标识：把它置于 social 映射中需要分隔的位置，就能撑开中间空间并将后续按钮推向右侧。

## 2. 技术方案

- `layout/_partial/sidebar/index_leftbar.ejs` 在键名等于 `spacer` 时仅输出 `aria-hidden` 的 `.social-spacer`，忽略该项配置值。
- `source/css/_components/sidebar/footer.styl` 将按钮容器改为可换行 flex 布局；普通按钮与 dropdown 固定为 32px，`.social-spacer` 使用 `flex: 1` 吸收余量。
- 默认配置、知识库和主工程 Wiki 都给出 `spacer:` 示例。

## 3. 影响范围

- `footer.social.spacer` 成为保留标识；它没有图标、链接、提示或配置字段。
- 既有普通 social 和 `type: dropdown` 的输出顺序、按钮尺寸与交互不变。
- 宽度不足时容器照常换行；spacer 不会生成可操作元素。

## 4. 验证方式

- 检查包含普通按钮、spacer 和 dropdown 的首页 Footer HTML 与样式。
- 在主工程执行 `npm run g`。
- 执行知识库硬事实核查。
