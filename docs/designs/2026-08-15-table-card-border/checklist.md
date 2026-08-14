---
title: 所有表格统一 wrap 同款圆角边框检查清单
date: 2026-08-15
---

# 检查清单 / 验证记录

## 验证

- [x] 主工程 `npm run g` 全量构建通过
- [x] 无头 Chrome 实测（620px 容器）：
  - md / scroll / compact / wrap 均为 `border: 1px solid var(--block-border)` + `border-radius: 16px` + `display: table`
  - 窄表格列宽拉伸铺满（md tds 合计 619px、scroll 618px、compact 618px、wrap 618px）
  - scroll 宽表格 1426px > 容器，正常滚动
- [x] 代码高亮表格未受影响（无边框、无圆角）
- [x] 附带修正：`.tag-plugin.table table` 补 `display: table`，标签表格列宽在宽度足够时真正拉伸铺满

## 文档同步

- [x] `docs/knowledge/01-样式系统/typography.md` 已更新
- [x] `docs/knowledge/知识库全量.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主仓库 `source/wiki/stellar/tag-plugins/container.md` 已同步
