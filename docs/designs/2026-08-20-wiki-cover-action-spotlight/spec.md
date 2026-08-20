---
title: Wiki Hero 操作按钮 Spotlight
date: 2026-08-20
status: 已实施
---

# Wiki Hero 操作按钮 Spotlight 方案

## 1. 问题与目标

Wiki Hero 的“源码”“文档”和自定义 action 按钮尚未参与 Card Hover 生命周期。目标是为三类按钮增加鼠标跟随 Spotlight，同时保留原有几何、配色、链接与环境降级行为。

## 2. 技术方案

- 复用现有 `plugins.card_hover` 配置、`.card-hover.card-hover--spotlight` 组合类、`stellar.cardHover.mountAll()` 生命周期和 `.card-hover__spotlight` 覆盖层。
- Wiki Hero 三类按钮只声明 Spotlight，不声明 `.card-hover--tilt`，不新增常量、变量、配置、mixin、客户端接口或依赖。
- 源码按钮现有反色样式只作用于直接子级图标和标题，并显式排除运行时注入的 Spotlight 层。
- 初始化、失败降级、页面隐藏、销毁、触屏和减少动态效果行为全部沿用 Card Hover 插件现有契约。

## 3. 影响范围

- 模板与样式：Wiki Hero partial 及 cover 组件样式。
- 测试：Card Hover 标记契约测试。
- 文档：Wiki 文档系统、Card Hover 插件接入范围、前端生命周期与 `VERIFICATION.md`。
- 不涉及 `scripts/`、语言文案、数据结构或迁移。

## 4. 验证方式

- 标记测试覆盖源码、文档和自定义 action 三条输出路径，并确认没有 Tilt。
- 执行 `npm run check`、知识库硬事实核查和主工程 `npm run g`。
- 在 Stellar Wiki 首页检查三类按钮的 Spotlight、原有颜色、链接与无位移行为。
