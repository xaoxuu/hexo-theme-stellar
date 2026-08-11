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

生成此页面时参考的主题源码文件：

- [source/css/_custom.styl](../../../source/css/_custom.styl)

</details>

## 目的与范围

本文介绍 `_custom.styl` 中实现的设计令牌系统，它是 Stellar 主题的基础样式层。设计令牌是保存视觉设计属性（字体、颜色、间距、边框等）的命名变量。主题采用双层方案：Stylus 变量用于构建期配置，CSS 自定义属性用于运行时主题与响应式适配。

排版细节（字号策略与响应式缩放）见[排版系统](typography.md)；颜色系统与深色模式见[颜色与深色模式](colors-dark-mode.md)；响应式模式与断点见[响应式设计](responsive-design.md)。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

## 架构概览

设计令牌系统以三层级联把配置值转化为可用的设计原语：

```mermaid
graph TB
    subgraph "Configuration Source"
        CONFIG["_config.yml<br/>style section"]
    end
    
    subgraph "Build-Time Layer"
        HEXOCONFIG["hexo-config() function"]
        STYLUSVARS["Stylus Variables<br/>$ff-body, $c-theme, $border-card"]
        CALCULATIONS["Calculated Values<br/>$fsh1-$fsh5, $fsp0-$fsp3"]
    end
    
    subgraph "Runtime Layer"
        CSSROOT[":root CSS Custom Properties"]
        CSSWIDTH["--width-main"]
        CSSGAP["--gap-margin, --gap-padding"]
        CSSFONT["--fsp, --fsh2, --fsh3"]
    end
    
    subgraph "Component Consumption"
        LAYOUTS["Layout Styles<br/>sidebar, navbar, main"]
        COMPONENTS["Component Styles<br/>md-text, post-card"]
        UTILITIES["Utility Functions<br/>func.styl mixins"]
    end
    
    CONFIG --> HEXOCONFIG
    HEXOCONFIG --> STYLUSVARS
    STYLUSVARS --> CALCULATIONS
    STYLUSVARS --> CSSROOT
    CALCULATIONS --> CSSROOT
    
    CSSROOT --> CSSWIDTH
    CSSROOT --> CSSGAP
    CSSROOT --> CSSFONT
    
    STYLUSVARS --> LAYOUTS
    STYLUSVARS --> COMPONENTS
    STYLUSVARS --> UTILITIES
    
    CSSWIDTH --> LAYOUTS
    CSSGAP --> COMPONENTS
    CSSFONT --> COMPONENTS
```

`hexo-config()` 函数在构建期读取配置并转换为 Stylus 变量；部分值以 CSS 自定义属性暴露在 `:root` 选择器中，支持响应式设计与用户偏好的运行时修改。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

## 配置驱动的变量生成

### hexo-config 函数模式

所有设计令牌都通过 `hexo-config()` 函数来自主题的 `_config.yml`，按键路径取值：

```mermaid
graph LR
    subgraph "Configuration Keys"
        STYLEFONT["style.font-family.*"]
        STYLESIZE["style.font-size.*"]
        STYLECOLOR["style.color.*"]
        STYLEBORDER["style.border-radius.*"]
        STYLELEFT["style.leftbar.*"]
        STYLESITE["style.site.*"]
    end
    
    subgraph "Stylus Variable Assignments"
        FFBODY["$ff-body = convert(hexo-config('style.font-family.body'))"]
        FFCODE["$ff-code = convert(hexo-config('style.font-family.code'))"]
        FSROOT["$fs-root = convert(hexo-config('style.font-size.root'))"]
        FSBODY["$fs-body = convert(hexo-config('style.font-size.body'))"]
        CTHEME["$c-theme = convert(hexo-config('style.color.theme'))"]
        CACCENT["$c-accent = convert(hexo-config('style.color.accent'))"]
        BORDERCARD["$border-card = convert(hexo-config('style.border-radius.card'))"]
        LEFTBG["$leftbar-background-image = hexo-config('style.leftbar.background-image')"]
    end
    
    STYLEFONT --> FFBODY
    STYLEFONT --> FFCODE
    STYLESIZE --> FSROOT
    STYLESIZE --> FSBODY
    STYLECOLOR --> CTHEME
    STYLECOLOR --> CACCENT
    STYLEBORDER --> BORDERCARD
    STYLELEFT --> LEFTBG
```

`convert()` 是 Stylus 辅助函数，确保取回的值类型正确。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

## Stylus 变量分类

### 字体变量

主题定义三类字体变量，均取自配置：

| 变量 | 配置键 | 用途 |
|------|--------|------|
| `$ff-body` | `style.font-family.body` | 正文字体 |
| `$ff-code` | `style.font-family.code` | 行内代码字体 |
| `$ff-codeblock` | `style.font-family.codeblock` | 代码块字体 |
| `$fs-root` | `style.font-size.root` | 根 HTML 字号 |
| `$fs-body` | `style.font-size.body` | 默认正文字号 |
| `$fs-code` | `style.font-size.code` | 行内代码字号 |
| `$fs-codeblock` | `style.font-size.codeblock` | 代码块字号 |

额外的固定字号令牌：

```
$fs-15 = .9375rem  // 约 15px
$fs-14 = .875rem   // 约 14px
$fs-13 = .8125rem  // 约 13px
$fs-12 = .75rem    // 约 12px
```

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

### 计算字号令牌

主题基于 `$fs-body` 生成标题与段落的计算字号：

```mermaid
graph TB
    FSBODY["$fs-body<br/>(from config)"]
    
    subgraph "Header Sizes"
        FSH1["$fsh1 = calc($fs-body + 9px)"]
        FSH2["$fsh2 = calc($fs-body + 11px)"]
        FSH3["$fsh3 = calc($fs-body + 7px)"]
        FSH4["$fsh4 = calc($fs-body + 4px)"]
        FSH5["$fsh5 = calc($fs-body + 2px)"]
    end
    
    subgraph "Paragraph Variations"
        FSP0["$fsp0 = calc($fs-body - 0px)"]
        FSP1["$fsp1 = calc($fs-body - 1px)"]
        FSP2["$fsp2 = calc($fs-body - 2px)"]
        FSP3["$fsp3 = calc($fs-body - 3px)"]
    end
    
    FSBODY --> FSH1
    FSBODY --> FSH2
    FSBODY --> FSH3
    FSBODY --> FSH4
    FSBODY --> FSH5
    FSBODY --> FSP0
    FSBODY --> FSP1
    FSBODY --> FSP2
    FSBODY --> FSP3
```

这些计算用字符串插值配合 CSS `calc()` 保持动态尺寸，实际 Stylus 代码格式：

```stylus
$fsh1 = 'calc(%s + 9px)' % $fs-body
$fsp1 = 'calc(%s - 1px)' % $fs-body
```

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

### 颜色变量

颜色令牌定义主题的视觉身份：

| 变量 | 配置键 | 用途 |
|------|--------|------|
| `$c-theme` | `style.color.theme` | 主题色 |
| `$c-accent` | `style.color.accent` | 强调色 |
| `$c-link` | `style.color.link` | 链接色 |
| `$c-base-hue` | 固定 `210deg` | 背景/文字色的基础色相 |

`$c-base-hue` 控制 HSL 颜色系统中生成背景色与文字色的基础色相，通常不需要修改。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

### 背景变量

背景配置支持图片与颜色定制：

| 变量 | 配置键 | 用途 |
|------|--------|------|
| `$site-background-image` | `style.site.background-image` | 全站背景图 |
| `$leftbar-background-image` | `style.leftbar.background-image` | 左栏背景图 |
| `$leftbar-background-color-light` | `style.leftbar.background-color-light` | 左栏浅色模式颜色 |
| `$leftbar-background-color-dark` | `style.leftbar.background-color-dark` | 左栏深色模式颜色 |

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

### 圆角变量

主题采用三档圆角体系保持视觉一致：

```mermaid
graph LR
    subgraph "Card Borders"
        CARDL["$border-card-l<br/>Large cards"]
        CARD["$border-card<br/>Standard cards"]
        CARDS["$border-card-s<br/>Small cards"]
    end
    
    subgraph "Image Borders"
        IMAGEL["$border-image-l<br/>Large images"]
        IMAGE["$border-image<br/>Standard images"]
        IMAGES["$border-image-s<br/>Small images"]
    end
    
    subgraph "UI Elements"
        BAR["$border-bar<br/>Navigation bars"]
        BUTTON["$border-button = 8px<br/>Buttons (fixed)"]
    end
    
    CONFIG["_config.yml<br/>style.border-radius.*"] --> CARDL
    CONFIG --> CARD
    CONFIG --> CARDS
    CONFIG --> IMAGEL
    CONFIG --> IMAGE
    CONFIG --> IMAGES
    CONFIG --> BAR
```

`$border-button` 硬编码为 `8px`，不从配置派生。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

### 图标 Data URI

主题把 SVG 图标以内嵌 data URI 形式打包，提升性能：

| 变量 | 用途 |
|------|------|
| `$iQuoteLeft` | 左引号图标 |
| `$iQuoteRight` | 右引号图标 |
| `$iH3Left` | H3 前缀图标（左 V 形） |
| `$iH3Right` | H3 前缀图标（右 V 形） |
| `$iLoadingIcon` | 加载动画图标 |

这些 data URI 是完整且 URL 编码的 SVG 字符串，可直接用于 CSS `url()`，无需外部文件依赖。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

### 阴影定义

盒阴影令牌提供一致的层级效果：

| 变量 | 用途 | 阴影值 |
|------|------|--------|
| `$boxshadow-card` | 标准卡片 | `0 1px 2px 0px rgba(0,0,0,0.1)` |
| `$boxshadow-float` | 浮动元素 | `0 4px 8px 0px rgba(0,0,0,0.05)` |
| `$boxshadow-card-float` | 悬停抬升卡片 | `0 12px 16px -4px rgba(0,0,0,0.2)` |
| `$boxshadow-button` | 按钮立体感 | `0 0 2px 0px rgba(0,0,0,0.04), 0 0 8px 0px rgba(0,0,0,0.04)` |
| `$boxshadow-block` | 块级元素 | `0 1px 4px 0px rgba(0,0,0,0.02), 0 2px 8px 0px rgba(0,0,0,0.02)` |
| `$boxshadow-toast` | Toast 通知 | `0 4px 8px 0px rgba(0,0,0,0.1), 0 12px 16px -4px rgba(0,0,0,0.2)` |

阴影系统使用低透明度值营造深度，避免过重视觉。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

## CSS 自定义属性系统

### 动态布局变量

`:root` 选择器定义可运行时修改的 CSS 自定义属性：

```mermaid
graph TB
    subgraph "Core Layout Properties"
        WIDTHMAIN["--width-main<br/>Default: 720px"]
        SIDEWIDTH["--side-content-width<br/>Default: 224px"]
    end
    
    subgraph "Spacing System"
        MARGIN["--gap-margin<br/>16px"]
        PADDING["--gap-padding<br/>16px"]
        GAPMAX["--gap-max<br/>calc(margin + padding)"]
        GAPP["--gap-p<br/>calc($fs-body + 4px)"]
        GAPCOMPACT["--gap-p-compact<br/>calc($fs-body * 0.75)"]
    end
    
    subgraph "Font Size Properties"
        FSP["--fsp<br/>$fs-body"]
        FSH2["--fsh2<br/>calc(--fsp + 11px)"]
        FSH3["--fsh3<br/>calc(--fsp + 7px)"]
        FSH4["--fsh4<br/>calc(--fsp + 4px)"]
    end
    
    subgraph "Responsive Overrides"
        MEDIA2K["@media (min-width: 2k)<br/>--width-main: 780px"]
        MEDIA4K["@media (min-width: 4k)<br/>--width-main: 860px"]
        MEDIATABLET["@media (max-width: tablet)<br/>--side-content-width: 188px"]
        MEDIAMOBILE["@media (max-width: mobile)<br/>--side-content-width: 224px"]
    end
    
    MARGIN --> GAPMAX
    PADDING --> GAPMAX
    FSP --> FSH2
    FSP --> FSH3
    FSP --> FSH4
    
    WIDTHMAIN -.overridden by.-> MEDIA2K
    WIDTHMAIN -.overridden by.-> MEDIA4K
    SIDEWIDTH -.overridden by.-> MEDIATABLET
    SIDEWIDTH -.overridden by.-> MEDIAMOBILE
```

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

### 宽度与布局属性

主内容宽度随屏幕尺寸通过媒体查询适配：

| 属性 | 默认 | 2K+ 屏幕 | 4K+ 屏幕 |
|------|------|----------|----------|
| `--width-main` | 720px | 780px | 860px |

渐进加宽充分利用大屏，同时保持可读的行长。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

### 间距系统变量

间距系统采用两级层级：

```
--gap-margin: 16px    // 元素轮廓到容器边缘
--gap-padding: 16px   // 文本内容到元素轮廓
--gap-max: calc(var(--gap-margin) + var(--gap-padding))  // 总间距
```

段落间距按字号计算：

```
--gap-p: calc($fs-body + 4px)           // 标准段落间距
--gap-p-compact: calc($fs-body * 0.75)  // 紧凑段落间距
```

这样间距随字号变化按比例缩放。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

### 侧边栏宽度适配

侧边栏宽度随设备类别调整：

| 屏幕宽度 | `--side-content-width` |
|----------|------------------------|
| 桌面（默认） | 224px |
| 平板（max-width: tablet） | 188px |
| 手机（max-width: mobile） | 224px |

注意手机端回到 224px，以保证触控目标尺寸。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

### 动态字号属性

字号 CSS 自定义属性引用 Stylus 变量，同时暴露给运行时修改：

```
--fsp: $fs-body                           // 基准字号
--fsh2: calc(var(--fsp) + 11px)          // H2 标题字号
--fsh3: calc(var(--fsp) + 7px)           // H3 标题字号
--fsh4: calc(var(--fsp) + 4px)           // H4 标题字号
```

标题计算引用 `var(--fsp)`，运行时修改 `--fsp` 会级联到所有依赖尺寸，无需重新计算即可实现动态字号调整。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

## 变量使用模式

### 静态与动态变量

设计令牌系统使用两类变量：

```mermaid
graph TB
    subgraph "Static Stylus Variables"
        STATIC["Compiled at build time<br/>Cannot change after deployment"]
        EXSTATIC["Examples:<br/>$c-theme, $border-card<br/>$boxshadow-float"]
        USESTATIC["Used in: Component styles<br/>that don't need runtime changes"]
    end
    
    subgraph "Dynamic CSS Custom Properties"
        DYNAMIC["Available at runtime<br/>Can be modified via JavaScript"]
        EXDYNAMIC["Examples:<br/>--width-main, --gap-margin<br/>--fsp, --side-content-width"]
        USEDYNAMIC["Used in: Responsive layouts<br/>User preference adaptations"]
    end
    
    STATIC --> EXSTATIC
    EXSTATIC --> USESTATIC
    DYNAMIC --> EXDYNAMIC
    EXDYNAMIC --> USEDYNAMIC
```

不会变化的值优先用静态变量（性能更好）；需要随视口、用户偏好或运行时条件变化的值用 CSS 自定义属性。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

### 组件样式消费

各组件以标准化模式消费这些令牌：

| 令牌类型 | 消费模式 | 示例 |
|----------|----------|------|
| 字体族 | 直接赋给 `font-family` | `font-family: $ff-body` |
| 字号 | 直接赋值或用于 `calc()` | `font-size: $fs-14` |
| 颜色 | 用于 color/background/border | `color: $c-link` |
| 边框 | border-radius 属性 | `border-radius: $border-card` |
| 阴影 | box-shadow 属性 | `box-shadow: $boxshadow-card` |
| CSS 变量 | 用 `var()` 引用 | `width: var(--width-main)` |

Stylus 编译器在构建期解析静态变量，CSS 自定义属性在浏览器运行时解析。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

## 与配置系统的集成

### 配置结构映射

设计令牌直接映射 `_config.yml` 的 `style` 小节：

```mermaid
graph LR
    subgraph "_config.yml Structure"
        STYLE["style:"]
        FONTFAM["  font-family:<br/>    body, code, codeblock"]
        FONTSIZE["  font-size:<br/>    root, body, code, codeblock"]
        COLOR["  color:<br/>    theme, accent, link"]
        BORDER["  border-radius:<br/>    card, card-l, card-s<br/>    image, image-l, image-s<br/>    bar"]
        LEFTBAR["  leftbar:<br/>    background-image<br/>    background-color-light<br/>    background-color-dark"]
        SITE["  site:<br/>    background-image"]
    end
    
    subgraph "_custom.styl Variables"
        VARS["Design Token Variables"]
    end
    
    STYLE --> FONTFAM
    STYLE --> FONTSIZE
    STYLE --> COLOR
    STYLE --> BORDER
    STYLE --> LEFTBAR
    STYLE --> SITE
    
    FONTFAM --> VARS
    FONTSIZE --> VARS
    COLOR --> VARS
    BORDER --> VARS
    LEFTBAR --> VARS
    SITE --> VARS
```

这种一对一映射保证配置修改直接影响编译出的 CSS，无需手动更新变量。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

### 构建期与运行时配置

理解值的解析时机对定制至关重要：

**构建期解析：**
- 所有 `hexo-config()` 调用在 `hexo generate` 时解析
- Stylus 变量编译为静态 CSS 值
- 修改后需要重新生成站点

**运行时解析：**
- CSS 自定义属性可被 JavaScript 修改
- 媒体查询覆盖自动生效
- 响应式适配无需重新生成

这种混合方案在性能（编译期解析）与灵活性（响应式运行时适配）之间取得平衡。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)
