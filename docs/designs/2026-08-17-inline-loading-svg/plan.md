---
title: loading 自包含化执行计划
date: 2026-08-17
---

# 执行计划

## 实施步骤

1. [x] `_data/icons.yml`：`default:loading` 改为内联 SVG（3 处 `fill="currentColor"`）。
2. [x] `_config.yml`：移除 `default.loading` 配置入口（注释与示例一并删除）。
3. [x] `layout/_partial/head.ejs`：新增 `--icon-loading`（仅由 `default:loading` 内联 SVG 编码）。
4. [x] `lazyload.styl`：`.lazy-icon` 基础规则加 `background-image: var(--icon-loading, …)`。
5. [x] 消费方去内联：6 个标签插件、6 个评论 layout、`utils.js` `onLoading`、`lazyload.ejs` `wrapLazyloadImages`；`defines.ejs` 移除 `def.loading`。
6. [x] 知识库同步：`icon-tag.md`、`configuration.md`、`VERIFICATION.md`。
7. [x] 验证：lint + 128 单测通过（含 icons 键完整性）；主工程 `npm run g` 通过；产物核对完成；浏览器目验待 `npm run s` 进行。

## 风险与回退

- 风险：data URI 中 `currentColor` 需现代浏览器支持（与主题既有 inline SVG 图标一致）；每页新增一份约 1.2KB 的 `--icon-loading` 内联变量。
- 回退：git 检出工作区改动即可恢复；`var(--icon-loading, <旧URL>)` 回退保证变量缺失时仍有占位。
