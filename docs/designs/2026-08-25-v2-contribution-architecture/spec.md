---
title: Stellar v2 贡献架构与一致性 CI 门禁
date: 2026-08-25
status: 已通过
issue: 725
---

# Stellar v2 贡献架构与一致性 CI 门禁方案

## 1. 问题与目标

M6 已收敛公开配置、资源与 Extension 语义，M7 已建立 Collection Pipeline，但贡献者仍需在 Runtime Manifest 构建器、内置 assets、Schema ID 列表、语言、测试与文档之间人工对齐同一项功能。这些旁路事实可以在局部测试通过时仍然漂移。

本切片交付以下结果：

- 主题内部的 Extension、Feature 和 Runtime 可注册组件共用一份贡献描述契约，明确身份、入口、资源、激活、Schema、i18n、文档和行为测试。
- Runtime Manifest 从描述注册表投影页面声明，不再额外保存 Extension ID/顺序/入口白名单。
- 独立 CI 门禁检查重复默认值所有者、重复注册、缺失翻译、Schema/Reference 漂移、未登记资源与缺失行为测试，并用负向 fixture 证明失败路径。
- 贡献指南按配置、内容 profile、服务端功能、UI 组件、浏览器 Extension、标签插件和语言文案列出权威所有者与最小验证接缝。

该契约是主题内部构建事实，不是第三方动态插件 API，不改变 v2 已冻结的公开配置与 Runtime Manifest 格式。

## 2. 描述契约

每条内置贡献声明固定包含：

| 字段 | 语义 |
| --- | --- |
| `id` / `kind` | 唯一身份与 `extension` / `feature` / `component` 类型 |
| `entry` | 浏览器 ESM 入口，必须是主题内本地 `.mjs` |
| `resources` | 从内置 assets 树消费的唯一路径集合 |
| `activation` | `always`、DOM `selector` 或服务端 `server` 条件；动态页面覆盖由投影函数收敛 |
| `schema` | 公开配置的 Schema/Reference 路径，纯内部组件为 `null` |
| `i18n` | 所需语言键集合，无文案为 `null` |
| `docs` | 知识库分类与权威页 |
| `tests` | 至少一个包含该 ID 行为断言的测试文件 |
| `defaultsOwner` | 公开默认值所有者；内部贡献为 `null` |
| `project` | 从当前页面与已规范化配置投影 Manifest config，返回 `null` 表示本页不注册 |

描述注册表按数组顺序定义 mount 顺序；`lazy-loading` 保持在 `services` 前，其余既有顺序不变。具体 mount/unmount 实现仍在 ESM 模块，Schema 默认值仍由 `scripts/schema/config-schema.js` 所有，语言真值仍在 `languages/*.yml`；契约只登记关系，不复制具体值。

## 3. CI 一致性门禁

`ci/check-contributions.js` 读取同一注册表并校验：

1. `id`、资源所有权、Schema 默认值所有权不重复；契约字段完整且无未知字段。
2. ESM 入口、文档和测试文件真实存在，测试文件包含贡献 ID。
3. 登记的 asset 路径真实存在，内置 search/comments/features/services 资源均有且只有一个所有者。
4. `schema` 在生成的 `reference/v2-config.json` 中恰好出现一次，`defaultsOwner` 与 Schema 一致。
5. `i18n.keys` 在 `en` / `zh-CN` / `zh-TW` 中都存在；全量语言键对等继续由既有测试保证。

`npm test` 与 CI 增加显式 contribution gate；`npm run reference:check` 仍负责产物字节级稳定性。单测用局部 fixture 注入重复 ID/默认值、缺失翻译、漂移 Schema、未登记资源和缺失测试，确认门禁不是只在当前正例上通过。

## 4. 代表性贡献演练

Card Hover 作为一个已有且可独立验证的简单 Feature，迁入独立 `card-hover.mjs` 入口并由单条 descriptor 登记 ID、入口、asset、`.card-hover` 激活、`extensions.features.card_hover` Schema、文档与测试。Runtime Manifest 不再硬编码 `card-hover`，通用 `feature.mjs` 也不再保存它的 dispatch case。

贡献者仍需编写实现、Schema（如果有公开配置）、测试和文档；但同一 ID/入口/资源/激活关系只在 descriptor 登记一次，CI 由此发现遗漏。

## 5. 影响范围与非目标

- 修改 `scripts/lib/` Runtime Manifest 构建、贡献契约/注册表和内置 assets 所有权。
- 新增 `ci/check-contributions.js`、契约单测和负向 fixture，接入 `package.json` 与 GitHub Actions。
- 拆出 Card Hover ESM adapter，不改变 DOM、CSS、公开配置或交互行为。
- 新增贡献指南并同步 Extension/组件知识库与 `VERIFICATION.md`。
- 不建立第三方 manifest 格式，不动态扫描 npm 插件，不改变 v2 公开 Schema/Reference、URL、模板或样式。M9、M10 与 Alpha 1 保持未完成。

## 6. 验收标准

- Runtime Manifest 全部内置声明由描述注册表投影，既有顺序、页面条件与 config 完全一致。
- Card Hover 作为独立 adapter 只在贡献注册表登记一次，浏览器行为回归通过。
- 正例注册表通过六类一致性检查，每类失败都有负向单测。
- 贡献指南的七类维护面可从当前代码和命令复现。
- `npm run check`、`npm run integration:check`、知识库核查和主工程 `npm run g` 通过；Standards / Spec 复审无剩余 finding。
