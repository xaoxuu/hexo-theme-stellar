---
title: Region 配置与模型扁平化
status: implemented
date: 2026-08-30
---

# Region 配置与模型扁平化

## 问题

预发布 v2 候选同时存在 `regions.*` 包装、Topbar/Rightbar 数组简写和 Leftbar 对象，导致配置、内容 Schema、模型与模板具有不同形状。调用方必须记忆作用域和 Region 的特殊写法，公开模型也额外保留一层无业务含义的 `regions`。

## 最终契约

- 主题全局、Profile、Collection、Front Matter 与 `note_defaults` 直接声明 `topbar/leftbar/rightbar`。
- 三个 Region 都是对象，Widget 数组只位于 `widgets`。
- Leftbar 额外拥有 `default_state/enabled/brand/menu/footer` 能力；Topbar 与 Rightbar 不获得这些能力。
- CollectionModel、ContentItemModel 与 PageViewModel 使用 `presentation.topbar/leftbar/rightbar`。
- 渲染模型使用 `render.layout.topbar/leftbar/rightbar`。
- Region 模块名、partial 路径、局部 Shell 槽位集合与 DOM `data-regions` 保持不变。

## 级联

顺序固定为主题全局、Profile、Collection、Page。每个 Region 的最后一个显式 `widgets` 数组整体替换此前数组；空数组清空；省略 Region 或 `widgets` 继承。数组不去重、不排序，能力不匹配的 Widget 仍按现有规则警告并跳过。

## 兼容与诊断

当前 v2 候选未形成公开兼容义务，不保留双读或自动迁移。Schema 直接拒绝：

- `regions.topbar/leftbar/rightbar`，迁移到对应顶层 Region；
- `note_defaults.regions.*`，迁移到 `note_defaults.*`；
- Region 数组简写，迁移到 `<region>.widgets`；
- 内容层 `leftbar.default_state` 与各作用域未知字段。

## 验收

- 配置、内容 Schema、公开模型与渲染模型不存在 `regions` 包装。
- 三个 Region 在公开运行时始终为包含 `widgets` 的冻结对象。
- Blueprint、Reference、知识文档、主站配置与公开 Wiki 示例只使用最终结构。
- Widget 顺序、Leftbar 固定槽位、响应式布局和最终 HTML 保持不变。
