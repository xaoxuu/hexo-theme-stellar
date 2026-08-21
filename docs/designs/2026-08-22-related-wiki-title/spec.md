---
title: Wiki Related 条目标题修复
date: 2026-08-22
status: 已完成
---

# Wiki Related 条目标题修复

## 1. 问题与目标

v2 集合名称已统一为 `name`，但 Wiki 左栏 `related` 小部件仍从 `relatedProject.title` 取值。因此“更多：…”分组标题正常，关联项目条目却只显示说明，名称 DOM 为空。

成功标准：每个关联 Wiki 条目使用该项目的 `name` 渲染标题，现有链接、说明、分组标题和 Collection 样式不变。

## 2. 技术方案

- 复用现有 `relatedItems`、`widget-frame.ejs` 和 `collection.ejs`，不新增 helper、配置或样式。
- 将 `layout/_partial/widgets/related.ejs` 的条目标题来源改为 v2 规范字段 `relatedProject.name`。
- 增加模板回归测试，约束 related widget 不再读取旧 `title` 字段。

## 3. 影响范围

- 模板：`layout/_partial/widgets/related.ejs`
- 测试：`test/related_widget_markup.test.js`
- 知识库：`docs/knowledge/03-内容系统/related-content.md` 与 `docs/knowledge/VERIFICATION.md`
- 公开 Wiki：`source/wiki/stellar/sidebar.md`

不修改配置结构、`relatedItems` 生成逻辑、Collection 接口或 CSS。

## 4. 验证方式

- 定向模板测试先失败、修复后通过。
- `npm run check` 全量通过。
- 主工程 `npm run g` 后审计 `/wiki/stellar/examples/` 的 Related DOM。
- 浏览器中确认“Volantis”和“简历”标题可见。
- 三个仓库执行 `git diff --check`。
