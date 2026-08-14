---
title: 表格宽度策略统一检查清单
date: 2026-08-14
---

# 检查清单 / 验证记录

## 验证

- [x] 单测：`npm test` 通过（59 个，含新增 md_table 7 个）
- [x] lint：`npx eslint` 通过
- [x] 知识库：`npm run check` 内 `verify.py` 通过（仅既有非阻断提示）
- [x] 主工程 `npm run g` 全量构建通过（212 files，CSS/HTML 正常生成）
- [x] 无头 Chrome 实测（620px 容器，编译后真实 CSS）：
  - md 窄表格：table=588px 铺满，单元格合计=588px（列宽拉伸）
  - md 宽表格：table=1415px > 容器，滚动
  - scroll 短表格：table=588px 铺满
  - compact 宽表格：table=1415px > 容器，滚动
  - wrap 宽表格：table=588px 铺满，单元格内换行
- [x] 生成 HTML 抽样：md 表格 1 个已包裹；`{% table %}` 3 个与代码高亮 27 个均未包裹

## 文档同步

- [x] `docs/knowledge/01-样式系统/typography.md` 已更新
- [x] `docs/knowledge/知识库全量.md` 已更新
- [x] `docs/knowledge/VERIFICATION.md` 已登记
- [x] 主仓库 `source/wiki/stellar/tag-plugins/container.md` 已同步
