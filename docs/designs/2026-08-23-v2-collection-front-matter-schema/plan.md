---
title: Stellar v2 Collection 与 Front Matter 配置 Schema 执行计划
date: 2026-08-23
---

# 执行计划

1. [x] 创建并绑定主题 #709，冻结输入、消费与兼容边界。
2. [x] 交付 Collection / Front Matter 声明式 Schema 与通用解析入口。
3. [x] 迁移树构建、生成器、CollectionModel、PageViewModel 与插件装载消费链。
4. [x] 迁移主题测试夹具和主工程真实 Collection / Front Matter 输入。
5. [x] 更新配置目录、Reference、知识库、验证登记与主工程蓝图。
6. [x] 执行主题检查、主工程构建和关键页面产物抽查。
7. [x] 完成 Standards / Spec 双轨 review，修复全部 finding。
8. [x] 提交并推送主题 `v2`，评论证据并以 `resolved` 闭环 #709。

Schema 与主站输入先迁移，消费链随后一次切换；不引入旧字段兼容层。任何门禁失败时保持 issue open，不提交主仓库或更新子模块指针。
