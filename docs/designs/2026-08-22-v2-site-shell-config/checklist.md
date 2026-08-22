---
title: Stellar v2 site Shell 配置验收记录
date: 2026-08-22
status: 已实施
issue: 706
---

# 验收清单

- [x] `site.brand/menu/footer` 最终 YAML 与 JavaScript 路径已接入。
- [x] 派生默认、封闭对象数组、动态 action 记录与数组替换契约通过测试。
- [x] 旧主题根/旧子字段、未知字段、错误类型和非法枚举值结构化拒绝。
- [x] Post/Topic ViewModel、Brand helper、菜单与 Footer 不再读取旧主题根。
- [x] 配置 Reference 只增加 delivered `site` 节点且无漂移。
- [x] 主题 `npm run check` 通过（266 项测试、ESLint 与双 Reference 漂移检查通过）。
- [x] 知识库硬核查通过（行号异常 0、版本不一致 0；保留项与既有基线一致）。
- [x] 主工程 `npm run g` 生成并压缩 254 个文件；首页、`/blog/20260226/` 与 `/wiki/stellar/` 的 Brand、菜单、左栏操作和四组 Footer 分栏抽查通过。
- [x] Standards / Spec 双轨 review 无剩余 finding。
- [x] 主题 `v2` 已提交并推送，#706 已附证据并标记 `resolved`。

样式、国际化、公开 Wiki、URL、SEO 与浏览器协议变更：N/A；本切片只迁移未发布 v2 配置与既有 Shell 消费链。
