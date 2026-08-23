---
title: Stellar v2 M6 配置、语言与内部常量收敛计划
date: 2026-08-24
status: 实施中
issue: 724
---

# 执行计划

1. 建立当前唯一 Schema 字段与 M6 退出字段的确定性审计，先锁定 `public/localize/derive/internalize/remove`。
2. 将唯一 provider、Extension 资源、request/cache 与固定时序收敛到 `internal-constants.js`，通过 Runtime Manifest 投影。
3. 从公开 Schema 与 `_config.yml` 删除 copy 文案、code-copy 文案、固定 provider 与 cache；保留显式用户内容覆盖。
4. 为三种语言补齐 copy、code-copy、AI 摘要和 OKR 默认状态文案，并迁移服务端/浏览器消费链。
5. 更新 Reference、doctor、Blueprint、Runtime Manifest 和负向配置测试。
6. 同步主题知识库、验证登记与主工程 v2 总控状态。
7. 运行全量门禁，进行 Standards / Spec 双轨 review，修正后自动提交、推送并闭环 #724。

## 提交拆分

- 实现提交：配置、语言、内部常量、运行时与测试；
- 审查修正提交：仅在 review 发现问题时创建；
- 验证登记提交：知识库验证记录与最终 checklist。
