---
title: Stellar v2 canonical 配置 Schema 执行计划
date: 2026-08-22
---

# 执行计划

## 实施步骤

1. [x] 建立 canonical 声明式 Schema、解析器、结构化错误与冻结运行时配置。
2. [x] 接入构建事件、Post ViewModel、迁移期 EJS 和浏览器上下文。
3. [x] 迁移主题与主工程 YAML，并生成 `reference/v2-config.json`。
4. [x] 补齐单测、知识库、总蓝图状态与验证记录。
5. [x] 完成主题检查、主工程构建、产物抽查并准备 issue #702 自动闭环证据。

## 风险与回退

- 非 Post 页面仍在迁移期，canonical 必须通过共享解析结果接入，不能只修改 Post 分支。
- 旧 camelCase 字段会立即失败；主题默认配置与主工程覆盖必须同一切片迁移。
- 其它顶层配置暂不封闭，避免把局部接缝误报为整个 M1.5 已完成。
