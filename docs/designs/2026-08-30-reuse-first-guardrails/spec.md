---
title: 复用优先与硬编码防护
date: 2026-08-30
status: 已实施
---

# 复用优先与硬编码防护方案

## 1. 问题与目标

模板、标签插件和浏览器动态节点过去可以直接拼写视觉组合类，导致 Brand Stats 一类控件容易遗漏通用交互；已有设计令牌和内部常量也可能在消费方被重新硬编码。目标是让复用成为默认代码入口，并让 CI 只拦截高置信度的重复语义，而不是禁止所有数字字面量。

成功标准：

- 标准控件通过同一个能力注册表得到交互类；动态节点消费服务端投影的同一注册表。
- 未分类的 Shell、Region、Sidebar、Widget 和公共组件控件会使 `reuse:check` 失败。
- 已登记的组合类、按钮圆角、请求/缓存策略字段与内部资源地址不能在消费方重新硬编码。
- 合法局部尺寸以“文件 + 选择器/字段 + 理由”登记，不依赖行号或 Git diff 基线。

## 2. 技术方案

### 2.1 UI capability

`scripts/lib/ui-capabilities.js` 是内部单一事实来源，深层契约只有五个冻结能力：

| 能力 | 组合 |
| --- | --- |
| `interactive` | Appearance 交互状态 |
| `interactiveSpotlight` | 默认交互状态与 Spotlight |
| `collectionItem` | Collection Item、交互状态与 Spotlight |
| `spotlight` | 仅 Spotlight |
| `hoverCard` | Spotlight 与倾斜卡片 |

EJS 使用 `ui_classes(baseClass, capability = "interactiveSpotlight", modifiers = "")`；标签插件直接调用同模块导出的 `composeUiClasses`；浏览器动态节点读取 `ctx.ui.classes`。未知能力立即抛错，调用方不能静默回退。

### 2.2 复用检查

`ci/reuse-rules.js` 登记扫描范围、plain-link 例外、动态控件契约和受保护语义值；`ci/check-reuse-contracts.js` 执行以下检查：

1. 受管模板中的 `<a>`、`<button>`、`<summary>` 必须调用 capability，或作为带稳定选择器与理由的 plain-link 登记。
2. 模板、标签和客户端脚本不得直接拼写 capability 组合类；注册表定义文件除外。
3. `$border-button`、内部请求/缓存字段以及内部资源地址不得在消费方重新写规范值。
4. 局部几何例外必须绑定文件和选择器/字段并说明语义；行号变化不影响例外。

新增 capability 会自动进入原始组合类检查；新增内部资源地址会由内部常量树自动进入保护规则。新增设计令牌或非地址内部策略字段时，必须同步在 `PROTECTED_LITERALS` 登记规则。

## 3. 影响范围

- 迁移 Brand Stats、Collection Item、Dropdown、Footer Actions、Cap Action、Region Controls、搜索结果及现有 Hover Card 消费方。
- Shell Dock 与搜索关闭按钮显式选择 `interactive`；第三方资料卡的内容链接以带理由的 plain-link 保留专属表面。
- 按钮语义的 `8px` 圆角改为 `$border-button`；Gallery 裁剪、Toast 容器和时间线标记等局部几何保留登记例外。
- 这是主题内部契约，不增加公开配置、Schema、Front Matter 或兼容层；普通开发不更新知识库、Wiki、CHANGELOG。

## 4. 验证方式

- capability 单测：顺序、默认能力、修饰类、冻结状态、未知能力。
- checker fixture：合法复用、遗漏能力、原始组合类、受保护值、局部例外、plain-link 例外。
- 渲染与客户端契约：Brand Stats、Collection Item、Dropdown、Cap Action、Region、两种搜索结果。
- 编译四种 Appearance，执行 `npm run check` 与主工程 `npm run g`；无关既有 Appearance/Brand 基线失败单独记录。
- 在实际页面检查 Brand Stats 的 class、Spotlight 挂载以及 hover/focus 计算样式。
