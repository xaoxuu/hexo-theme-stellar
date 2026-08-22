---
title: Stellar v2 最终配置信息架构与命名契约
date: 2026-08-22
status: 已实施
issue: 704
---

# 最终配置契约方案

## 1. 目标

#703 只解决了配置来源和迁移排队，`finalPath` 沿用了当时的 22 个顶层域，不能指导后续纵向切片一次迁到最终位置。本切片重新审视主题默认配置、站点覆盖、Collection YAML、Front Matter、Extension 参数袋、Hexo 外部字段和派生对象，冻结 v2 最终命名、从属关系和迁移结果。

公开主题配置最终只保留 `site`、`seo`、`layout`、`content`、`appearance`、`resources`、`extensions`、`inject` 八个根域。完整字段树见 [target-contract.md](target-contract.md)，机器事实位于 `scripts/schema/config-target.js`。

## 2. 现有能力复用

- 复用 #703 的 `config-inventory.js` 作为配置来源、所有权、消费方和迁移切片目录，只把临时目标升级为 #704 的最终矩阵。
- 复用 #702 的 `config-schema.js`、配置解析入口和 `reference/v2-config.json` 漂移检查，保证规划字段不会提前进入运行时或 Reference。
- 复用 `schema-utils.js` 的 `deepFreeze()`，不另建冻结或克隆 helper。
- 复用 `content-config.js` 已交付的 Collection、Front Matter 严格边界和第三方参数袋概念；本切片只声明最终目标，不重复实现校验器。
- 复用现有 Extension、data service、search、comments 消费链作为迁移证据，不新增并行 loader、缓存客户端或服务抽象。

## 3. 冻结规则

- YAML 中 Stellar 自有字段统一使用 snake_case；冻结后的 JavaScript ViewModel 使用 camelCase。
- 不提供 v1 字段别名、双读或类型强转。后续切片直接从旧路径迁到本契约，不经过 #703 的临时路径。
- Schema 是最终默认值唯一来源。对象和已声明参数袋按键合并；数组由更具体一层完整替换。
- 第三方 provider 参数袋保留上游字段名，但父容器必须由注册表封闭。
- `_config.stellar.yml` 是唯一站点主题覆盖入口；不再读取 Hexo `_config.yml.inject`。
- `inject.head/script` 保存可信多行原文，站点内容在前、页面内容在后，以一个换行追加，不解析或格式化。
- Hexo 自有配置和 Front Matter 保持外部所有权；构建派生对象、官方 Extension 脚本样式和主题元数据不进入公开 YAML。

## 4. 状态模型

`config-target.js` 的每个可配置节点声明类型、默认值来源、作用域、级联、规范化、运行时键、消费方、迁移章节、边界和状态。八个根域与全部新节点在本切片均为 `planned`。

当前运行时继续只使用 `config-schema.js` 中已交付的 `canonical.original_host/official_hosts`；`reference/v2-config.json` 也继续只投影已交付节点。后续 head/SEO 切片会一次迁入 `seo.canonical.host/allowed_hosts`，届时才改变运行时与 Reference。

## 5. 迁移矩阵

`config-inventory.js` 将 #703 的临时 `finalPath` 替换为最终 `targetPath/targetStatus/migrations`，字段目录直接从迁移矩阵的 `from` 派生，避免维护两份字段树。矩阵按从具体字段到动态字段族排序，`resolveConfigMigration()` 为每个当前叶子返回首个且唯一结果；动作只允许 `rename`、`move`、`merge`、`internalize` 或 `remove`。活动叶子、注释示例、动态记录和第三方参数袋均由契约测试覆盖。

Collection 与 Front Matter 同时冻结：`routing → route`、`base_dir → path`、Wiki `tree → navigation.tree`、Notebook `note.sidebar → note_defaults.sidebar`、评论 provider/options、`collection.type → collection.profile`、数学/图表进入 `render`、Stellar Open Graph 覆盖进入 `seo.open_graph`。

## 6. 非目标

- 不修改 `_config.yml`、主站 `_config.stellar.yml`、模板、样式、客户端或公开 Wiki。
- 不切换解析、渲染、SEO 输出、URL、浏览器行为或 Extension 加载。
- 不新增依赖，不提前封闭配置根，不更新主仓库子模块指针。

## 7. 验收

- 八根域、逐节点元数据、Profile ID、Extension 注册边界和内部化资源均可机器校验。
- 主题 `_config.yml` 22 个顶层域、活动叶子和注释字段族都有唯一目录归属与迁移结果。
- 当前 canonical 解析和 canonical-only Reference 无漂移。
- 主题 `npm run check`、知识库硬核查、主工程 `npm run g` 和 Standards/Spec 双轨 review 通过。
