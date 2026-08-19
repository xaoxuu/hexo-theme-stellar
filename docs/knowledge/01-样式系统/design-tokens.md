---
title: 设计令牌与 CSS 变量
domain: 样式系统
tags:
  - 设计令牌
  - CSS 变量
  - Stylus
---

# 设计令牌与 CSS 变量

<details>
<summary>相关源码文件</summary>

- [source/css/_custom.styl](../../../source/css/_custom.styl)
- [source/css/_components/collection.styl](../../../source/css/_components/collection.styl)
- [layout/layout.ejs](../../../layout/layout.ejs)
- [_config.yml](../../../_config.yml)

</details>

## 目的与范围

本文是 Stellar 公共设计令牌的权威页面。它记录令牌的语义、来源、响应式规则和消费方式；单个组件的普通 CSS 属性以组件源码为准，不在本文重复展开。

相关页面：

- [样式与主题定制](styling-overview.md)：样式层级和修改路径；
- [排版系统](typography.md)：字体、字号比例和内容排版；
- [颜色与深色模式](colors-dark-mode.md)：语义颜色和主题模式；
- [响应式设计](responsive-design.md)：断点和响应式策略。

## 令牌架构

主题通过两层令牌把配置转化为组件可消费的样式：

1. **Stylus 令牌**：构建期由 `hexo-config()` 读取配置，供 Stylus 和 mixin 使用；
2. **CSS 自定义属性**：输出到 `:root`，供响应式规则、局部覆盖和运行时逻辑使用。

配置 → `_custom.styl` → Stylus/CSS 令牌 → 组件样式。修改配置后需要重新构建；CSS 自定义属性的媒体查询覆盖由浏览器运行时处理。

## 公共令牌

### 字体与字号

| 令牌 | 配置来源 | 语义 |
| --- | --- | --- |
| `$ff-body` | `style.font-family.body` | 正文字体栈 |
| `$ff-code` | `style.font-family.code` | 行内代码字体栈 |
| `$ff-codeblock` | `style.font-family.codeblock` | 代码块字体栈 |
| `$fs-root` / `--fs-root` | `style.font-size.root` | 页面字号基准；移动端按响应式规则调整 |
| `$fs-code` | `style.font-size.code` | 行内代码字号 |
| `$fs-codeblock` | `style.font-size.codeblock` | 代码块字号 |

标题令牌从当前内容字号派生：`--fsh2`、`--fsh3`、`--fsh4` 分别用于 H2、H3、H4。组件需要局部调整排版时优先覆盖 `--fs-content`，让标题和段落继续沿用同一比例尺。

### 颜色与背景

| 令牌 | 配置来源 | 语义 |
| --- | --- | --- |
| `$c-theme` | `style.color.theme` | 主题主色 |
| `$c-accent` | `style.color.accent` | 强调色 |
| `$c-link` | `style.color.link` | 链接色 |
| `$c-base-hue` | 主题固定值 | 背景和文字色生成的基础色相 |
| `$site-background-image` | `style.site.background-image` | 全站背景图 |
| `$leftbar-background-image` | `style.leftbar.background-image` | 左栏背景图 |

组件优先使用语义颜色变量，例如 `var(--text-p1)`、`var(--card)`、`var(--block-border)` 和 `var(--theme)`；组件文档不应复制整套颜色值。

### 圆角

配置中的圆角令牌按组件层级分为大、中、小三档，并分别覆盖卡片、图片和横条元素：

| 令牌 | 语义 |
| --- | --- |
| `$border-card-l` / `$border-card` / `$border-card-s` | 大型、标准、小型卡片 |
| `$border-image-l` / `$border-image` / `$border-image-s` | 大型、标准、小型图片 |
| `$border-bar` | 导航栏、浮层、分页器等横条组件 |
| `$border-button` | 按钮默认圆角，当前为 `8px`，不是配置项 |

组件有特殊圆角时，知识库只记录该值对布局或视觉契约的影响，并链接对应组件页面；普通装饰性圆角以源码为准。

### 阴影

阴影令牌按层级复用：`$boxshadow-card` 用于普通卡片，`$boxshadow-float` 用于浮动元素，`$boxshadow-card-float` 用于悬停抬升，`$boxshadow-button`、`$boxshadow-block` 和 `$boxshadow-toast` 分别服务于对应组件层级。

阴影的具体函数值属于实现细节；除非变更影响组件层级或兼容性，否则不在领域页面重复列出。

## 布局与间距令牌

以下 CSS 自定义属性是跨组件布局契约：

| 令牌 | 当前默认值/规则 | 语义 |
| --- | --- | --- |
| `--width-main` | `720px`；2K 为 `780px`，4K 为 `860px` | 主内容最大宽度 |
| `--side-content-width` | 桌面 `224px`；平板 `188px` | 侧栏内容宽度 |
| `--gap-base` | `16px` | 组件内部基础间距 |
| `--gap-page` | 默认 `16px`；laptop 及以上 `32px` | 页面级留白 |
| `--gap-p` | `calc(var(--fs-root) + 4px)` | 标准段落间距 |
| `--gap-p-compact` | `calc(var(--fs-root) * 0.75)` | 紧凑段落间距 |

`--gap-base` 和 `--gap-page` 不能混用：前者控制组件内部节奏，后者控制页面边缘留白。新增或修改的普通间距优先从 `2 / 4 / 8 / 12 / 16 / 24 / 32px` 中选择；`16px` 组件内间距优先复用 `--gap-base`，页面级留白优先复用 `--gap-page`。该规则不追溯旧组件，1px 描边、尺寸、圆角、最小高度、动画位移与光学对齐值也不做机械替换。

移动端的侧栏宽度和字号存在专门的响应式覆盖；具体断点见[响应式设计](responsive-design.md)。

## 集合组件 Surface 令牌

`layout.ejs` 为页面区域声明 `data-ui-surface`：左栏按 `style.leftbar.ui-style` 取 `glass` 或 `card`，右栏取 `sidebar`，主内容区取 `content`。通用集合组件不读取页面位置，而由以下组件级语义变量适配表面：

| 令牌组 | 语义 |
| --- | --- |
| `--ui-item-bg` / `--ui-item-bg-hover` / `--ui-item-bg-active` | 普通、悬停与激活条目背景 |
| `--ui-item-shadow-hover` / `--ui-item-shadow-active` | 条目交互状态阴影 |
| `--ui-item-title` / `--ui-item-muted` | 标题与描述/meta 文字层级 |
| `--ui-item-padding-x` / `--ui-item-padding-y` / `--ui-item-min-height` | 条目自身几何尺寸 |
| `--ui-collection-gap` / `--ui-columns` / `--ui-grid-min` | 集合间距、最大列数和自适应最小列宽 |

surface 只改变背景、阴影与文字层级；list/grid、variant、density 负责几何。条目默认背景透明：glass 表面的 hover/active 使用顶部光照与高光边，其它表面使用 `var(--block)`；这些状态不使用过渡动画。`columns` 是 grid 的最大列数，实际列数由 `auto-fit/minmax` 按容器宽度自动降低，不能用于控制标题可见性。

这些变量定义在 `collection.styl` 的组件作用域中，不属于站点配置 API；其它通用紧凑集合可以消费，但专用展示组件不应借用它们改变自身布局。

## 变量使用规则

- 构建期确定、无需运行时变化的值使用 Stylus 令牌；
- 随视口、主题模式或组件状态变化的值使用 CSS 自定义属性；
- 组件优先消费语义令牌，不跨层读取另一个组件的私有变量；
- 新增公共令牌必须有稳定语义、明确消费方和唯一源码定义；
- 用户定制优先覆盖公开 CSS 变量或配置，不修改主题组件源码。

### 新增变量的判断

新增变量前先检查 `source/css/_custom.styl`、组件样式和已有 CSS 自定义属性：

- 多个组件共享的视觉或布局规则，提升为公共令牌，并在本页记录语义与来源；
- 单个组件的状态或布局值，保留在组件作用域，不伪装成公共令牌；
- 仅由浏览器尺寸、主题模式或交互状态驱动的值，优先使用 CSS 自定义属性；
- 仅服务于构建期计算的值，使用 Stylus 变量；
- 算法中间值、动画帧和一次性实验值留在实现中，不扩展令牌表。

例如 `$c-theme`、`$border-card` 和 `$gap-base` 是可复用设计令牌；Galaxy 的 `params` 是功能参数，不应混入全局样式令牌；`stellar.galaxy.mountAll(canvases)` 是行为复用入口，应通过接口复用而不是复制挂载逻辑。

## 事实来源与维护

当前默认值以 `source/css/_custom.styl` 和 `_config.yml` 为准。本文只解释公共令牌的语义和使用边界。修改令牌后同步更新本文及受影响的布局契约，并运行 `python3 docs/knowledge/tools/verify.py`。
