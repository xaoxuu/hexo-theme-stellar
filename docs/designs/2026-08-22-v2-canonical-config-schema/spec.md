---
title: Stellar v2 canonical 配置 Schema 与解析接缝
date: 2026-08-22
status: 已实施
---

# canonical 配置 Schema 方案

## 1. 问题与目标

当前 canonical 配置仍由 `_config.yml`、站点覆盖、Post ViewModel、EJS 与浏览器脚本分别读取 camelCase 字段，缺少统一的默认值、严格校验、规范化结果与结构化诊断。Pre-alpha M1.5 先用 canonical 建立首条完整配置接缝。

本切片完成后，v2 YAML 只接受 `canonical.original_host` 与 `canonical.official_hosts`；默认配置和站点覆盖解析为冻结的 JavaScript `{ originalHost, officialHosts }`，供 Post SEO、迁移期页面和浏览器上下文共同消费。其它配置域仍属于 M1.5 后续切片。

## 2. 技术方案

- `scripts/schema/config-schema.js` 声明 canonical 的字段树、类型、默认值、作用域、级联、规范化、消费方、示例和迁移标识；配置 Reference 直接遍历该 Schema。
- `scripts/lib/config-schema.js` 负责严格校验、默认值与站点覆盖合并、规范化、深度冻结和结构化 `ConfigSchemaError`。错误问题包含 `code/source/path/actualType/expected/migration`。
- 构建事件在其它主题事件消费配置前解析并挂载 `hexo.stellar.config`。主题默认值来自 Schema，站点覆盖来自 Hexo 已加载的 `theme_config`；根级其它配置暂不封闭，canonical 子树拒绝未知字段。
- canonical 空值规范化为 `originalHost: ""`；备用主机逐项 trim、删除空项、稳定去重。类型错误不自动转换。
- YAML 使用 snake_case；服务端与浏览器 JavaScript 继续使用 camelCase。旧 `originalHost` / `officialHosts` 只产生移除诊断，不提供双读兼容层。
- Post ViewModel 从冻结结果生成 canonical；迁移期 head 与脚本定义通过 helper 取得同一结果，浏览器 `ctx.canonical` 的形状保持不变。
- `reference/v2-config.json` 记录已交付 canonical 字段；现有 Reference 生成与检查同时维护模型和配置产物。

复用现有的模型 Schema 元数据约定、Reference 稳定排序入口、Post ViewModel canonical 逻辑和浏览器 `ctx.canonical`，不新增依赖。

## 3. 影响范围

- 配置：主题默认配置与主工程 `_config.stellar.yml` 改用 snake_case，旧字段在 v2 构建中报错。
- 构建期：新增配置 Schema/解析器和 helper，Post 模型输入改用规范化 canonical。
- 渲染与客户端：canonical link、脚本上下文和 clone check 行为等价，浏览器字段名不变。
- 文档：更新配置系统、canonical 行为知识库、Reference 元数据和 v2 总蓝图状态；Pre-alpha 不更新公开 Wiki。
- CSS、其它页面配置、Collection、Front Matter、Extension、语言文案、URL 与重定向均不在本切片内。

## 4. 验证方式

- 单测覆盖默认值、覆盖、空值、trim/去重、深冻结、旧字段、未知字段和错误类型诊断。
- 回归普通 Post canonical/SEO、迁移期 head 与浏览器 canonical 上下文。
- `npm run check`、知识库硬核查与主工程 `npm run g` 全部通过；抽查普通 Post、Topic Post、Wiki 与 Notebook 生成页面。
