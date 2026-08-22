---
title: Stellar v2 最终配置契约实施计划
date: 2026-08-22
status: 已实施
issue: 704
---

# 实施计划

1. 建立 #704，并冻结八根域、命名规则、级联和非目标。
2. 新增状态化目标契约，登记字段类型、默认值、作用域、运行时键和消费方。
3. 将 #703 目录升级为逐字段迁移矩阵，覆盖主题、Collection、Front Matter、Hexo 外部字段和派生对象。
4. 增加活动 YAML、注释字段族、snake_case、Profile、Extension、内部化清单和当前运行时隔离测试。
5. 同步设计文档、配置知识库、验证台账和主工程 v2 蓝图三件套。
6. 执行全量验证和 Standards/Spec 双轨复核，修复结论后提交主题 `v2` 并闭环 #704。

后续实施顺序保持五个纵向切片：head/SEO、Shell 与内容默认值、Collection 与 Front Matter、Extension 与服务、根级封闭；每个切片直接写入本契约的最终路径。
