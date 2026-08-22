---
title: Stellar v2 配置入口与迁移边界全景契约
date: 2026-08-22
status: 已实施
---

# 配置全景契约方案

## 1. 问题与目标

Pre-alpha M1.5 目前只通过 #702 交付 `canonical` 配置接缝。其它主题默认配置、站点主题覆盖、Collection YAML、Front Matter、Extension 参数袋、Hexo 外部配置和运行时派生数据尚未共享一份入口目录，继续按域迁移会重复决定字段归属、命名和先后依赖。

本切片建立不参与运行时解析的机器可读目录，冻结所有配置来源、字段域、消费方、最终路径、边界与迁移顺序。它只交付后续重构的工程接缝，不迁移新的公开字段，不改变页面输出，也不把规划字段提前发布为 Reference。

## 2. 复用与边界

- 复用 #702 的 `CONFIG_SCHEMA` 已交付状态和 `reference/v2-config.json` 漂移检查，目录不另建公开 Reference。
- 复用 `content-config.js` 已有 Collection、Front Matter 与第三方参数袋边界，只登记其当前职责，不重复实现校验器。
- 把配置 Schema 与模型 Schema 已有的相同 `deepFreeze()` 提取为共享 schema utility，供新目录复用；不新增依赖或运行时入口。
- 复用主题 `_config.yml` 作为顶层域事实，并用无依赖文本读取完成覆盖检查。

## 3. 技术方案

- `scripts/schema/config-inventory.js` 登记 22 个主题默认顶层域，以及站点专属 `inject`、遗留 `cache/language_switcher`、Collection、Front Matter、Hexo 输入、主题数据和派生运行时对象。
- 每个域固定 `sourceKind/sources/owner/boundary/finalPath/runtimeTarget/consumers/status/migrationSlice/fields`；动态记录使用 `<id>` 等通配路径，第三方参数袋只封闭父级容器并保留上游字段。
- Stellar 自有 YAML 最终使用 snake_case。现有连字符或语义更名通过 `legacyMappings` 明确目标；不会在本切片增加双读、自动改写或运行时 fallback。
- 五个迁移切片按 `head-seo → shell-content-defaults → collection-front-matter → extensions-services → root-seal` 排序，每个目录域只出现一次。
- 测试以无依赖的顶层 YAML 键读取核对主题 `_config.yml`，并验证目录枚举、迁移覆盖、snake_case 映射、参数袋边界与当前 Schema 已交付范围。

完整字段族与职责边界见 [inventory.md](inventory.md)。目录是 M1.5 内部规划契约；已发布字段仍只来自 `scripts/schema/config-schema.js` 与 `reference/v2-config.json`。

## 4. 影响范围

- 工程：新增配置目录纯数据模块和契约测试，不接入 `generateBefore`、模板或客户端。
- 文档：更新配置架构知识库和 v2 总蓝图状态；Pre-alpha 不更新公开 Wiki。
- 兼容性：公开 YAML、JavaScript 对象、HTML、CSS、URL、SEO 与 Extension 行为均不改变。
- 后续限制：M1.5 的实现切片必须属于目录中的一个迁移切片；若改变已冻结的 Extension 字段域，需要重新打开本门禁。

## 5. 验证方式

- 契约测试覆盖主题顶层域、站点专属入口、职责枚举、字段树、迁移队列、参数袋和深冻结。
- 回归当前 `CONFIG_SCHEMA` 根仍未封闭，唯一 `delivered` 域仍是 canonical。
- `npm run check`、知识库硬核查与主工程 `npm run g` 全部通过。
- Standards / Spec 双轨复核无剩余 actionable findings 后闭环 #703。
