---
title: 搜索控件语义优化检查清单
date: 2026-08-21
---

# 检查清单 / 验证记录

## 验证

- [x] 模板结构测试通过（3 项）
- [x] `npm run check` 通过（lint、152 项测试、知识库核查、提交登记检查）
- [x] 主工程 `npm run g` 全量构建通过（253 个文件）
- [x] 生成 HTML 不含搜索伪链接、内联聚焦事件或可提交表单（183 个搜索组件）
- [x] 首页 / 文章页 / Wiki 页 / 笔记页搜索结构与过滤行为正常
- [x] 点击图标聚焦、输入即搜索、Enter 不刷新、三态图标样式正常

## 文档同步

- [x] `docs/knowledge/02-布局系统/sidebar-system.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 `source/wiki/stellar/sidebar.md` 已更新并刷新 `updated`
- [x] 无需新增 `languages/` 文案

## 浏览器验收

- 首页无障碍树输出一个 `search` 地标与名称为“站内搜索”的 `searchbox`。
- 点击图标后活动元素为 `#search-input`；输入 “Stellar” 即时生成 157 条结果。
- 按 Enter 后 URL、输入值与焦点均保持不变，无页面刷新或跳转。
- 文章页使用全站搜索；Wiki 与笔记页分别保留 `/wiki/stellar/`、`/notes/flutter/` 过滤路径。
- Chromium 计算样式中输入框 `appearance: none`，图标保持 24×24px flex 布局，控制台无错误。
