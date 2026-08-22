---
title: Stellar v2 首批 Reference 元数据
date: 2026-08-22
status: 实施中
---

# Reference 元数据方案

## 1. 问题与目标

[#699](https://github.com/xaoxuu/hexo-theme-stellar/issues/699) 要把 Pre-alpha M1 已交付的 post、wiki、topic、notebook 构建期模型转为文档与工具可消费的首批 Reference 元数据。当前 `CollectionModel`、`ContentItemModel` 与 `PageViewModel` 已有稳定实现和行为测试，但字段事实仍隐含在模型构造代码与断言中，无法稳定生成 Reference，也容易在另写字段表后产生漂移。

本切片建立一个声明式模型 Schema 作为模型结构校验与 Reference 生成的共同事实来源。每个已交付字段都声明类型、默认值语义、作用域、当前消费方和最小示例；生成结果可重复、顺序稳定，并且只覆盖四类已交付 profile 的三个模型。

## 2. 技术方案

### 2.1 复用入口

- 复用 `scripts/lib/content-config.js` 已有严格输入校验与字段白名单，Reference 不新增 YAML 配置面。
- 复用 `scripts/lib/models/index.js` 已交付的四类模型构造器和实际默认值，不复制级联或路由逻辑。
- 复用 Node.js 内置 `fs` / `path` 与现有 npm scripts，不新增依赖。

### 2.2 新增接缝

- `scripts/schema/model-schema.js` 声明 post、wiki、topic、notebook 的 `CollectionModel`，四类共用的 `ContentItemModel`，以及引用二者的 `PageViewModel`。Schema 节点同时携带 Reference 注解。
- `scripts/lib/models/` 在返回 PageViewModel 前使用同一 Schema 校验输出结构、字段类型和未知字段，防止实现与 Reference 漂移。
- `scripts/lib/reference-metadata.js` 只遍历上述 Schema，输出稳定排序的普通对象与 JSON；不读取模型源码，也不维护第二份字段清单。
- `npm run reference:generate` 生成 `reference/v2-models.json`；`npm run reference:check` 只读检查仓库内产物是否与 Schema 一致，适合 CI 和后续文档生成器调用。

默认值使用机器可读的 `{ kind, value/from/description }` 表达：静态默认值使用 `literal`，级联或来源字段使用 `inherited` / `derived`，运行期归一化使用 `computed`。这样不会把动态默认值伪装成某个固定字面量。

### 2.3 新增常量边界

| 常量 | 语义与作用域 | 消费方 | 默认值来源与配置边界 |
| --- | --- | --- | --- |
| `PROFILES` | `model-schema.js` 模块内的已交付 profile id 集合 | Schema 构建、模型校验、Reference 生成 | 固定来自 #695–#698 的 post/wiki/topic/notebook；不读取用户配置 |
| `MODEL_SCHEMAS` | 模块导出的深度冻结模型输出契约 | `assertPageViewModel()`、Reference 生成器与测试 | 字段边界来自已验证的模型构造行为；不是可覆盖的主题配置 |
| `ROOT` | 生成命令/测试的主题仓库根路径，模块私有 | 输出路径解析与测试 | 从当前脚本所在位置确定；不接受用户配置 |
| `OUTPUT` | 默认生成产物 `reference/v2-models.json` 的绝对路径，模块私有 | 生成命令与产物一致性测试 | 发布契约固定路径；CLI 不提供改写，单测只通过函数参数指向临时目录 |

## 3. 边界

- Schema 只描述已经由 #695、#696、#697、#698 实现并验证的模型输出。`BlueprintModel`、CLI 参数、布局原语 Schema 与 `Extension` 生命周期均不进入生成结果。
- `ContentItemModel.layout` 是已交付的内容模型字段，继续收录；本切片不因此公开尚未实现的布局原语或布局配置契约。
- 第三方评论参数袋与 widget 对象属于开放对象边界，只描述参数袋本身，不复制上游字段表。
- 不改变 EJS、Stylus、浏览器 JS、公开 YAML、URL、SEO 或 v1 迁移行为；主工程公开 Wiki 同步为 N/A。主题知识库与 v2 architecture 状态需要同步。

## 4. 影响范围

- 新增：`scripts/schema/`、Reference 生成库与命令、生成的 JSON、单元测试。
- 修改：`scripts/lib/models/index.js`、`package.json`、v2 architecture spec/plan/checklist、内容 Schema 知识库与 `VERIFICATION.md`。
- 主工程：只更新 `docs/specs/stellar-v2-blueprint/` 中 Pre-alpha M1 与 #699 的事实状态，不更新子模块指针，不提交任何改动。

## 5. 验证方式

- 单测覆盖字段注解完整性、四类 profile、稳定排序、重复生成、仓库产物一致性、未交付模型排除，以及 Schema 对模型输出的结构约束。
- 运行单文件测试，再运行主题 `npm run check`。
- 因修改 `scripts/`，在主工程运行 `npm run g`。
- 运行知识库硬事实核查；命令与结果记录在本目录 `checklist.md`。
