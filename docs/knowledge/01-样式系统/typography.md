---
title: 排版系统
domain: 样式系统
tags:
  - 排版
  - 字体
  - 字号
---

# 排版系统

<details>
<summary>相关源码文件</summary>

生成此页面时参考的主题源码文件：

- [source/css/_custom.styl](../../../source/css/_custom.styl)
- [source/css/_common/base.styl](../../../source/css/_common/base.styl)
- [source/css/_common/highlight.styl](../../../source/css/_common/highlight.styl)

</details>

排版系统通过配置驱动流水线控制 Stellar 的文本渲染：把 `_config.yml` 设置转换为 Stylus 变量与 CSS 自定义属性。系统定义字体族（`$ff-body`、`$ff-code`、`$ff-codeblock`）、字号比例（`$fs-root`、`$fsh*`、`$fsp*`），并通过媒体查询做响应式调整。

相关文档：[设计令牌与 CSS 变量](design-tokens.md)、[颜色与深色模式](colors-dark-mode.md)、[响应式设计](responsive-design.md)。

---

## 配置到 CSS 的架构

排版配置经三个阶段流动：`hexo-config()` 提取配置、Stylus 变量编译、CSS 输出生成。系统同时使用静态 Stylus 变量（固定值）与 CSS 自定义属性（`:root` 变量，运行时可调）。

**排版编译流水线**

```mermaid
graph TB
    subgraph "Configuration"
        YML["_config.yml"]
        FONT_FAM["style.font-family.*"]
        FONT_SIZE["style.font-size.*"]
        TEXT_ALIGN["style.text-align"]
    end
    
    subgraph "Stylus Build-Time Processing"
        HEXO_CFG["hexo-config()<br/>Stylus function"]
        CONVERT["convert()<br/>Type conversion"]
        
        FF_BODY["$ff-body"]
        FF_CODE["$ff-code"]
        FF_CODEBLOCK["$ff-codeblock"]
        
        FS_ROOT["$fs-root"]
        FS_BASE["$fs-root<br/>(style.font-size.root)"]
        FS_CODE["$fs-code"]
        FS_CODEBLOCK["$fs-codeblock"]
        
        FSH_CALC["$fsh1-5<br/>calc() strings"]
        FSP_CALC["$fs-content-0..3<br/>calc() strings"]
    end
    
    subgraph "CSS Custom Properties"
        ROOT[":root selector"]
        VAR_FSP["--fs-content-base / --fs-content"]
        VAR_FSH["--fsh2, --fsh3, --fsh4"]
        VAR_GAP["--gap-p, --gap-p-compact"]
    end
    
    subgraph "Static CSS"
        CODE_FF["code { font-family: $ff-code }"]
        PRE_FF["pre { font-family: $ff-codeblock }"]
        LI_FS["li { font-size: calc(var(--fs-content) - 1px) }"]
    end
    
    YML --> HEXO_CFG
    FONT_FAM --> HEXO_CFG
    FONT_SIZE --> HEXO_CFG
    TEXT_ALIGN --> HEXO_CFG
    
    HEXO_CFG --> CONVERT
    CONVERT --> FF_BODY
    CONVERT --> FF_CODE
    CONVERT --> FF_CODEBLOCK
    CONVERT --> FS_ROOT
    CONVERT --> FS_BODY
    CONVERT --> FS_CODE
    CONVERT --> FS_CODEBLOCK
    
    FS_BODY --> FSH_CALC
    FS_BODY --> FSP_CALC
    
    FS_BODY --> ROOT
    ROOT --> VAR_FSP
    VAR_FSP --> VAR_FSH
    FS_BODY --> VAR_GAP
    
    FF_CODE --> CODE_FF
    FF_CODEBLOCK --> PRE_FF
    VAR_FSP --> LI_FS
```

### 构建期函数

- **`hexo-config(path)`**：构建期从 `_config.yml` 取值，例如 `hexo-config('style.font-family.body')` 取正文字体族。
- **`convert(value)`**：确保 YAML 字符串正确转换为 Stylus 值，处理单位与引号。

字号令牌直接引用 `var(--fs-root)` 生成动态 `calc()` 表达式，移动端修改基准时无需重新生成各组件规则。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

---

## 字体族系统

三个字体族变量定义不同内容类型的排版：

| 变量 | 配置路径 | 应用目标 | 文件 |
|------|----------|----------|------|
| `$ff-body` | `style.font-family.body` | 全局正文、标题、段落 | 通过继承隐式应用 |
| `$ff-code` | `style.font-family.code` | `code` 元素（行内代码） | [highlight.styl](../../../source/css/_common/highlight.styl) |
| `$ff-codeblock` | `style.font-family.codeblock` | `pre` 元素、`.highlight` 块 | [base.styl](../../../source/css/_common/base.styl)、[highlight.styl](../../../source/css/_common/highlight.styl) |

### 变量定义

字体族从配置提取并保存为静态 Stylus 变量：

```stylus
// source/css/_custom.styl
$ff-body = convert(hexo-config('style.font-family.body'))
$ff-code = convert(hexo-config('style.font-family.code'))
$ff-codeblock = convert(hexo-config('style.font-family.codeblock'))
```

### 应用位置

**行内代码**：通过 `font-family: $ff-code` 应用到 `<code>` 元素：

```stylus
// source/css/_common/highlight.styl
code
  -webkit-font-smoothing: auto
  -moz-osx-font-smoothing: auto
  font-family: $ff-code
```

**代码块**：通过 `font-family: $ff-codeblock` 应用到 `<pre>` 元素：

```stylus
// source/css/_common/base.styl
pre
  font-family: $ff-codeblock
  font-size: $fs-codeblock
```

**语法高亮**：`.md-text .highlight` 选择器同样使用 `$ff-codeblock`：

```stylus
// source/css/_common/highlight.styl
.md-text .highlight
  font-family: $ff-codeblock
```

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)、[source/css/_common/highlight.styl](../../../source/css/_common/highlight.styl)、[source/css/_common/base.styl](../../../source/css/_common/base.styl)

---

## 字号系统

字号变量分四类：来自配置的基础字号、动态次级字号令牌、计算出的标题字号、计算出的段落变体。所有标题与段落字号都从 `--fs-root` 派生，保持比例缩放。

**字号变量依赖**

```mermaid
graph TD
    subgraph "Configuration Sources"
        CFG_ROOT["style.font-size.root"]
        CFG_BODY["style.font-size.body<br/>(已移除)"]
        CFG_CODE["style.font-size.code"]
        CFG_CB["style.font-size.codeblock"]
    end
    
    subgraph "Base Variables"
        FS_ROOT["$fs-root"]
        FS_BODY["$fs-root<br/>(root 配置变量)"]
        FS_CODE["$fs-code"]
        FS_CB["$fs-codeblock"]
    end
    
    subgraph "Fixed Constants"
        FS_15["$fs-15 = calc(--fs-root - 1px)"]
        FS_14["$fs-14 = calc(--fs-root - 2px)"]
        FS_13["$fs-13 = calc(--fs-root - 3px)"]
        FS_12["$fs-12 = calc(--fs-root - 4px)"]
    end
    
    subgraph "Heading Calculations"
        FSH1["$fsh1<br/>calc(var(--fs-root) + 9px)"]
        FSH2["$fsh2<br/>calc(var(--fs-root) + 11px)"]
        FSH3["$fsh3<br/>calc(var(--fs-root) + 7px)"]
        FSH4["$fsh4<br/>calc(var(--fs-root) + 4px)"]
        FSH5["$fsh5<br/>calc(var(--fs-root) + 2px)"]
    end
    
    subgraph "Paragraph Variants"
        FSP0["$fs-content-0 = calc(var(--fs-content-base) - 0px)"]
        FSP1["$fs-content-1 = calc(var(--fs-content-base) - 1px)"]
        FSP2["$fs-content-2 = calc(var(--fs-content-base) - 2px)"]
        FSP3["$fs-content-3 = calc(var(--fs-content-base) - 3px)"]
    end
    
    subgraph "Runtime Variables"
        VAR_FSP["--fs-content-base: var(--fs-root)<br/>--fs-content: var(--fs-content-base)"]
        VAR_FSH2["--fsh2: calc(var(--fs-content) + 11px)"]
        VAR_FSH3["--fsh3: calc(var(--fs-content) + 7px)"]
        VAR_FSH4["--fsh4: calc(var(--fs-content) + 4px)"]
    end
    
    CFG_ROOT --> FS_ROOT
    CFG_BODY --> FS_BODY
    CFG_CODE --> FS_CODE
    CFG_CB --> FS_CB
    
    FS_BODY --> FSH1
    FS_BODY --> FSH2
    FS_BODY --> FSH3
    FS_BODY --> FSH4
    FS_BODY --> FSH5
    
    FS_BODY --> FSP0
    FS_BODY --> FSP1
    FS_BODY --> FSP2
    FS_BODY --> FSP3
    
    FS_BODY --> VAR_FSP
    VAR_FSP --> VAR_FSH2
    VAR_FSP --> VAR_FSH3
    VAR_FSP --> VAR_FSH4
```

### 基础字号变量

配置值在构建期提取为 Stylus 变量：

```stylus
// source/css/_custom.styl
$fs-root = convert(hexo-config('style.font-size.root'))
$fs-root = convert(hexo-config('style.font-size.root'))
$fs-code = convert(hexo-config('style.font-size.code'))
$fs-codeblock = convert(hexo-config('style.font-size.codeblock'))
```

| 变量 | 用途 | 应用 |
|------|------|------|
| `$fs-root` | 构建期根字号配置 | 作为 `--fs-root` 的桌面端基准 |
| `$fs-root` | `style.font-size.root` | HTML/rem 根字号；移动端自动增加 2px |
| `$fs-code` | 行内代码字号 | 应用于 `p>code`、`li>code` |
| `$fs-codeblock` | 代码块字号 | 应用于 `pre`、`.highlight` |

### 固定尺寸常量

四个 rem 常量提供元信息与次级文本的标准尺寸：

```stylus
// source/css/_custom.styl
$fs-15 = calc(var(--fs-root) - 1px)
$fs-14 = calc(var(--fs-root) - 2px)
$fs-13 = calc(var(--fs-root) - 3px)
$fs-12 = calc(var(--fs-root) - 4px)
```

这些令牌在桌面端分别等价于 root - 1/2/3/4px，在移动端会随 `--fs-root` 一起增加 2px。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

---

## 标题字号层级

标题字号使用 CSS `calc()` 表达式，在 `--fs-root` 基础上加固定像素偏移，保证桌面与移动端基准变化时标题同步缩放。

| 变量 | 计算 | 偏移 | 大小排序 |
|------|------|------|----------|
| `$fsh1` | `calc(var(--fs-root) + 9px)` | +9px | 第 2 大 |
| `$fsh2` | `calc(var(--fs-root) + 11px)` | +11px | **最大** |
| `$fsh3` | `calc(var(--fs-root) + 7px)` | +7px | 第 3 大 |
| `$fsh4` | `calc(var(--fs-root) + 4px)` | +4px | 第 4 大 |
| `$fsh5` | `calc(var(--fs-root) + 2px)` | +2px | 第 5 大 |

### 字符串插值机制

Stylus 用 `%` 运算符把变量嵌入字符串：

```stylus
// source/css/_custom.styl
$fsh1 = 'calc(var(--fs-root) + 9px)'
$fsh2 = 'calc(var(--fs-root) + 11px)'
$fsh3 = 'calc(var(--fs-root) + 7px)'
$fsh4 = 'calc(var(--fs-root) + 4px)'
$fsh5 = 'calc(var(--fs-root) + 2px)'
```

这些表达式在运行时读取 `--fs-root`，因此移动端无需逐个覆盖标题规则。

### 视觉层级设计

主题让 H2 成为最大标题（+11px），H1 次之（+9px）。这是有意为之的反转：H2 承担主要章节分隔，H1 用于页面标题，在内容流中不需要过重的视觉重量。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

---

## 段落字号变体

四个递减字号变量为次级内容提供更小文本，各从 `--fs-root` 减去固定像素：

```stylus
// source/css/_custom.styl
$fs-content-0 = 'calc(var(--fs-content-base) - 0px)'  // 基准（不缩减）
$fs-content-1 = 'calc(var(--fs-content-base) - 1px)'  // -1px
$fs-content-2 = 'calc(var(--fs-content-base) - 2px)'  // -2px
$fs-content-3 = 'calc(var(--fs-content-base) - 3px)'  // -3px
```

| 变量 | 用法示例 | 应用场景 |
|------|----------|----------|
| `$fs-content-0` | 基准参考 | 等价于 `--fs-content-base` |
| `$fs-content-1` | 列表项（`li`） | [base.styl](../../../source/css/_common/base.styl) |
| `$fs-content-2` | 表格单元格 | [base.styl](../../../source/css/_common/base.styl) |
| `$fs-content-3` | 元信息、脚注 | 主题组件 |

### 列表项字号缩减

列表项使用运行时 `--fs-content` 变量并减 1px：

```stylus
// source/css/_common/base.styl
li
  font-size: 'calc(%s - 1px)' % var(--fs-content)
```

这为段落块与列表内容建立视觉层级，无需显式指定 `$fs-content-1`。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)、[source/css/_common/base.styl](../../../source/css/_common/base.styl)

---

## 用于运行时缩放的 CSS 自定义属性

排版系统在 `:root` 中暴露 CSS 自定义属性以支持运行时调整。`--fs-root` 是 HTML/rem 根字号，`--fs-content-base` 是页面字号基准，`--fs-content` 是组件当前字号；媒体查询在移动端将 root 提高 2px，story 再将页面基准提高 2px。

**运行时排版变量系统**

```mermaid
graph TB
    subgraph ":root Declaration"
        ROOT[":root selector"]
        VAR_ROOT["--fs-root: $fs-root"]
        VAR_FSP["--fs-content-base: var(--fs-root)<br/>--fs-content: var(--fs-content-base)"]
        VAR_FSH2["--fsh2: calc(var(--fs-content) + 11px)"]
        VAR_FSH3["--fsh3: calc(var(--fs-content) + 7px)"]
        VAR_FSH4["--fsh4: calc(var(--fs-content) + 4px)"]
        VAR_GAP_P["--gap-p: calc(var(--fs-root) + 4px)"]
        VAR_GAP_PC["--gap-p-compact: calc(var(--fs-root) * 0.75)"]
    end
    
    subgraph "Media Query Infrastructure"
        MQ_2K["@media (min-width: $device-2k)"]
        MQ_4K["@media (min-width: $device-4k)"]
        MQ_MOBILE["@media (max-width: $device-mobile-max)"]
    end
    
    subgraph "Consumer Elements"
        LI_FS["li { font-size: calc(var(--fs-content) - 1px) }"]
        TABLE_FS["table { --fs-content: $fs-content-2 }"]
        H2_FS["h2 { font-size: var(--fsh2) }"]
        H3_FS["h3 { font-size: var(--fsh3) }"]
        P_MARGIN["p { margin: var(--gap-p) 0 }"]
    end
    
    ROOT --> VAR_FSP
    VAR_FSP --> VAR_FSH2
    VAR_FSP --> VAR_FSH3
    VAR_FSP --> VAR_FSH4
    ROOT --> VAR_GAP_P
    ROOT --> VAR_GAP_PC
    
    MQ_2K -.->|"can override"| VAR_FSP
    MQ_4K -.->|"can override"| VAR_FSP
    MQ_MOBILE -.->|"--fs-root + 2px"| VAR_ROOT
    
    VAR_FSP --> LI_FS
    VAR_FSP --> TABLE_FS
    VAR_FSH2 --> H2_FS
    VAR_FSH3 --> H3_FS
    VAR_FSH4 --> H4_FS
    VAR_GAP_P --> P_MARGIN
```

### 变量声明

```stylus
// source/css/_custom.styl
:root
  --fs-root: $fs-root
  --width-main: 720px
  --fs-content-base: var(--fs-root)
  --fs-content: var(--fs-content-base)
  --fsh2: 'calc(%s + 11px)' % var(--fs-content)
  --fsh3: 'calc(%s + 7px)' % var(--fs-content)
  --fsh4: 'calc(%s + 4px)' % var(--fs-content)
  
  --gap-p: 'calc(var(--fs-root) + 4px)'
  --gap-p-compact: 'calc(var(--fs-root) * 0.75)'
```

### 级联计算链

`--fs-root` 是运行时字号锚点，桌面端等于配置的 root，移动端为 root + 2px。`--fs-content-base` 默认引用它，story 内容区再额外增加 2px；`--fs-content` 默认引用页面基准，组件可局部覆盖。由于标题和段落令牌都引用这些变量，媒体查询无需逐个覆盖组件。

例如组件局部设置 `--fs-content: 1.125rem` 后：

- `--fsh2` → `calc(1.125rem + 11px)`
- `--fsh3` → `calc(1.125rem + 7px)`
- `--fsh4` → `calc(1.125rem + 4px)`

### 段落间距变量

`--gap-p` 与 `--gap-p-compact` 控制段落垂直间距：

- `--gap-p`：标准段落边距（正文字号 + 4px）
- `--gap-p-compact`：紧凑布局的缩减间距（正文字号的 75%）

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

---

## 代码排版

代码渲染使用独立于正文的字体族与字号。行内代码（`<code>`）与代码块（`<pre>`、`.highlight`）分别处理。

### 字体平滑配置

所有代码元素关闭亚像素字体平滑，避免等宽字体的抗锯齿伪影：

```stylus
// source/css/_common/highlight.styl
code
  -webkit-font-smoothing: auto
  -moz-osx-font-smoothing: auto
  font-family: $ff-code
```

### 行内代码样式

`<p>` 与 `<li>` 内的行内代码使用 `$fs-code` 字号并带背景高亮：

```stylus
// source/css/_common/highlight.styl
p>code:not([class]), li>code:not([class])
  font-size: $fs-code
  background: var(--block)
  padding: .2em
  border-radius: 4px
  color: var(--text-code)
```

`:not([class])` 排除带语法高亮类的代码片段（`.language-*`）。

### 代码块排版

`<pre>` 元素使用 `$ff-codeblock` 字体族与 `$fs-codeblock` 字号：

```stylus
// source/css/_common/base.styl
pre
  font-family: $ff-codeblock
  font-size: $fs-codeblock
  tab-size: 4
  -moz-tab-size: 4
  -o-tab-size: 4
  -webkit-tab-size: 4
```

### 语法高亮块

`.md-text .highlight` 容器同样应用 `$ff-codeblock`：

```stylus
// source/css/_common/highlight.styl
.md-text .highlight, pre:not([class]):has(>code)
  margin: var(--gap-p) 0
  border-radius: $border-card
  overflow: hidden
  background: var(--block)
  font-family: $ff-codeblock
```

这保证所有代码块格式（围栏代码块、缩进块、高亮块）排版一致。

**参考源码**：[source/css/_common/highlight.styl](../../../source/css/_common/highlight.styl)、[source/css/_common/base.styl](../../../source/css/_common/base.styl)

---

## 响应式排版行为

`:root` 声明包含嵌套媒体查询，跨断点调整布局尺寸和字号。移动断点将统一基准 `--fs-root` 提高 2px，story 内容区在当前基准上再提高 2px。

### 媒体查询结构

```stylus
// source/css/_custom.styl
:root
  --fs-root: $fs-root
  --fs-content-base: var(--fs-root)
  --fs-content: var(--fs-content-base)
  --fsh2: 'calc(%s + 11px)' % var(--fs-content)
  // ... 其他变量
  
  // 2k 及以上桌面
  @media screen and (min-width: $device-2k)
    --width-main: 780px
  
  // 4k 及以上桌面
  @media screen and (min-width: $device-4k)
    --width-main: 860px
  
  // iPad 竖屏
  @media screen and (max-width: $device-tablet)
    --side-content-width: 188px
  
  @media screen and (max-width: $device-mobile-max)
    --fs-root: calc($fs-root + 2px)
    --side-content-width: 224px
```

### 响应式设计理念

主题在桌面端保持配置字号；移动端将所有字号基准提高 2px。响应式调整还包括：

- 内容宽度（`--width-main`：720px → 780px → 860px）
- 侧边栏宽度（`--side-content-width`：224px → 188px → 224px）
- 间距变量（`--gap-margin`、`--gap-padding`）

### 排版缩放规则

1. 桌面端 `--fs-root` 等于 `style.font-size.root`。
2. 移动端 `--fs-root` 为 root + 2px。
3. `--fs-content-base` 默认取 `--fs-root`，story 内容区使用 `calc(var(--fs-root) + 2px)`；`--fs-content` 默认取页面基准。
4. 标题、段落变体、rem 令牌和相关间距自动级联更新。

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

---

## 表格与列表排版

表格与列表有专门的排版规则，提升密度与视觉层级。

### 表格排版

表格局部覆盖 `--fs-content` 把字号缩小 2px：

```stylus
// source/css/_components/md-table.styl
.md-table-scroll
  overflow-x: auto
  -webkit-overflow-scrolling: touch
  max-width: 100%
  margin: 1rem 0
  scrollbar(0,0)
  > table:not([class])
    display: table
    width: 100%
    max-width: none
    margin: 0
    border-collapse: separate
    border-spacing: 0
    border: 1px solid var(--block-border)
    border-radius: $border-card
    overflow: hidden
    th
      border-top: none
    th, td
      border-left: 1px solid var(--block-border)
      &:first-child
        border-left: none
```

普通 Markdown 表格经 `after_post_render` 过滤器（`scripts/filters/lib/md_table.js`）包一层 `.md-table-scroll` 滚动容器：**宽度足够时铺满容器**（`width: 100%` 让列宽拉伸），内容宽度超过容器时**横向滚动**，单元格默认不换行（`tr { white-space: nowrap }`）。`{% table style:scroll %}` 与 `style:compact` 同样为「铺满 + 滚动」；需要单元格内自动换行或固定列宽时，用 `{% table style:wrap %}` 标签包裹。

所有内容表格（md 默认 / `scroll` / `compact` / `wrap`）统一为 **wrap 同款的圆角卡片边框**：`1px solid var(--block-border)` 外框 + `$border-card` 圆角（`overflow: hidden` 裁剪），单元格之间以竖线分隔，表头保留块底色与横线。

`table:not([class])` 基础样式（`source/css/_common/base.styl`）保留块级 + 横向滚动作为未包裹表格的兜底：

```stylus
// source/css/_common/base.styl
table:not([class])
  border-collapse: collapse
  display: block
  overflow-x: auto  // 兜底：默认横向滚动
  -webkit-overflow-scrolling: touch
  margin: 1rem 0
  max-width: 100%
  vertical-align: text-top
  --fs-content: $fs-content-2  // 局部覆盖：正文字号 - 2px
  font-size: var(--fs-content)

  th
    background: var(--block)
    border-top: 1px solid var(--block-border)
    border-bottom: 1px solid var(--block-border)

  td, th
    padding: 4px 1em
    line-height: 1.5
```

`--fs-content` 创建局部作用域。由于 `$fs-content-2 = calc(var(--fs-content-base) - 2px)`，表格文字比正文小 2px，且不影响周围内容。

`:not([class])` 排除带显式类名的表格（如标签插件中的表格），不自动缩小。

### 列表排版

列表项字号减 1px，缩进按比例：

```stylus
// source/css/_common/base.styl
li
  font-size: 'calc(%s - 1px)' % var(--fs-content)

ul, ol
  padding-left: var(--fs-content)
```

`padding-left: var(--fs-content)` 让缩进随字号缩放，响应式调整排版时保持比例层级。

**参考源码**：[source/css/_common/base.styl](../../../source/css/_common/base.styl)

---

## 文本对齐配置

段落对齐从配置提取并应用到 Markdown 生成的内容：

```stylus
// source/css/_common/base.styl
.md-text p:not([class])
  text-align: convert(hexo-config('style.text-align'))
```

| 选择器部分 | 用途 |
|-----------|------|
| `.md-text` | 包裹 Markdown 生成的 HTML 内容 |
| `p:not([class])` | 只作用于普通段落（排除标签插件段落） |
| `convert(hexo-config(...))` | 从 `_config.yml` 提取 `style.text-align` |

支持 `left`、`right`、`center`、`justify`。`:not([class])` 防止覆盖 note 块等专用组件中的对齐。

**参考源码**：[source/css/_common/base.styl](../../../source/css/_common/base.styl)

---

## 排版系统总结

| 方面 | 配置 | Stylus 变量 | CSS 属性 | 运行时可调 |
|------|------|-------------|----------|-----------|
| 正文字体 | `style.font-family.body` | `$ff-body` | `font-family` | 否 |
| 代码字体 | `style.font-family.code` | `$ff-code` | `font-family` | 否 |
| 代码块字体 | `style.font-family.codeblock` | `$ff-codeblock` | `font-family` | 否 |
| 根字号 | `style.font-size.root` | `$fs-root` | `font-size` | 否 |
| 全局字号基准 | `style.font-size.root` | `$fs-root` | `--fs-root` | 是（移动端 +2px） |
| 当前页面字号基准 | 由 root 计算 | `--fs-root` | `--fs-content-base` | 是（媒体查询/story） |
| 当前组件字号 | 由页面基准计算 | `$fs-content-0..3` | `--fs-content` | 是（组件局部覆盖） |
| H2 字号 | 计算 | `$fsh2` | `--fsh2` | 是（经 `--fs-content`） |
| H3 字号 | 计算 | `$fsh3` | `--fsh3` | 是（经 `--fs-content`） |
| H4 字号 | 计算 | `$fsh4` | `--fsh4` | 是（经 `--fs-content`） |
| 代码字号 | `style.font-size.code` | `$fs-code` | `font-size` | 否 |
| 代码块字号 | `style.font-size.codeblock` | `$fs-codeblock` | `font-size` | 否 |

排版系统优先保证一致性与比例关系。标题与变体字号都从 `--fs-root` 派生，基础配置变化或移动端增加 2px 时整套字号体系协调缩放。story 内容区在当前基准上额外增加 2px。
