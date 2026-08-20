---
title: 全局卡片 Hover 光效与倾斜
date: 2026-08-20
status: 已通过
---

# 全局卡片 Hover 光效与倾斜方案

## 1. 问题与目标

现有 `hoverable-card()` 只能提供固定上浮与阴影，无法表达鼠标位置，也依赖各组件选择器。新增组合类驱动的跨组件能力，让现有和未来卡片按需组合 Spotlight 与 Tilt，插件关闭时不改变静态表现。

成功标准：

- `.card-hover` 提供统一生命周期，`--spotlight` / `--tilt` 修饰类控制独立能力。
- 覆盖文章、笔记、笔记本、Wiki、link、`grid bg:card`、置顶轮播外层、专栏最新文章卡片与标准 UI Collection 条目；Collection 只启用 Spotlight，不启用 Tilt。
- 动态内容、键盘、触屏、减少动态效果、失败降级和销毁路径完整。

## 2. 技术方案

### 复用现有能力

- 复用 `plugins.*.enable` 的条件加载机制、`stellar.initPlugin()` 生命周期与浏览器 `requestAnimationFrame()`。
- 复用 `$boxshadow-card`、组件既有圆角与 `hoverable-card()` 的 2px 上浮语义。
- 保留文章/Wiki/轮播/专栏封面子元素的缩放、变暗与边框反馈；Tilt 仅作用于卡片本体，不修改 ScrollReveal 包装器或轮播内部 `.pin-slider-track` 的横向 transform。

### 新增接口

- 配置 `plugins.card_hover.enable`、`spotlight_color`、`max_tilt`；默认关闭、白色半透明光斑、最大 3°。
- 类契约：`.card-hover`、`.card-hover--spotlight`、`.card-hover--tilt`。
- 标准 `.ui-collection__item` 统一组合 `.card-hover.card-hover--spotlight`；TOC/搜索的 `.ui-collection-adapter` 不接入。
- CSS 变量 `--card-hover-spotlight-color` 允许单卡覆盖。
- 客户端 API：`stellar.cardHover.mountAll(root)` 与 `stellar.cardHover.destroy()`。

### 运行时行为

- 挂载时按修饰类创建 `aria-hidden`、`pointer-events:none` 的 Spotlight 层并绑定指针事件。
- 指针移动经单卡 rAF 节流，位置写入光斑坐标和最大 ±3° 的旋转变量；离开时 Tilt 立即回正，Spotlight 保留最后指针坐标淡出，`opacity` 过渡完成且卡片未重新激活、未持有焦点时再无感回中。
- `focus-within` 只显示居中光斑；指针离开仍保持焦点或纯键盘进入时立即切回中心。非精细指针或减少动态效果时不挂载动态能力。
- 监听 `stellar:mdrender` 增量挂载，页面隐藏时复位；销毁时取消帧、移除事件和注入层。

## 3. 影响范围

- 配置与加载：`_config.yml`、插件 EJS、插件样式索引。
- 客户端与样式：`source/js/plugins/`、`source/css/_plugins/`。
- 调用方：文章/Wiki/笔记本/笔记模板，置顶轮播外层、专栏最新文章卡片，link/grid 标签输出，公共 collection item 与两套 dropdown 渲染器。
- 文档：配置、插件系统、卡片、标签插件、前端交互知识库及主仓库 Wiki。
- 无新增依赖、语言文案或数据迁移。

## 4. 验证方式

- 标记与标签渲染单测确认 Collection 只输出 Spotlight 组合类，其它卡片组合类只出现在预期结构。
- `npm run check`、主工程 `npm run g`。
- 浏览器覆盖首页轮播、专栏列表、Wiki、笔记本、文章 link/grid；检查明暗主题、封面、焦点、减少动态效果、触屏和动态 Markdown。
