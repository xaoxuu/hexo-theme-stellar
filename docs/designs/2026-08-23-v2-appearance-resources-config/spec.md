---
title: Stellar v2 外观与资源兜底配置
date: 2026-08-23
status: 已完成
---

# 外观与资源兜底配置方案

## 1. 问题与目标

`style` 与 `default` 仍是 M1.5 中最后一组属于 Shell / 内容默认阶段的旧根配置。它们同时被 Stylus、EJS、helper、filter、tag plugin 和 PageViewModel 元数据直接读取，字段包含连字符、物理单位、实现库名称和含糊用途。

本切片把全部有效字段直接迁入 #704 冻结的 `appearance` 与 `resources.fallbacks`，由同一声明式 Schema 提供默认值、严格校验、snake_case → camelCase 规范化、深冻结运行时对象和 Reference 元数据。当前视觉、资源 URL、CSS 变量与页面行为保持不变。

## 2. 最终配置契约

`appearance` 交付以下封闭子树：

- `color_scheme`
- `typography.font_size/font_family/text_align/heading_prefixes`
- `shape.corner/radius`
- `colors`
- `gradients`
- `motion.page_transition/avatar`
- `code_block.scrollbar_width/highlight_theme`
- `backgrounds.sidebar/page`

`resources.fallbacks` 交付：

- `avatar`、`link_card`、`cover`、`project_icon`、`banner`、`topic_cover`
- `image.content`、`image.tag_plugin`
- `error_page`

旧 `style.prefix` 删除；`style.loading.*` 内部化到语言文件。`resources.preconnect` 保持 #705 已交付状态。旧 `style` / `default` 与旧子字段只用于结构化迁移诊断，不提供兼容读取。

## 3. 复用接缝与实现

复用 `config-target.js`、`CONFIG_SCHEMA`、`parseStellarConfig()`、`stellar_config()` helper、Stylus `hexo-config()` 和双 Reference 生成器，不建立第二套默认或解析入口。

- `_config.yml` 成为最终主题默认 YAML；目标契约中的占位默认按当前实际值校正，避免视觉漂移。
- EJS 与 Node.js 消费 `hexo.stellar.config.appearance/resources`，Stylus 编译消费最终 YAML 路径。
- PageViewModel 元数据中的外观派生来源改为最终运行时路径。
- tag plugin 与图片回退链按语义读取对应 fallback；`image.tag_plugin` 保留当前 data URI / icon 兜底结果。
- 主工程 `_config.stellar.yml` 只迁移已有覆盖，不引入新覆盖。

## 4. 影响范围与边界

影响 `_config.yml`、配置目标/Schema/Reference、Stylus 设计令牌与组件条件、布局/helper/filter/tag plugin 消费链、配置与样式知识库，以及主工程配置和 v2 蓝图。

不迁移 `extensions`、数据服务、`api_host`、内部 `stellar/system` 或根级未知字段拒绝；不修改公开 Wiki、依赖、URL、视觉设计或客户端算法。M1.5、M2 与 Alpha 1 保持未完成。

## 5. 验证

- 默认值、站点覆盖、camelCase、深冻结、枚举和数值约束测试。
- 旧根/旧子字段、未知字段与错误类型的来源化聚合诊断测试。
- 静态消费链测试确保运行时与 Stylus 不再读取 `style.*` / `default.*`。
- 配置 Reference 漂移检查、主题 `npm run check`、知识库硬核查和主工程 `npm run g`。
- 抽查首页、普通 Post、Wiki、Notebook、404、代码高亮与标签插件资源兜底产物。
- Standards / Spec 双轨 review。
