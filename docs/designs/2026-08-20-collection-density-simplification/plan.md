---
title: Collection Density 简化执行计划
date: 2026-08-20
---

# 执行计划

## 实施步骤

1. [x] 删除 regular 校验与样式，保留 auto/compact。
2. [x] 系统次要列表使用 compact，menubar/linklist/普通预览使用默认。
3. [x] 同步主题知识库、核查记录与主工程 Wiki。
4. [x] 运行静态检查、知识库核查、全量构建和浏览器验收。

## 风险与回退

- 旧 regular 调用会回退为 auto，避免输出失效属性；如需回退，可恢复 regular 校验、样式及原调用点。
