---
title: 搜索控件语义优化
date: 2026-08-21
status: 已实施
---

# 搜索控件语义优化方案

## 1. 问题与目标

侧边栏搜索采用输入即检索，不存在需要提交的查询，但模板使用无 `href` 的 `<a>` 配合内联 `onclick` 聚焦输入框，外层 `<form>` 也没有提交目标。目标是在保持实时搜索、视觉与已有选择器接口不变的前提下，改用正确的搜索地标、输入类型和原生标签关联，并消除 Enter 触发表单提交的可能。

## 2. 技术方案

- 复用现有 `search.ejs` partial、`.search-wrapper` / `.search-form` / `.search-button` / `.search-input` 样式钩子、`#search-input` / `#search-result` 客户端接口和 `search.search*` 国际化文案。
- `.search-form` 由 `<form>` 改为 `<div role="search">`；搜索图标由伪链接改为 `<label for="search-input">`，删除内联事件。
- 输入框改为 `type="search"`，placeholder 同时作为转义后的 `aria-label`；图标标签对辅助技术隐藏，搜索框本身提供无障碍名称。
- 在组件样式中移除搜索输入框的浏览器原生装饰，保持现有外观，并保留图标的指针反馈。
- 新增模板源码测试，固定语义结构并防止伪链接、表单和内联事件回归。

## 3. 影响范围

- 涉及 `layout/_partial/sidebar/search.ejs`、搜索组件 Stylus、模板测试和本目录设计记录。
- 同步 `docs/knowledge/02-布局系统/sidebar-system.md`、`docs/knowledge/VERIFICATION.md` 与主工程 `source/wiki/stellar/sidebar.md`。
- 不改动 `source/js/search/`、搜索服务配置、国际化键或公开 API；本地搜索与 Algolia 继续消费相同 ID、class 和 data-filter。

## 4. 验证方式

- 模板结构测试覆盖搜索地标、标签关联、搜索输入类型、无障碍名称及旧结构移除。
- 运行 `npm run check` 和主工程 `npm run g`。
- 检查生成 HTML，并抽查首页、文章页、Wiki/笔记页的聚焦、实时搜索、Enter、过滤与状态样式。
