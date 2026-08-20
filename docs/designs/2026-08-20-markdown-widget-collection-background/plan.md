---
title: Markdown Widget Collection 默认背景执行计划
date: 2026-08-20
---

# 执行计划

1. [x] 在 widget 样式中覆盖 markdown widget 的 `--ui-item-bg`。
2. [x] 同步主题知识库、核查登记与主工程 Widget 文档。
3. [x] 执行主工程构建、知识库核查与差异检查。

## 风险与回退

- 规则限定在 `.widget-wrapper.markdown`，避免改变通用 collection 的透明默认态。
- 如需回退，只需移除 markdown widget 的变量覆盖，不涉及模板或配置迁移。
