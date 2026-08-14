---
title: 恢复表格默认滚动执行计划
date: 2026-08-14
---

# 执行计划

## 实施步骤

1. [x] 复现与根因定位（git blame：`830ccbd` `opt: ui`）
2. [ ] 修改 `source/css/_common/base.styl` 恢复 `display: block` + `overflow-x: auto` + `tr` 不换行
3. [ ] 主工程 `npm run g` 全量构建验证
4. [ ] 更新 `docs/knowledge/01-样式系统/typography.md` 并登记 `VERIFICATION.md`
5. [ ] 主工程 `source/wiki/stellar/` 表格文档同步

## 风险与回退

- 风险：桌面端表格单元格恢复不换行，窄表格遇到长文本会被撑宽并触发滚动；这是 1.32.1 之前的既定行为，符合「默认滚动」预期。
- 回退：恢复 `display: table` 分支即可回到压缩换行模式。
