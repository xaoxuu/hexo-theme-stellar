---
title: 样式与主题定制
domain: 样式系统
tags:
  - 样式
  - 设计令牌
  - Stylus
---

# 样式与主题定制

<details>
<summary>相关源码文件</summary>

- [source/css/_custom.styl](../../../source/css/_custom.styl)
- [source/css/_defines/func.styl](../../../source/css/_defines/func.styl)
- [source/css/_components/](../../../source/css/_components/)

</details>

## 适用范围

本文回答两个问题：主题样式如何分层，以及修改样式时应从哪里开始。公共令牌见[设计令牌与 CSS 变量](design-tokens.md)，不要在本文重复维护令牌表。

## 样式层级

Stellar 的样式链路为：

1. `_config.yml` 的 `style` 配置；
2. `source/css/_custom.styl` 生成 Stylus 和 CSS 令牌；
3. `source/css/_defines/` 提供通用 mixin 和工具；
4. `source/css/_components/` 实现页面和组件样式；
5. 媒体查询、主题模式和组件状态完成响应式与运行时适配。

修改前先判断问题属于配置、令牌、工具、组件还是响应式层。能通过配置或公共变量解决的问题，不应复制组件 CSS。

## 修改路径

| 目标 | 首选位置 |
| --- | --- |
| 主题色、字号、圆角、公共间距 | `_config.yml` 或设计令牌 |
| 多组件共用的 CSS 模式 | `source/css/_defines/func.styl` |
| 单个组件的结构和样式 | `source/css/_components/` |
| 页面结构 | `layout/` |
| 交互状态 | `source/js/` 与对应组件样式 |
| 使用方自定义 | 配置、注入 CSS 或站点自己的覆盖文件 |

组件样式消费公共令牌；组件私有值只有在形成稳定布局或交互契约时才需要进入知识库。

## 响应式规则

响应式优先通过公共 CSS 变量和已有断点完成。页面级留白使用 `--gap-page`，组件内部间距使用 `--gap-base`；主内容宽度和侧栏宽度使用设计令牌页面定义的变量。

新增媒体查询前确认：

- 是否能通过已有变量级联解决；
- 是否会造成横向溢出或布局跳变；
- 是否需要同时覆盖主题模式、触控和无 JS 状态；
- 是否应成为公共令牌或行为契约。

## 视觉效果与状态

玻璃背景、卡片悬停、滚动条、文本省略和过渡动画由 `func.styl` 的公共工具或对应组件实现。知识库记录“何时启用、影响什么、失败时如何降级”；具体 `filter`、`transform`、阴影和过渡值以源码为准，只有兼容性或验收需要时才记录精确值。

## 定制原则

- 优先使用公开配置和 CSS 自定义属性；
- 通过语义变量保持明暗主题和响应式行为；
- 自定义样式放在使用方工程，避免修改主题核心文件；
- 必须覆盖组件私有选择器时，记录覆盖目的和受影响页面；
- 主题升级后检查选择器、变量和加载顺序。

详细覆盖方式见[自定义样式与主题覆盖](../09-高级主题/custom-styling-overrides.md)。

## 知识库维护边界

本文只维护架构、修改路径和判断规则。公共数值只链接到[设计令牌与 CSS 变量](design-tokens.md)；组件独有的行为契约放在对应内容或布局页面；历史方案放在 `docs/designs/`。修改后运行知识库硬事实核查。
