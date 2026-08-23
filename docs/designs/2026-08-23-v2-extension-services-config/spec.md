---
title: Stellar v2 Extension 与服务配置
date: 2026-08-23
status: 已交付
---

# Extension 与服务配置方案

## 1. 问题与目标

`search/comments/tag_plugins/dependencies/data_services/data_cache/plugins/api_host` 是 M1.5 仍未迁移的公开扩展配置。它们把业务参数、第三方参数、主题内部资源地址和运行时服务表混在一起，消费方直接读取原始 `theme.config`。

本切片把所有用户可见行为参数直接迁入 #704 冻结的 `extensions`，由同一声明式 Schema 提供默认值、封闭边界、严格诊断、snake_case 到 camelCase 规范化、深冻结运行时和 Reference。当前搜索、评论、标签、数据服务、缓存与按需资源结果保持不变。

## 2. 最终配置契约

- `extensions.search`：`provider` 与 `providers.local/algolia`。
- `extensions.comments`：`provider/title/providers.<provider>`，第三方参数袋保留上游字段名。
- `extensions.tags`：官方 tag ID 的注册 Schema，Stellar 字段使用 snake_case。
- `extensions.features`：懒加载、预加载、灯箱、揭示、AI 摘要、数学、图表、复制代码、自适应文字、卡片 Hover 与 CJK 排版。
- `extensions.services`：站点信息、打分、投票、贡献者与 GitHub URL。
- `extensions.cache`：开关、默认 TTL、按服务 TTL 和条目上限。

`dependencies.marked`、官方 `.js/.css/inject`、`data_services.*.js` 与评论 `custom_css` 不再是公开配置；它们由主题内部资源注册表或 Extension partial 所有。

## 3. 实现接缝

复用 `config-target.js`、`CONFIG_SCHEMA`、`parseStellarConfig()`、`hexo.stellar.config`、配置 Reference 与现有 Extension/search/comment/service partial。主题内部资源 URL 收敛到代码常量或 partial，不建立第二套公开配置。

对象和已声明参数袋按键合并，数组完整替换，不做类型强转。公开 YAML 使用 snake_case；冻结 JavaScript 使用 camelCase；第三方 provider 参数袋保留上游键。

## 4. 影响范围与边界

影响主题默认、配置目标/Schema/Reference、搜索生成器、评论与插件 partial、tag plugin、helper、数据服务配置注入、Stylus 条件和主工程覆盖。

不实现 M4 原生 ESM 生命周期、request/cache 算法重写或客户端架构替换；不开启根级未知字段拒绝；不修改公开 Wiki、URL、SEO、视觉布局或依赖。`stellar/system` 内部化与根级封闭留给下一切片。

## 5. 验证

- 默认、站点覆盖、参数袋、动态记录、camelCase 与深冻结测试。
- 旧根、旧子字段、未知字段、错误类型和非法范围的来源化诊断测试。
- 静态消费链检查确保运行时不再读取八个旧根。
- 配置 Reference 漂移检查、主题 `npm run check`、知识库硬核查和主工程 `npm run g`。
- 抽查本地搜索、评论、数学/图表、标签插件、动态服务与 GitHub 资源产物。
- Standards / Spec 双轨 review。
