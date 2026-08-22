---
title: Stellar v2 Collection 与 Front Matter 配置 Schema
date: 2026-08-23
status: 已交付
---

# Collection 与 Front Matter 配置 Schema 方案

## 1. 问题与目标

Collection YAML 与 Front Matter 已具备严格校验，但仍由 `scripts/lib/content-config.js` 手写字段表和逐字段函数维护，输入与模型消费继续使用 `routing`、`collection.type`、`note.sidebar`、页面 `comments.service` 等临时名称。配置目标目录已经冻结最终命名，却尚未成为这些输入的真实解析契约。

本切片把 Collection 与 Front Matter 接入主题配置使用的同一声明式 Schema 引擎，直接交付最终 YAML 路径和冻结 camelCase JavaScript 对象。旧字段不提供别名或双读；主工程真实输入与主题测试夹具同批迁移，确保构建结果不变。

## 2. 复用接缝与新增定义

复用：

- `scripts/schema/config-target.js`：路径、类型、默认、作用域、级联、运行时键、消费方和状态的唯一目录。
- `scripts/lib/config-schema.js`：类型、枚举、数值、未知字段、旧字段、数组替换、对象解析、聚合诊断与深冻结引擎。
- CollectionModel / PageViewModel 的 `mergeConfig`：主题 Profile → Collection → Front Matter 的已验证对象级联。
- `scripts/lib/source-config.js`：保留来源文件定位和 Hexo Front Matter 读取。
- `scripts/events/lib/content-config.js`：保留 generate-before 的集中解析与 ViewModel 注册时机。

新增：

- `COLLECTION_CONFIG_SCHEMA` 与 `FRONT_MATTER_CONFIG_SCHEMA`：同一声明节点格式下的两个作用域入口，不建立第二套校验语言。
- 通用 `parseConfigSchema()`：接受 Schema、输入、来源和上下文，返回深冻结对象；`parseStellarConfig()` 继续作为主题入口包装。
- Schema 的外部字段白名单：只透传 Hexo 自有 Front Matter，并从 Stellar Reference 投影排除；未知 Stellar 字段仍严格拒绝。
- `collectionConfig` / `frontMatterConfig`：generate-before 解析后传给模型的冻结 camelCase 输入；原始 Hexo 页面对象不承担 Stellar 配置契约。

新增常量只用于 Schema 声明：Collection / Front Matter 的消费方、Hexo-owned Front Matter 白名单及旧字段替换表。默认来源仍为 `config-target.js`；参数袋仅限 `comments.options`、`seo.open_graph` 与 `render.diagrams`，不会扩大父级边界。

## 3. 最终输入契约

Collection YAML：

```yaml
name: Stellar
route:
  path: /wiki/stellar/
  start: index
navigation:
  tree:
    快速开始:
      - index
note_defaults:
  sidebar:
    left:
      widgets: [toc]
comments:
  provider: giscus
  options:
    data-repo: owner/repo
```

Front Matter：

```yaml
collection:
  profile: wiki
  id: stellar
render:
  math: katex
  diagrams: true
seo:
  open_graph:
    type: article
comments:
  provider: giscus
  options:
    data-mapping: pathname
inject:
  head: |
    <meta name="example" content="page">
```

规则：

- `routing` → `route`，`base_dir` → `path`；Wiki、Topic、Notebook 都使用 `route.path`，仅 Topic 使用 `route.start`。
- Wiki `tree` → `navigation.tree`；Notebook `note.sidebar` → `note_defaults.sidebar`。
- `collection.type` → `collection.profile`。
- 页面与 Collection 的 `comments.service` → `comments.provider`，第三方字段进入 `comments.options` 参数袋。
- `katex` / `mathjax` 合并为 `render.math`，值为 `false` 或 provider ID；`mermaid` → `render.diagrams`。
- `open_graph` → `seo.open_graph`；`title/date/tags/categories/robots` 等 Hexo 字段原名透传。
- YAML 为 snake_case；运行时使用 `route.path`、`noteDefaults`、`collection.profile`、`render.math`、`seo.openGraph` 等 camelCase。
- 数组完整替换；声明对象与参数袋按键合并；不做类型强转；最终对象深冻结。

## 4. 消费与兼容边界

- generate-before 对所有 Collection 数据和可读取的页面 Front Matter 只解析一次，诊断继续按来源聚合。
- Wiki / Topic / Notebook 生成器、树构建器、CollectionModel、PageViewModel 与按需插件装载只读取规范化字段。
- 模型公开结构暂时保持不变；例如配置 `comments.provider` 可在模型边界映射到当前 `presentation.comments.service`，全局 Extension 与模型术语由后续 Extension 切片统一迁移。
- Theme 根 Schema 继续开放未迁移顶层域；Collection 与 Front Matter 本身保持严格封闭。
- 不读取旧字段，不自动迁移输入，不修改公开 URL、模板视觉、客户端实现或依赖。

## 5. Reference 与状态

配置 Reference 增加 `collection` 与 `front_matter` scope 的 delivered 字段，并继续排除 Hexo-owned 外部字段和 planned 节点。`config-target.js` 中本切片节点改为 delivered；M1.5、M2 与 Alpha 1 保持未完成。

## 6. 验证

- 新字段解析、camelCase、默认、级联、数组替换、参数袋和深冻结测试。
- 旧字段、未知字段、错误类型、非法枚举、非法数值和作用域错误的来源化聚合诊断。
- 静态消费链测试确保运行时代码不再读取旧 Collection / Front Matter 路径。
- 主题 `npm run check`、知识库硬核查、主工程 `npm run g` 与 Wiki / Topic / Notebook / 数学图表页面产物抽查。
- Standards / Spec 双轨 review。
