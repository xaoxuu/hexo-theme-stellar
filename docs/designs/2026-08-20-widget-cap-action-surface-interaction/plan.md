---
title: Widget Header Cap Action Surface 交互执行计划
date: 2026-08-20
---

# 执行计划

1. [x] 将 cap action hover 背景与阴影切换为 collection surface 令牌。
2. [x] 同步主题知识库、核查登记与主工程侧栏文档。
3. [x] 执行构建、知识库核查与差异检查。

## 风险与回退

- 只替换 hover 的背景和阴影来源，不改变 cap action 的布局和其它状态。
- 如需回退，恢复 `.cap-action:hover` 中的 `sidebar-light()` 调用即可。
