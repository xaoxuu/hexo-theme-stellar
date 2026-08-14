---
title: 恢复表格默认滚动检查清单
date: 2026-08-14
---

# 检查清单 / 验证记录

## 验证

- [x] 根因定位：`830ccbd` 将桌面端 `display: block` 改为 `display: table`
- [x] 主工程 `npm run g` 全量构建通过
- [x] 生成 CSS 包含 `table:not([class])` 的 `display: block` / `overflow-x: auto`
- [x] 页面类型覆盖：文章页宽表格（20260814 文章）、代码高亮、`{% table %}` 标签示例（本地预览已确认新 CSS 生效）
- [x] 移动端行为不变（原本已可滚动）

## 文档同步

- [x] `docs/knowledge/01-样式系统/typography.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主工程 `source/wiki/stellar/` 表格文档已同步
