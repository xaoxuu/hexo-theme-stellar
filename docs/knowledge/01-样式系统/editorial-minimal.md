---
title: Editorial Minimal 有机编辑式极简
domain: 样式系统
tags:
  - Appearance
  - Minimal
  - 交互
  - 排版
---

# Editorial Minimal 有机编辑式极简

<details>
<summary>相关源码文件</summary>

- [source/css/_appearances/minimal.styl](../../../source/css/_appearances/minimal.styl)
- [source/css/_appearances/_mixins.styl](../../../source/css/_appearances/_mixins.styl)
- [source/css/main.styl](../../../source/css/main.styl)

</details>

`appearance.preset: minimal` 对应 Stellar 的 **Editorial Minimal（有机编辑式极简）**。它以编辑排版建立信息层级，让内容、留白和文字成为界面主体；普通组件不通过卡片背景、边框或阴影声明自身存在。

## 设计原则

- **内容优先**：布局、间距和排版先于容器装饰。
- **透明表面**：Region、普通导航、列表、Widget、分页和纯文字卡片不创建填充表面。
- **自然滚动**：Topbar 与 Listing Nav 不吸顶，随内容离开视口；左右栏继续沿用布局层既有的滚动与 Drawer 行为。
- **直接反馈**：文字链接复用文章卡片标题的普通主题色下划线，复合控件使用 `var(--text-p3)` 内描边，不通过背景填充或悬浮阴影反馈。
- **低动态**：普通交互不位移、不上浮；减少动态效果时立即切换状态。
- **语义例外**：需要表达输入边界、层级遮挡、代码语境、状态或媒体裁切的组件保留必要表面。

## 表面分类

| 类型 | 默认表现 | 交互反馈 |
| --- | --- | --- |
| Region、Listing Nav、普通 Widget、分页 | 透明、无边框、无阴影 | 由内部条目反馈 |
| 单行文字导航、归档链接、纯文字文章标题 | 无填充 | 文章标题式主题色半透明下划线；Menu Item hover 额外显示 `var(--text-p3)` 容器内描边 |
| TOC | 无填充 | 沿用组件自身的文字 hover/current 状态，不绘制下划线或当前项边框 |
| 图标按钮、摘要/网格条目、Tag、Link Card | 无填充 | `1px var(--text-p3)` 内描边 |
| 纯文字 Post、无封面 Wiki Card | 透明、无外层阴影 | 标题下划线或 `var(--text-p3)` 内描边 |
| 图片 Post、Wiki Cover、Pin Slider | 保留媒体裁切，不保留悬浮阴影 | `var(--text-p3)` 内描边；允许轻微二维图片缩放 |
| 代码、提示、表单、Dialog、Dropdown、状态信息 | 保留语义表面 | 由组件自身状态负责 |

间距负责分组，分隔线只在内容结构确实需要时出现，例如文章页脚的内部章节、表格行和输入区域；不能用连续边界重新构造普通卡片。

## 交互状态

| 状态 | 文字型交互 | 复合或图标交互 |
| --- | --- | --- |
| Idle | 无背景、无边界 | 无背景、无边界 |
| Hover | 普通主题色下划线淡入并向上展开，文字使用 `var(--text-p0)` | 显示 `var(--text-p3)` 的 1px 内描边 |
| Focus visible | 显示下划线，文字使用 `var(--text-p0)`，并保留 2px 主题色焦点轮廓 | 显示内描边，并保留 2px 主题色焦点轮廓 |
| Active / Current | 持续显示下划线，文字使用 `var(--text-p0)` | 持续显示内描边 |
| Reduced motion | 无展开动画，直接显示最终状态 | 无过渡，直接显示最终状态 |

下划线直接沿用文章卡片标题既有视觉：位于文字下层的主题色短条，从 `0` 高度与透明状态过渡到 `8px`、`0.5` opacity，不使用不规则渐变。采用下划线的交互容器不保留自身 padding，原 padding 数值等值迁移为 margin，以保持布局节奏而不扩大下划线范围；Side Region 中包含图标与文字的导航条目只在内部标题文字下方绘制下划线，Listing Nav 的纯文字链接则收缩为文字行盒后绘制。Menu 条目优先使用自身 `--item-theme`，未设置时回退到全局 `--theme`。纯文字文章卡片的正文容器不保留 padding 或 margin，文章之间由 `.post-card-wrap` 的 `3rem 0` margin 分组。内描边统一使用 `var(--text-p3)` 并通过 inset shadow 绘制，不改变盒模型尺寸；采用内描边反馈的元素统一使用直角。

## 排版

Editorial Minimal 推荐中文人文衬线、宋体或文楷与西文 Serif 搭配，但 Appearance 不拥有字体选择权。实际字体始终读取 `appearance.typography.font_family.body`，代码字体继续读取 `appearance.typography.font_family.code`。

```yaml
appearance:
  preset: minimal
  typography:
    font_family:
      body: 'ui-serif, "Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", serif'
```

这是推荐示例而不是 Minimal 的隐式默认值。站点已经配置其他阅读字体时，切换 preset 不会覆盖该配置。

## Card Hover 与媒体

Minimal 本身不启用 Spotlight 或 Tilt。`features.card_hover.enabled` 是独立的显式 Feature：保持关闭时只使用 Editorial 交互；使用方主动启用后，Spotlight/Tilt 可以叠加到声明了 Card Hover 能力的组件上。

图片是内容而不是装饰表面，因此普通封面和 Pin Slider 保留各组件默认的圆角裁切、明暗处理和轻微二维缩放。卡片外层不得因此恢复阴影、上浮或背景填充。

## 实现边界

- Appearance 在构建期只编译当前 preset，Minimal 规则集中在 `_appearances/minimal.styl`，不让组件判断自己位于哪个 Region。
- Dropdown、Popover 和 Dialog 的浮层材质独立于整站 Appearance，不能为了“无背景”破坏遮挡层级或可读性。
- Leftbar 与 Rightbar 在常驻布局中透明；进入 Drawer 状态并覆盖正文时，Surface 使用不透明 `var(--card)` 背景，不恢复普通卡片阴影。
- 新的普通交互先接入共享 UI capability；只有现有 DOM 无法表达文字型或复合型差异时，才在 Minimal 中增加窄作用域选择器。
- 视觉验收同时检查浅色、深色、键盘焦点、粗指针和 `prefers-reduced-motion`。
