---
title: Stellar v2 配置根封闭执行计划
date: 2026-08-23
---

# 执行计划

1. [x] 创建并绑定主题 #712，冻结公开根与排除边界。
2. [x] 封闭 `CONFIG_SCHEMA` 根对象，拒绝未知/旧/移除根与非对象输入。
3. [x] 内部化 `stellar/system`，更新核心资源与发版版本单源。
4. [x] 将主题数据与派生对象迁入 `hexo.stellar.data`，切换 Node/EJS 消费链。
5. [x] 同步契约测试、Reference、知识库、`VERIFICATION.md` 与主工程总蓝图。
6. [x] 执行主题检查、主工程构建与关键产物抽查。
7. [x] 完成 Standards / Spec 双轨 review，修复全部 finding。
8. [ ] 提交并推送主题 `v2`，评论证据并以 `resolved` 闭环 #712。
