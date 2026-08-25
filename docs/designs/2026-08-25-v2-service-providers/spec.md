---
title: v2 第三方服务 Provider 契约
date: 2026-08-25
issue: 732
---

# 问题

`extensions.services.site_info/rating/vote/contributors/github_card` 当前把实现参数直接放在服务节点。增加第二种实现时必须改变公开配置结构，与 Search、Comments、Math 和 Diagrams 已采用的 `provider + providers` 契约不一致。

# 复用与配置边界

- 复用 Search、Comments、Math 与 Diagrams 已有的 `provider + providers` 结构和声明式 Schema builder，不增加第二套配置解析协议。
- 复用 `config-schema.js` 的诊断、camelCase 投影和深冻结，`config-target.js` 继续作为旧字段迁移矩阵的唯一入口。
- 复用现有 Runtime Manifest、PageViewModel、tag helper 与 EJS 消费边界；新增的 `resolveServiceProvider()` 只负责从已验证服务对象返回选中参数袋，不包含默认值或兼容逻辑。
- Site Info、Rating、Vote、Contributors、GitHub Card 现有服务入口、DOM 和 URL 生成逻辑保持原位；固定实现、共享 GitHub 地址和浏览器资源仍由既有内部注册表所有。

# 最终契约

- Site Info 使用 `site_info_api` provider，Rating 与 Vote 分别使用 `star_vote` provider，Contributors 使用 `github` provider，GitHub Card 使用 `github_readme_stats` provider。
- `site_info/rating/vote.provider` 允许 `null` 并保持现有关闭与静态降级；Contributors 继续以空仓库映射关闭输出；GitHub Card 不新增关闭语义。
- 每个 `providers.<id>` 是封闭参数袋；新增实现只增加 provider ID、参数袋与适配器，不改变服务根结构。
- `github` 继续表示 GitHub 平台及代理地址，不包装为同名 provider；固定 Feature 实现继续内部化。
- 旧直连字段只由 doctor 给出新路径，不兼容读取、自动改写或静默 fallback。

# 实现接缝

- 声明式 Schema 负责 provider 枚举、参数袋、URL、仓库映射、camelCase 与深冻结。
- 统一服务解析函数只返回选中 provider 的配置；服务端标签、PageViewModel、模板与 Runtime Manifest 不读取未选参数袋。
- 默认公网 URL、DOM、GitHub URL、失败静默与静态降级保持不变。

# 影响范围

- 主题配置 Schema、目标契约、迁移诊断、Reference 与 doctor。
- Site Info、Rating、Vote、Contributors、GitHub Card 的服务端和浏览器消费链。
- 主题知识库、主工程真实覆盖、总蓝图与公开 Wiki。

# 验收

- 正反例覆盖默认、自定义、关闭、未知 provider、旧字段与未选参数袋。
- 相关标签、贡献者 URL、GitHub Card URL 与 Runtime Manifest 输出保持不变。
- 主题 `npm run check`、`npm run integration:check` 与主工程 `npm run g` 通过。
