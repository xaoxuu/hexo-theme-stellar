---
title: 小部件系统架构
domain: 数据服务与组件
tags:
  - 小部件
  - 架构
  - widgets.yml
---

# 小部件系统架构

<details>
<summary>相关源码文件</summary>

生成此页面时参考的主题源码文件：

- [layout/layout.ejs](../../../layout/layout.ejs)
- [layout/_partial/sidebar/index_leftbar.ejs](../../../layout/_partial/sidebar/index_leftbar.ejs)
- [layout/_partial/sidebar/index_rightbar.ejs](../../../layout/_partial/sidebar/index_rightbar.ejs)
- [_data/widgets.yml](../../../_data/widgets.yml)
- [layout/_partial/widgets/](../../../layout/_partial/widgets/)

</details>

## 目的与范围

本文介绍 Stellar 主题的小部件系统架构：小部件如何渲染在侧边栏中、如何组织进容器。小部件是出现在左右侧边栏的可复用 UI 组件，提供导航、信息与交互功能。

各数据服务小部件（siteinfo、ghinfo、rating 等）见[数据服务 API](data-service-apis.md)。

---

## 小部件容器结构

Stellar 实现三栏布局，小部件容器位于左右侧边栏。这些容器在主布局模板中定义，跨页面类型保持。

### 页面布局层级

```mermaid
graph TB
    subgraph PageStructure["Page Structure"]
        LBODY[".l_body<br/>(Main container)"]
        
        subgraph LeftSide["Left Sidebar"]
            LLEFT[".l_left<br/>(Sidebar wrapper)"]
            SIDEBG[".sidebg<br/>(Background layer)"]
            LEFTBAR[".leftbar-container<br/>(Content container)"]
            LEFT_WIDGETS[".widgets<br/>(Widget area)"]
        end
        
        subgraph MainContent["Main Content"]
            LMAIN[".l_main<br/>(Content area)"]
            BODY["body content"]
            FOOTER["footer"]
        end
        
        subgraph RightSide["Right Sidebar"]
            LRIGHT[".l_right<br/>(Sidebar wrapper)"]
            RIGHT_WIDGETS[".widgets<br/>(Widget area)"]
        end
    end
    
    LBODY --> LLEFT
    LBODY --> LMAIN
    LBODY --> LRIGHT
    
    LLEFT --> SIDEBG
    LLEFT --> LEFTBAR
    LEFTBAR --> LEFT_WIDGETS
    
    LMAIN --> BODY
    LMAIN --> FOOTER
    
    LRIGHT --> RIGHT_WIDGETS
```

**参考源码**：[layout/layout.ejs](../../../layout/layout.ejs)

布局经嵌套结构建立小部件容器：

| 容器 | CSS 选择器 | 用途 | 位置 |
|------|------------|------|------|
| 左栏 | `.l_left` | Logo、导航与左栏小部件容器 | layout.ejs |
| 左栏小部件区 | `.l_left .widgets` | 左栏小部件 | layout.ejs |
| 右栏 | `.l_right` | 右栏小部件容器 | layout.ejs |
| 右栏小部件区 | `.l_right .widgets` | 右栏小部件 | layout.ejs |

`.leftbar-container` 在 `theme.style.leftbar.blur` 启用时经 `leftbar-blur` 类应用条件模糊效果。

**参考源码**：[layout/layout.ejs](../../../layout/layout.ejs)

---

## 小部件类型与组织

小部件系统支持多种服务于不同目的的小部件类型。每个小部件渲染为 `.widgets` 容器内的子元素，保持独立内部结构。

### 小部件类型分类

```mermaid
graph LR
    subgraph WidgetTypes["Widget Types"]
        TOC["TOC Widget<br/>(Table of Contents)"]
        RECENT["Recent Widget<br/>(Recent posts/pages)"]
        TREE["Tree Widget<br/>(Wiki navigation)"]
        TAGTREE["TagTree Widget<br/>(Notebook tags)"]
        DATASERVICE["Data Service Widgets<br/>(Dynamic content)"]
    end
    
    subgraph Characteristics["Characteristics"]
        STATIC["Static Content<br/>(Rendered server-side)"]
        DYNAMIC["Dynamic Content<br/>(Loaded via API)"]
        INTERACTIVE["Interactive State<br/>(TOC active items)"]
    end
    
    TOC --> INTERACTIVE
    TOC --> STATIC
    
    RECENT --> STATIC
    
    TREE --> STATIC
    TREE --> INTERACTIVE
    
    TAGTREE --> STATIC
    TAGTREE --> INTERACTIVE
    
    DATASERVICE --> DYNAMIC
```

**参考源码**：[_data/widgets.yml](../../../_data/widgets.yml)

### 侧边栏结构部件

每个侧边栏分为组织小部件与其他侧边栏内容的结构部件：

| 部件 | CSS 选择器 | 用途 |
|------|------------|------|
| 页头 | `.header` | 侧边栏 Logo 与品牌 |
| 导航区 | `.nav-area` | 菜单导航链接 |
| 小部件容器 | `.widgets` | 小部件列表容器 |
| 页脚 | `.footer` | 侧边栏页脚内容 |

**参考源码**：[layout/_partial/sidebar/index_leftbar.ejs](../../../layout/_partial/sidebar/index_leftbar.ejs)、[layout/_partial/sidebar/index_rightbar.ejs](../../../layout/_partial/sidebar/index_rightbar.ejs)

---

## 小部件定义与渲染

### `_data/widgets.yml` 定义

小部件在主题的 `_data/widgets.yml` 中定义，每个小部件有 `layout` 字段指向 `layout/_partial/widgets/` 下的模板：

```yaml
ghrepo:
  layout: ghrepo
related:
  layout: related
recent:
  layout: recent
  rss: # /atom.xml
  limit: 10
tree:
  layout: tree
toc:
  layout: toc
  list_number: false
  min_depth: 1
  max_depth: 6
  collapse: false
```

小部件 ID 可以带自定义配置项（如 `recent.limit`、`toc.min_depth`），渲染时经 `theme.widgets[name]` 合并。

**参考源码**：[_data/widgets.yml](../../../_data/widgets.yml)

### 渲染流程

`index_leftbar.ejs` / `index_rightbar.ejs` 遍历配置的 `leftbar` / `rightbar` 数组：

1. 按名称从 `theme.widgets` 读取小部件定义
2. 支持对象形式覆盖（`override` / `layout` 字段）
3. 经 `partial('../widgets/' + widget.layout, {item: widget})` 渲染对应模板
4. 模板不存在或输出为空时静默跳过

```mermaid
flowchart TD
    START["渲染侧边栏"] --> CONFIG["page.leftbar / page.rightbar"]
    CONFIG --> LOOP["遍历每个小部件项"]
    LOOP --> LOOKUP{"name in theme.widgets?"}
    LOOKUP -->|"Yes"| MERGE["合并 widget 定义"]
    LOOKUP -->|"No"| SKIP["跳过（静默）"]
    MERGE --> RENDER["partial('../widgets/' + layout)"]
    RENDER --> OUTPUT["输出到 .widgets 容器"]
```

**参考源码**：[layout/_partial/sidebar/index_leftbar.ejs](../../../layout/_partial/sidebar/index_leftbar.ejs)

### 小部件分类

| 类型 | 特性 | 示例 |
|------|------|------|
| 静态小部件 | 服务端渲染，内容固定 | `recent`、`related`、`ghrepo` |
| 交互小部件 | 带客户端状态 | `toc`（激活项）、`tree`（展开状态） |
| 动态小部件 | 经数据服务 API 加载 | `ghinfo`、`siteinfo`、`rating` |

---

## 侧边栏解析逻辑

左栏与右栏按页面上下文解析小部件列表（见 [index_leftbar.ejs](../../../layout/_partial/sidebar/index_leftbar.ejs)）：

| 页面上下文 | 侧边栏来源 |
|------------|------------|
| 首页 | `site_tree.home.leftbar` |
| 笔记本列表页 | `site_tree.notebooks.leftbar` |
| 笔记列表页 | 笔记本配置或 `site_tree.notes.leftbar` |
| 笔记本文章页 | 笔记本 `note_leftbar` / `note_rightbar` |
| 分类/标签/归档 | `site_tree.index_blog.leftbar` |
| 专栏列表页 | `site_tree.index_blog.leftbar` |
| wiki 列表页 | `site_tree.index_wiki.leftbar` |
| wiki 页面 | `site_tree.wiki.leftbar` |
| 404 | `site_tree.error_page.leftbar` |
| 通用页面 | `site_tree.page.leftbar` |
| 文章 | `site_tree.post.leftbar` |

专题/项目级配置（`topic.leftbar`、`wiki.leftbar`）可进一步覆盖。字符串数组经逗号切分，对象项支持 `override` 与 `layout`。

**参考源码**：[layout/_partial/sidebar/index_leftbar.ejs](../../../layout/_partial/sidebar/index_leftbar.ejs)

---

## 小部件渲染集成点

小部件经 EJS partial 模板服务端渲染，包含在侧边栏结构中：

| Partial | 用途 | 引入点 |
|---------|------|--------|
| `_partial/sidebar/index_leftbar` | 含小部件的左栏内容 | layout.ejs |
| `_partial/sidebar/index_rightbar` | 含小部件的右栏内容 | layout.ejs |
| `_partial/widgets/*.ejs` | 各小部件渲染模板 | 由小部件 `layout` 字段指定 |

**参考源码**：[layout/layout.ejs](../../../layout/layout.ejs)、[layout/_partial/sidebar/index_leftbar.ejs](../../../layout/_partial/sidebar/index_leftbar.ejs)、[layout/_partial/sidebar/index_rightbar.ejs](../../../layout/_partial/sidebar/index_rightbar.ejs)

---

## 性能考虑

小部件系统的主要优化：

1. **按需渲染**——仅渲染配置中引用的小部件，未引用模板不加载
2. **静态优先**——静态小部件服务端渲染，无客户端开销
3. **动态懒加载**——数据服务小部件仅在内容中使用对应标签时加载脚本（见[数据服务与组件总览](data-widgets-overview.md)）
4. **空输出跳过**——模板无内容时静默省略，避免空容器

**参考源码**：[_data/widgets.yml](../../../_data/widgets.yml)、[layout/_partial/sidebar/index_leftbar.ejs](../../../layout/_partial/sidebar/index_leftbar.ejs)

---

## 错误处理与边界情况

| 边界情况 | 处理策略 |
|----------|----------|
| 小部件 ID 未在 `_data/widgets.yml` 定义 | 静默跳过，不报错 |
| 小部件模板缺失 | 静默跳过 |
| 小部件模板输出为空 | 静默跳过 |
| 字符串与对象混合的小部件列表 | 对象项支持 `override` / `layout` 覆盖 |

系统保证配置异常时优雅降级，页面始终正常渲染。

**参考源码**：[layout/_partial/sidebar/index_leftbar.ejs](../../../layout/_partial/sidebar/index_leftbar.ejs)
