---
title: Stellar v2 外观与资源兜底配置执行计划
date: 2026-08-23
---

# 执行计划

1. [x] 创建并绑定主题 #710，冻结字段、消费与兼容边界。
2. [x] 迁移主题默认与主工程覆盖到 `appearance/resources.fallbacks`。
3. [x] 交付严格 Schema、冻结运行时和配置 Reference。
4. [x] 迁移 EJS、Node.js、Model 元数据与 Stylus 消费链。
5. [x] 同步知识库与主工程总蓝图；验证提交登记在实现提交产生后补录。
6. [x] 执行主题检查、主工程构建和关键产物抽查。
7. [ ] 完成 Standards / Spec 双轨 review，修复全部 finding。
8. [ ] 提交并推送主题 `v2`，评论证据并以 `resolved` 闭环 #710。

先让默认 YAML 与 Schema 使用最终路径，再一次切换全部消费方；不引入旧字段兼容层。任一门禁失败时保持 issue open，不提交主仓库或更新子模块指针。
