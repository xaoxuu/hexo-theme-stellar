---
title: 表格宽度策略统一：宽度足够铺满、不足时滚动/换行
date: 2026-08-14
status: 已实施
---

# 表格宽度策略统一 方案

## 1. 问题与目标

- 问题：
  1. 普通 Markdown 表格（`table:not([class])`）以 `display: block` 实现横向滚动，块级表格的单元格列宽按内容收缩，容器宽度足够时表格并不铺满（无头 Chrome 实测：600px 容器内 3 列表格，单元格合计仅约 153px，剩余留白）。
  2. `{% table style:compact %}` 没有滚动容器，内容超出容器宽度时单元格被挤压或溢出，而不是横向滚动。
  3. `{% table style:scroll %}` 已满足「宽度足够铺满、不足时滚动」；`{% table style:wrap %}` 已满足「宽度足够铺满、超出时换行」。
- 目标：
  - md 默认表格、`scroll`、`compact` 三种表格统一为「宽度足够时铺满容器，宽度不足时横向滚动」；
  - `wrap` 表格保持「宽度足够时铺满，超出时单元格内换行」。

## 2. 技术方案

- 新增 `after_post_render` 过滤器 `scripts/filters/lib/md_table.js`：用 cheerio 遍历文章内容中的 `<table>`，排除代码高亮表格（`.highlight` 祖先）与 `{% table %}` 标签容器（`.tag-plugin.table` 祖先），其余普通表格包一层 `<div class="md-table-scroll">`。
- 新增组件样式 `source/css/_components/md-table.styl`：
  - `.md-table-scroll`：`overflow-x: auto` + 触摸滚动 + `scrollbar()` + 外边距；
  - `> table:not([class])`：`display: table; width: 100%`（列宽拉伸铺满），`margin: 0`。
- `source/css/_components/tag-plugins/table.styl`：`.table-compact` 增加滚动容器与 `min-width: max-content`，行为与 `scroll` 一致；`wrap` 不动。
- `source/css/_common/base.styl` 中 `table:not([class])` 的块级滚动样式保留，作为未包裹表格的兜底。

涉及文件：`scripts/filters/index.js`、`scripts/filters/lib/md_table.js`（新增）、`test/md_table.test.js`（新增）、`source/css/_components/md-table.styl`（新增）、`source/css/_components/tag-plugins/table.styl`。

## 3. 影响范围

- 对外行为：普通 Markdown 表格由「滚动但不铺满」变为「铺满 + 滚动」；`compact` 表格超宽时横向滚动；`scroll`、`wrap` 行为不变。
- 代码高亮表格（`.highlight`）与 `{% table %}` 标签表格不受影响（过滤器排除）。
- 需同步文档：`docs/knowledge/01-样式系统/typography.md`、`docs/knowledge/知识库全量.md`、`docs/knowledge/VERIFICATION.md`；主仓库 `source/wiki/stellar/tag-plugins/container.md`。

## 4. 验证方式

- 单测：`npm test`（新增 `test/md_table.test.js`，覆盖包裹、排除与实体保留）。
- 知识库：`python3 docs/knowledge/tools/verify.py`。
- 构建：主工程 `npm run g` 全量验证。
- 渲染实测：无头 Chrome 加载编译后 CSS，分别测量窄表格（应铺满）、宽表格（应滚动）、compact（应滚动）、wrap（应换行）。
