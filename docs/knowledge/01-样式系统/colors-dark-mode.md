---
title: 颜色与深色模式
domain: 样式系统
tags:
  - 颜色
  - 深色模式
  - HSL
---

# 颜色与深色模式

<details>
<summary>相关源码文件</summary>

生成此页面时参考的主题源码文件：

- [source/css/_components/partial/navbar.styl](../../../source/css/_components/partial/navbar.styl)
- [source/css/_components/sidebar/search.styl](../../../source/css/_components/sidebar/search.styl)
- [source/css/_components/sidebar/sidebar.styl](../../../source/css/_components/sidebar/sidebar.styl)
- [source/css/_custom.styl](../../../source/css/_custom.styl)
- [source/css/_defines/func.styl](../../../source/css/_defines/func.styl)
- [source/css/_defines/theme_base.styl](../../../source/css/_defines/theme_base.styl)
- [source/css/_common/highlight.styl](../../../source/css/_common/highlight.styl)

</details>

## 目的与范围

本文介绍 Stellar 的颜色系统与深色模式实现：主题色如何配置、语义化颜色令牌的 CSS 变量架构，以及支持浅色、深色与系统偏好自动检测的多模式主题系统。

字体与排版见[排版系统](typography.md)；响应式见[响应式设计](responsive-design.md)；通用 CSS 工具与混入见[Stylus 工具与混入](stylus-utilities.md)。

## 颜色配置系统

主题颜色始于 `_config.yml` 的 `style.color` 小节，经 `_custom.styl`、`theme_base.styl` 与 `:root` CSS 块三阶段流水线转换为 Stylus 变量与 CSS 自定义属性。

### 配置到 CSS 的流程

**颜色变量流水线**

```mermaid
graph TD
    CONFIG[""_config.yml
 style.color.*""]
    CUSTOM[""_custom.styl
 $c-theme, $c-accent, $c-link""]
    THEME_BASE[""theme_base.styl
 x-set-theme-with-color()
 x-set-link-with-color()
 x-set-bg-colors()
 x-set-text-colors()""]
    ROOT["":root { }
 CSS custom properties""]
    COMPONENTS[""Component .styl files
 var(--theme), var(--link), etc.""]

    CONFIG -->|"hexo-config()"| CUSTOM
    CUSTOM -->|"$c-theme, $c-accent, $c-link"| THEME_BASE
    THEME_BASE -->|"dynamic-theme-light()
 dynamic-theme-dark()"| ROOT
    ROOT -->|"var() references"| COMPONENTS
```

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)、[source/css/_defines/theme_base.styl](../../../source/css/_defines/theme_base.styl)

### 主要颜色变量

三个主颜色值从 `_config.yml` 读取并转换为 `_custom.styl` 中的 Stylus 变量：

| 配置键 | Stylus 变量 | 生成的 CSS 属性 |
|--------|-------------|----------------|
| `style.color.theme` | `$c-theme` | `--theme`、`--theme-a10/20/30`、`--hue`、`--sat`、`--light` |
| `style.color.accent` | `$c-accent` | `--accent` |
| `style.color.link` | `$c-link` | `--link`、`--link-a20` |

配置转换使用 `hexo-config()` 与 `convert()`。

另外，`$c-base-hue`（默认 `210deg`）控制所有背景与文字颜色计算的基础色相，定义于 `_custom.styl`，被 `theme_base.styl` 全程消费。

### 基于 HSLA 的颜色生成（theme_base.styl）

`source/css/_defines/theme_base.styl` 提供一组 Stylus 函数，用 HSLA 颜色模型生成 CSS 变量声明，无需复制十六进制值即可实现组件级动态透明度。

**核心工具函数：**

| 函数 | 输出 CSS 变量 | 说明 |
|------|--------------|------|
| `x-hsla(h, s, l, a)` | （内联值） | 由分量参数构造 `hsla()` 字符串 |
| `x-theme-alpha(a)` | （内联值） | 用 `--hue`、`--sat`、`--light` 返回指定透明度 `a` 的主题色 |
| `x-set-theme-with-color($color)` | `--hue`、`--sat`、`--light`、`--alpha`、`--theme`、`--theme-a10/20/30` | 把 Stylus 颜色分解为 HSL 通道变量 |
| `x-set-link-with-color($color)` | `--link`、`--link-a20` | 设置链接色与半透明变体 |
| `x-set-bg-colors($scheme)` | `--bg-a20/50/60/75/100` | 设置按透明度阶梯的白/黑背景 |
| `x-set-text-colors($scheme)` | `--text`、`--text-p1/2/3/4`、`--text-meta`、`--text-code`、`--text-a10/20`、`--block`、`--block-border` | 设置完整文字与块颜色层级 |

**参考源码**：[source/css/_defines/theme_base.styl](../../../source/css/_defines/theme_base.styl)

`:root` 块用 `_custom.styl` 的 Stylus 变量调用这些函数。`$c-accent` 直接作为 `--accent` 应用，不做 HSLA 分解（不需要透明度变体）。

## CSS 变量架构

主题使用语义化 CSS 变量系统：令牌按用途命名而非外观。所有变量由 `theme_base.styl` 的函数定义在 `:root` 上，主题模式切换时自动更换值。

### 语义化颜色令牌图

**CSS 自定义属性参考**

```mermaid
graph TB
    ROOT["":root
(theme_base.styl)""]

    subgraph "Text (x-set-text-colors)"
        T0[""--text""]
        T1[""--text-p1""]
        T2[""--text-p2""]
        T3[""--text-p3""]
        T4[""--text-p4""]
        TM[""--text-meta""]
        TC[""--text-code""]
        TA[""--text-a10, --text-a20""]
    end

    subgraph "Background (x-set-bg-colors)"
        BG1[""--bg-a20""]
        BG2[""--bg-a50""]
        BG3[""--bg-a60""]
        BG4[""--bg-a75""]
        BG5[""--bg-a100""]
        BK[""--block""]
        BB[""--block-border""]
        BGM[""--background""]
        CD[""--card""]
    end

    subgraph "Interactive (x-set-theme-with-color / x-set-link-with-color)"
        TH[""--theme""]
        TH1[""--theme-a10/20/30""]
        LK[""--link""]
        LK2[""--link-a20""]
        AC[""--accent""]
    end

    ROOT --> T0
    ROOT --> BG1
    ROOT --> TH
```

**参考源码**：[source/css/_defines/theme_base.styl](../../../source/css/_defines/theme_base.styl)

### 颜色变量分类

**文字层级**（`x-set-text-colors($scheme)` 生成）：

| 变量 | Alpha | 用法示例 |
|------|-------|----------|
| `--text` | 1.0 | 主要正文 |
| `--text-p1` | 0.8 | 较强次级文本 |
| `--text-p2` | 0.7 | 普通次级文本 |
| `--text-p3` | 0.5 | 弱化文本 |
| `--text-p4` | 0.4 | 很弱文本，如行号 |
| `--text-meta` | 0.2 | 元信息、装饰 |
| `--text-code` | 0.9 | 行内代码；深色模式下覆盖 |

深色模式下 `--text-code` 显式设为暖色（HSL 20, 75%, 60%），而非标准 alpha 派生值。

**背景层级：**

- `--background`：页面根背景（`dynamic-theme-light()` / `dynamic-theme-dark()`）
- `--card`：卡片表面色；设置站点背景图时为 `rgba(white, 0.5)`
- `--block`：组件内部填充（代码块、表头等）
- `--block-border`：组件边框/分隔线色
- `--bg-a20` ~ `--bg-a100`：按透明度阶梯的中性背景，用于遮罩与状态

**交互：**

- `--theme`、`--theme-a10/20/30`：品牌主色与透明度变体
- `--accent`：悬停目标色（来自 `$c-accent`，直接应用在 `:root`）
- `--link`、`--link-a20`：超链接色与半透明变体

**参考源码**：[source/css/_defines/theme_base.styl](../../../source/css/_defines/theme_base.styl)、[source/css/_common/base.styl](../../../source/css/_common/base.styl)、[source/css/_common/highlight.styl](../../../source/css/_common/highlight.styl)

## 深色模式实现

主题实现三态主题系统：显式浅色、显式深色、系统偏好自动检测。三种状态都在 `theme_base.styl` 的 `:root` 层解析。

### `dynamic-theme-light()` 与 `dynamic-theme-dark()`

两个 Stylus 混入为各自模式定义完整颜色变量集：

| 混入 | 关键变量 |
|------|----------|
| `dynamic-theme-light()` | `--background: hsla(210, 20%, 98%, 1)`、`--card: white`（背景图时为半透明），然后调用 `x-set-bg-colors('light')` 与 `x-set-text-colors('light')` |
| `dynamic-theme-dark()` | `--background: hsla(210, 8%, 12%, 1)`（手机端为黑色）、`--card: hsla(210, 10%, 24%, 1)`（或半透明），然后调用 `x-set-bg-colors('dark')` 与 `x-set-text-colors('dark')` |

**参考源码**：[source/css/_defines/theme_base.styl](../../../source/css/_defines/theme_base.styl)

### 主题模式切换机制

**theme_base.styl 中 `:root` 选择器解析**

```mermaid
flowchart TD
    A["":root
(always applied)""]
    B[""@media (prefers-color-scheme: dark)""]
    C["":root[data-theme='light']""]
    D["":root[data-theme='dark']""]
    LIGHT[""dynamic-theme-light()""]
    DARK[""dynamic-theme-dark()""]

    A -->|"default"| LIGHT
    A --> B
    B -->|"system prefers dark"| DARK
    C -->|"explicit override"| LIGHT
    D -->|"explicit override"| DARK
```

**参考源码**：[source/css/_defines/theme_base.styl](../../../source/css/_defines/theme_base.styl)

`<html>` 元素上的 `data-theme` 属性提供显式用户覆盖。缺省时 `:root` 内的 `@media (prefers-color-scheme: dark)` 提供系统级自动检测。

### 组件中的主题选择器模式

当 CSS 变量无法表达模式专属覆盖（如 `backdrop-filter` 透明度、`box-shadow` 细节）时，组件文件重复三段式选择器：

**模式 1 — 显式深色：**

```
:root[data-theme="dark"] &
```

**模式 2 — 系统偏好兜底：**

```
@media (prefers-color-scheme: dark)
```

### `ondark()` / `onlight()` 混入模式

`ondark()` 与 `onlight()` 是 Stylus 块混入，作为其他混入中的简写容器。`func.styl` 的 `hoverable-card()` 展示了完整模式：

结构为：

1. 用 `onlight()` / `ondark()` 块定义模式专属属性值
2. 在 `:root[data-theme="light"]` 与 `:root[data-theme="dark"]` 下应用同样的块，实现显式覆盖
3. 在 `:root:not([data-theme])` 内应用默认值加 `@media (prefers-color-scheme: dark)` 兜底，实现自动检测

这保证：

- 显式 `data-theme` 属性优先于系统偏好
- 无 `data-theme` 时应用系统偏好
- 两者皆无时默认浅色

同一模式也出现在 `newblur()`、侧边栏样式与搜索样式中。

**参考源码**：[source/css/_defines/func.styl](../../../source/css/_defines/func.styl)、[source/css/_components/sidebar/sidebar.styl](../../../source/css/_components/sidebar/sidebar.styl)、[source/css/_components/sidebar/search.styl](../../../source/css/_components/sidebar/search.styl)

## 颜色应用模式

### 侧边栏背景色

左栏（`.l_left .sidebg`）支持图片背景与纯色背景，各有深色模式调整。`$leftbar-background-image`、`$leftbar-background-color-light`、`$leftbar-background-color-dark` 从 `_config.yml` 经 `_custom.styl` 读取。

**`.l_left .sidebg` 背景解析逻辑**

```mermaid
flowchart TD
    START[""$leftbar-background-image set?""]
    IMG[""Image mode:
 filter: saturate blur opacity(--background-opacity)""]
    DARK_IMG[""Dark: --background-opacity *= 0.75"
[:root[data-theme=dark] / prefers-color-scheme:dark]"]
    COLOR_CHECK[""$leftbar-background-color-light/dark set?""]
    COLOR[""Color mode:
 background-color: $leftbar-background-color-light""]
    DARK_COLOR[""Dark: background-color: $leftbar-background-color-dark""]
    NONE[""Default: transparent""]

    START -->|"yes"| IMG
    IMG --> DARK_IMG
    START -->|"no"| COLOR_CHECK
    COLOR_CHECK -->|"yes"| COLOR
    COLOR --> DARK_COLOR
    COLOR_CHECK -->|"no"| NONE
```

**参考源码**：[source/css/_components/sidebar/sidebar.styl](../../../source/css/_components/sidebar/sidebar.styl)、[source/css/_custom.styl](../../../source/css/_custom.styl)

| 变量 | 来源 | 用途 |
|------|------|------|
| `$leftbar-background-image` | `_custom.styl` | 背景图 URL |
| `$leftbar-background-color-light` | `_custom.styl` | 浅色模式纯色 |
| `$leftbar-background-color-dark` | `_custom.styl` | 深色模式纯色 |
| `--blur-px` | `sidebar.styl` CSS 变量 | 图片模糊半径 |
| `--background-opacity` | `sidebar.styl` CSS 变量 | 图片透明度；深色模式乘以 0.75 |

### 导航栏激活状态颜色

导航栏激活链接浅色模式用 `--bg-a60`，深色模式回退到硬编码 `rgba(white, 0.25)`——因为 `--bg-a60`（白色 60% 透明度）在深色玻璃表面视觉上不明显。

这是语义变量在浅色模式足够、但深色模式需要直接覆盖的代表性案例。

## 语法高亮颜色系统

代码块采用混合方案：语法令牌用固定 Stylus 颜色常量，文字与背景用随主题模式切换的语义 CSS 变量。

### 语法令牌颜色常量

定义于 `highlight.styl`：

| Stylus 变量 | Hex | 令牌用途 |
|-------------|-----|----------|
| `$hl-keyword` | `#8959a8` | 关键字、`javascript .function` |
| `$hl-blue` | `#1E80F0` | 类型、内建对象、标签名 |
| `$hl-cyan` | `#17AFCA` | HTML/CSS 上下文中的数字 |
| `$hl-green` | `#3FA33F` | 字符串、diff 新增 |
| `$hl-red` | `#EE2B29` | diff 删除、HTML 标签名 |
| `$hl-orange` | `#FB3F1B` | — |
| `$hl-amber` | `#FD8607` | 变量、数字字面量、常量 |

**主题感知令牌变量：**

- `$hl-text` 解析为 `var(--text-p1)`——主代码文字，随深色模式切换
- `.comment` 用 `var(--text-p4)` 加 `font-style: italic`
- 语言标签徽章用 `var(--theme)` 的 25% 透明度

**参考源码**：[source/css/_common/highlight.styl](../../../source/css/_common/highlight.styl)

### 块级颜色分配

行内代码与代码块都用 `var(--block)` 作背景，由 `x-set-text-colors()` 定义并随主题模式自动切换。

- 行内代码（`p>code:not([class])`、`li>code:not([class])`）：`background: var(--block)`、`color: var(--text-code)`
- 代码块（`.md-text .highlight`）：`background: var(--block)`、局部 `--theme: var(--text-p3)`

深色模式下 `--text-code` 切换为暖琥珀色（`dynamic-theme-dark()` 中显式设置），而非标准中性 alpha 派生值。

## 模糊与玻璃效果

`func.styl` 的 `newblur()` 混入用堆叠的 `::before` / `::after` 伪元素加 `backdrop-filter` 实现磨砂玻璃效果。两个伪元素都用标准选择器模式做深色模式调整。

### `newblur()` 层结构

**`newblur()` 伪元素组成**

```mermaid
graph TB
    ELEM[""Element (.navbar-blur)
 newblur() applied""]
    BEFORE[""&:before
 backdrop-filter: blur(8px)
 background: rgba(white, 0.3)""]
    AFTER[""&:after
 backdrop-filter: saturate blur
 mask: linear-gradient
 box-shadow: inset rgba(white, 0.5)""]
    DARK_BEFORE[""Dark mode:
 background: rgba(white, 0.2)""]
    DARK_AFTER[""Dark mode:
 box-shadow: inset rgba(white, 0.2)""]

    ELEM --> BEFORE
    ELEM --> AFTER
    BEFORE -->|":root[data-theme=dark]
 @media prefers-color-scheme:dark"| DARK_BEFORE
    AFTER -->|":root[data-theme=dark]
 @media prefers-color-scheme:dark"| DARK_AFTER
```

**参考源码**：[source/css/_defines/func.styl](../../../source/css/_defines/func.styl)

- `&:before`：基础模糊层。浅色 `rgba(white, 0.3)`；深色降到 `rgba(white, 0.2)`。
- `&:after`：饱和度 + 模糊层，带渐变遮罩与内嵌高亮环。深色模式下环透明度从 `0.5` 降到 `0.2`。
- 元素自身 `text-shadow`：浅色为高透明度白色光晕；深色为近乎透明的黑色阴影。

应用于 `.navbar-blur`。

## 最佳实践

### 使用颜色变量

**推荐：** 使用随主题模式切换的语义变量

```stylus
color: var(--text-p1)
background: var(--block)
border-color: var(--block-border)
```

**避免：** 不响应主题变化的硬编码颜色

```stylus
color: #333333  // 深色模式下不会变
background: white  // 深色模式下不会变
```

### 实现自定义主题感知样式

需要主题专属行为的自定义样式遵循此模式：

```stylus
.custom-component
  // 两种模式通用的基础样式
  color: var(--text)
  
  // 浅色模式专属
  :root[data-theme="light"] &
    // 浅色模式覆盖
  
  // 深色模式专属
  :root[data-theme="dark"] &
    // 深色模式覆盖
  
  // 系统偏好（未设置 data-theme 时）
  :root:not([data-theme]) &
    // 默认（通常为浅色）样式
    @media (prefers-color-scheme: dark)
      // 系统偏好深色时的样式
```

**参考源码**：[source/css/_defines/func.styl](../../../source/css/_defines/func.styl)

### 颜色变量命名

主题命名约定：

- **文字：** `--text`、`--text-p1` ~ `--text-p4`（强调度递减）
- **背景：** 页面背景用 `--bg-*`，组件背景用 `--block`
- **边框：** `--block-border` 与组件专属边框变量
- **交互：** `--link`、`--accent`、`--theme`
- **透明度混合：** `--bg-a20`、`--bg-a50` 等（数字表示近似不透明度）

**参考源码**：[source/css/_common/base.styl](../../../source/css/_common/base.styl)、[source/css/_components/partial/navbar.styl](../../../source/css/_components/partial/navbar.styl)
