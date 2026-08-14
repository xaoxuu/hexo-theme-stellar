---
title: 恢复普通 Markdown 表格默认横向滚动
date: 2026-08-14
status: 已实施
---

# 恢复普通 Markdown 表格默认横向滚动

## 1. 问题与目标

- 问题：未使用 `{% table %}` 标签的普通 Markdown 表格，在桌面端不再横向滚动。自 1.32.1（commit `830ccbd` `opt: ui`）起，`table:not([class])` 在桌面端从 `display: block` + `overflow: auto`（可滚动）改为 `display: table` + `width: 100%`，表格被强制压缩进容器宽度并自动换行，宽表格不再产生横向溢出，也就没有滚动。
- 目标：恢复默认行为——普通 Markdown 表格内容超出容器宽度时横向滚动（与移动端一致，也与此前版本一致）。

## 2. 技术方案

修改 `source/css/_common/base.styl` 中 `table:not([class])`：

- 恢复 `display: block` + `overflow-x: auto`（配合 `-webkit-overflow-scrolling: touch` 与 `scrollbar(0,0)`）。
- 恢复 `tr { white-space: nowrap; word-break: keep-all }`（桌面端同样不换行，超出即滚动）。
- 移除仅移动端生效的 `display: block` 分支（现在所有视口统一为块级 + 横向滚动）。
- 保留桌面端 `width: 100%`（块级表格填满容器，内容溢出时滚动）。

不受影响的部分：

- 代码高亮表格由更高优先级的 `.md-text .highlight >table` 覆盖。
- `{% table %}` 标签插件生成的表格带 class，被 `table:not([class])` 排除。

## 3. 影响范围

- 对外行为：普通 Markdown 表格（未包 `{% table %}`）在桌面端恢复横向滚动。
- 兼容性：恢复 1.32.1 之前的默认行为；移动端行为不变。
- 需同步文档：`docs/knowledge/01-样式系统/typography.md` 表格排版小节补充「默认横向滚动」说明；主工程 `source/wiki/stellar/` 表格文档同步。

## 4. 验证方式

- 主工程 `npm run g` 构建验证（stylus 编译 + 页面生成）。
- 检查生成 CSS 中 `table:not([class])` 的 `display: block` / `overflow-x: auto`。
- 页面类型覆盖：文章页宽表格（20260814 文章）、代码块高亮、`{% table %}` 标签页。
