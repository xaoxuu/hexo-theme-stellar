---
title: 总览
domain: 总览与安装配置
tags:
  - 架构
  - 总览
---

# 总览

<details>
<summary>相关源码文件</summary>

生成此页面时参考的主题源码文件：

- [.github/workflows/npm-publish.yml](../../../.github/workflows/npm-publish.yml)
- [.npmignore](../../../.npmignore)
- [LICENSE](../../../LICENSE)
- [README.md](../../../README.md)
- [_config.yml](../../../_config.yml)
- [layout/_partial/head.ejs](../../../layout/_partial/head.ejs)
- [layout/_partial/scripts/lazyload.ejs](../../../layout/_partial/scripts/lazyload.ejs)
- [layout/layout.ejs](../../../layout/layout.ejs)
- [package.json](../../../package.json)
- [scripts/helpers/json_ld.js](../../../scripts/helpers/json_ld.js)
- [source/css/_plugins/index.styl](../../../source/css/_plugins/index.styl)
- [source/js/main.js](../../../source/js/main.js)

</details>

Stellar 是一个功能全面的 Hexo 主题，内置四套并行内容管理系统：博客系统、文档（wiki）系统、专栏（topic）系统与笔记本（notebook）系统。本文从架构层面概述这些系统如何协同工作，以及主题如何把内容从配置、服务端渲染一路处理到客户端交互。

安装说明见[安装与启动](installation.md)，详细配置选项见[配置系统](configuration.md)。

## 架构理念

Stellar 采用**五层架构**，把配置、数据处理、渲染、客户端行为与样式分离，使主题可以支持多种内容类型并保持一致性，同时允许深度定制。

主题是**配置驱动**的：几乎所有行为都由 [_config.yml](../../../_config.yml) 控制，它是主题设置、内容布局、插件启用与样式参数的唯一事实来源。

### 核心架构分层

```mermaid
graph TB
    subgraph Configuration["Configuration Layer"]
        CONFIG["_config.yml<br/>Theme configuration hub"]
        LANG["Language files<br/>i18n translations"]
    end
    
    subgraph DataProcessing["Data Processing Layer"]
        DOCTREE["doc_tree.js<br/>Wiki structure builder"]
        HELPERS["Hexo helpers<br/>json_ld, related_posts"]
    end
    
    subgraph ServerRender["Server-Side Rendering"]
        LAYOUT["layout.ejs<br/>Page orchestrator"]
        PARTIALS["Partial templates<br/>head, sidebar, article"]
    end
    
    subgraph ClientSide["Client-Side Layer"]
        MAINJS["main.js<br/>Page initialization"]
        PRELOAD["preload<br/>flying_pages 预加载"]
        PLUGINS["Plugin scripts<br/>lazyload, comments"]
    end
    
    subgraph Styling["Styling Layer"]
        CUSTOM["_custom.styl<br/>Design tokens"]
        COMPONENTS["Component styles<br/>Layout, widgets"]
    end
    
    CONFIG --> DOCTREE
    CONFIG --> LAYOUT
    CONFIG --> MAINJS
    CONFIG --> CUSTOM
    LANG --> PARTIALS
    DOCTREE --> LAYOUT
    HELPERS --> LAYOUT
    LAYOUT --> PARTIALS
    LAYOUT --> MAINJS
    MAINJS --> PRELOAD
    MAINJS --> PLUGINS
    CUSTOM --> COMPONENTS
```

**参考源码**：[_config.yml](../../../_config.yml)、[layout/layout.ejs](../../../layout/layout.ejs)、[source/js/main.js](../../../source/js/main.js)、[scripts/helpers/json_ld.js](../../../scripts/helpers/json_ld.js)

## 配置级联

配置系统采用三级层级：页面级设置覆盖项目级设置，项目级设置再覆盖主题全局默认值。这一模式贯穿整个主题，用于控制布局、样式与行为。

```mermaid
graph LR
    subgraph Global["Global Configuration"]
        STELLAR["stellar:<br/>version, homepage"]
        SITETREE["site_tree:<br/>Layout definitions"]
        ARTICLE["article:<br/>Content settings"]
        PLUGINS["plugins:<br/>Feature toggles"]
    end
    
    subgraph Project["Project-Level"]
        WIKITREE["wiki.tree[project]:<br/>Wiki metadata"]
        TOPICTREE["topic.tree[topic]:<br/>Topic metadata"]
    end
    
    subgraph Page["Page-Level"]
        FRONTMATTER["Front-matter:<br/>page.* variables"]
    end
    
    STELLAR --> SITETREE
    SITETREE --> WIKITREE
    SITETREE --> TOPICTREE
    WIKITREE --> FRONTMATTER
    TOPICTREE --> FRONTMATTER
    ARTICLE --> FRONTMATTER
    PLUGINS --> FRONTMATTER
    
    FRONTMATTER --> OUTPUT["Rendered page<br/>with merged settings"]
```

**参考源码**：[_config.yml](../../../_config.yml)、[layout/layout.ejs](../../../layout/layout.ejs)

`site_tree` 配置为不同类型的页面（博客文章、wiki 页面、笔记本页面等）定义默认布局，单个页面可通过 front-matter 覆盖这些默认值。同样，`article.type`、`article.indent` 等样式选项也可以在 wiki/topic 项目级或页面级覆盖。

## 页面渲染流水线

主题遵循四阶段渲染流水线，从构建期一直到客户端交互状态：

### 阶段 1：构建期数据处理

在 Hexo 构建阶段，主题处理内容文件并构造数据结构。其中 `doc_tree.js` 脚本（见[文档系统](../03-内容系统/wiki-docs.md)）尤其重要——它处理 wiki 配置，构建带小节、标签与交叉引用的层级化文档结构。

### 阶段 2：服务端渲染

`layout.ejs` 负责组装页面：

1. **确定页面特征**（[layout/layout.ejs](../../../layout/layout.ejs)）：
   - `page_type`："index" 或 "content"
   - `article_type`："tech" 或 "story"（影响排版与间距）
   - `indent`：是否段落首行缩进

2. **组装 HTML 结构**（[layout/layout.ejs](../../../layout/layout.ejs)）：
   - `<head>` 元数据、SEO 标签与样式
   - `#l_cover` 页面封面/横幅
   - `.l_body` 包含 `.l_left`（左栏）、`.l_main`（内容区）、`.l_right`（右栏）
   - 脚本与初始化代码

```mermaid
flowchart TD
    HEXODATA["Hexo page data"]
    LAYOUT["layout.ejs"]
    
    HEXODATA --> LAYOUT
    
    LAYOUT --> DETERMINE["Determine characteristics:<br/>page_type, article_type, indent"]
    DETERMINE --> HEAD["Generate head.ejs:<br/>title, meta, canonical, JSON-LD"]
    DETERMINE --> COVER["Generate cover/index.ejs:<br/>Banner or wiki cover"]
    DETERMINE --> SIDEBAR["Generate sidebar partials:<br/>index_leftbar, index_rightbar"]
    DETERMINE --> CONTENT["Generate main content:<br/>Article or list layout"]
    
    HEAD --> HTML["HTML output"]
    COVER --> HTML
    SIDEBAR --> HTML
    CONTENT --> HTML
    
    HTML --> BROWSER["Browser receives HTML"]
```

**参考源码**：[layout/layout.ejs](../../../layout/layout.ejs)、[layout/_partial/head.ejs](../../../layout/_partial/head.ejs)

### 阶段 3：客户端初始化

页面在浏览器中加载后，`stellar.initPage()`（[source/js/main.js](../../../source/js/main.js)）初始化交互功能：

- **目录（TOC）** 滚动同步
- **侧边栏** 交互处理
- **相对时间** 时间戳显示
- **标签页组件** tab 内容切换
- **评论系统** 重新初始化（如有）

### 阶段 4：页面导航与预加载

主题使用普通整页导航；可选的 `plugins.preload`（flying_pages）会在鼠标悬停时预加载站内链接，提升导航体验。PJAX 已于 v1.35.0 移除，详见主题仓库 `docs/designs/2026-08-08-pjax-removal.md`。

**参考源码**：[source/js/main.js](../../../source/js/main.js)、[_config.yml](../../../_config.yml)（`plugins.preload` 小节）

## 内容类型系统

Stellar 支持四套并行内容系统，各有独立的页面类型与导航模式：

### 系统对比

| 系统 | 列表页 | 内容页 | 主要特性 |
|------|--------|--------|----------|
| **博客** | `index_blog` | `post` | 分类、标签、分页、相关文章 |
| **文档（wiki）** | `index_wiki` | `wiki` | 项目树、小节、层级导航 |
| **专栏（topic）** | `index_topic` | `topic` | 系列文章、沉浸式阅读 |
| **笔记本** | `notebooks` → `notes` | `note` | 标签树导航、轻量笔记 |

```mermaid
graph TB
    subgraph MenuBar["Navigation Menu (menubar)"]
        MENU1["Post button<br/>menu_id: post"]
        MENU2["Wiki button<br/>menu_id: wiki"]
        MENU3["Notebooks button<br/>menu_id: notebooks"]
    end
    
    subgraph BlogSystem["Blog System"]
        BLOGINDEX["index_blog layout<br/>Post list with nav_tabs"]
        BLOGPOST["post layout<br/>Article with metadata"]
        BLOGTOPIC["topic layout<br/>Topic/column page"]
    end
    
    subgraph WikiSystem["Wiki System"]
        WIKIINDEX["index_wiki layout<br/>Project list"]
        WIKIPAGE["wiki layout<br/>Documentation page"]
        WIKITREE["wiki.tree config<br/>Project structure"]
    end
    
    subgraph NotebookSystem["Notebook System"]
        NBLIST["notebooks layout<br/>Notebook list"]
        NOTELIST["notes layout<br/>Note list for notebook"]
        NOTEPAGE["note layout<br/>Individual note"]
    end
    
    MENU1 --> BLOGINDEX
    MENU2 --> WIKIINDEX
    MENU3 --> NBLIST
    
    BLOGINDEX --> BLOGPOST
    BLOGPOST --> BLOGTOPIC
    
    WIKIINDEX --> WIKIPAGE
    WIKITREE --> WIKIPAGE
    
    NBLIST --> NOTELIST
    NOTELIST --> NOTEPAGE
```

**参考源码**：[_config.yml](../../../_config.yml)（`site_tree` 小节）、[README.md](../../../README.md)

每个系统通过 `site_tree` 配置决定左右侧边栏显示哪些小部件。例如 wiki 页面左侧显示 tree（页面树）小部件，博客文章显示相关文章小部件。

## 关键子系统

### SEO 与元数据

`head.ejs` 局部模板生成完整的元数据（[layout/_partial/head.ejs](../../../layout/_partial/head.ejs)）：

- **标题生成**：支持 wiki/分类/标签上下文
- **Meta 描述**：来自页面摘要或项目描述
- **规范链接（canonical URL）**：处理重复内容
- **JSON-LD 结构化数据**：供搜索引擎使用（[scripts/helpers/json_ld.js](../../../scripts/helpers/json_ld.js)）
- **Open Graph 标签**：社交分享

### 插件系统

插件采用条件加载模式（[source/css/_plugins/index.styl](../../../source/css/_plugins/index.styl)）。主题检查配置中的 `plugins.*.enable` 标志，按需加载对应 CSS 与 JavaScript，包括：

- 图片增强（fancybox、swiper）
- 代码功能（copycode、语法高亮）
- 数学渲染（katex、mathjax）
- 图表（mermaid）
- 性能（scrollreveal、preload/flying_pages）

详见[插件系统](../07-外部集成/plugin-system.md)。

### 评论集成

评论系统根据 `comments.service` 配置条件加载。每种评论服务（Beaudar、Twikoo、Waline、Artalk、Giscus）都在 `window.stellar.initComments` 注册自己的初始化函数，页面加载完成后调用。

详见[评论系统](../07-外部集成/comment-systems.md)。

### 规范链接与克隆站检测

主题实现了两阶段规范链接系统（[source/js/main.js](../../../source/js/main.js)）：

1. 检查当前域名是否匹配配置的原始站点
2. 校验官方备用域名
3. 对非官方克隆站显示警告
4. 在适当时机注入 `noindex` meta 标签

这有助于防止内容被未经授权的站点复制，同时支持合法的备份部署。

## 数据流总结

下图展示数据从配置到渲染输出的完整流向：

```mermaid
flowchart TD
    CONFIG["_config.yml<br/>Configuration file"]
    MARKDOWN["Markdown files<br/>Posts, pages, wiki docs"]
    
    CONFIG --> HEXO["Hexo build process"]
    MARKDOWN --> HEXO
    
    HEXO --> DOCTREE["doc_tree.js processor<br/>Builds wiki structures"]
    HEXO --> LAYOUTEJS["layout.ejs<br/>Determines page type"]
    
    DOCTREE --> PAGEDATA["Page data object<br/>with merged config"]
    LAYOUTEJS --> PAGEDATA
    
    PAGEDATA --> HEADEJS["head.ejs<br/>SEO metadata"]
    PAGEDATA --> SIDEBAREJS["sidebar partials<br/>Widget assembly"]
    PAGEDATA --> CONTENTEJS["content templates<br/>Article/list rendering"]
    
    HEADEJS --> STATICHTML["Static HTML output"]
    SIDEBAREJS --> STATICHTML
    CONTENTEJS --> STATICHTML
    
    STATICHTML --> BROWSER["Browser loads page"]
    
    BROWSER --> MAINJS["main.js: stellar.initPage()<br/>Interactive features"]
    BROWSER --> LAZYLOAD["lazyload.js<br/>Image loading"]
    BROWSER --> COMMENTS["Comment system init"]
    BROWSER --> PRELOAD["preload (flying_pages)<br/>Link prefetching"]
```

**参考源码**：[_config.yml](../../../_config.yml)、[layout/layout.ejs](../../../layout/layout.ejs)、[source/js/main.js](../../../source/js/main.js)

## 技术栈

主题基于以下技术构建：

- **Hexo**：静态站点生成器（Node.js）
- **EJS**：HTML 模板引擎
- **Stylus**：CSS 预处理器，带设计令牌体系
- **原生 JavaScript**：客户端代码无框架依赖
- **外部库（CDN）**：marked.js（运行时 Markdown 渲染）、vanilla-lazyload（图片懒加载）

**依赖** 定义在 [package.json](../../../package.json) 与 [_config.yml](../../../_config.yml)（`dependencies` 小节）。

## 目录结构概览

主题关键目录：

- `layout/` — EJS 模板
  - `layout.ejs` — 主布局编排
  - `_partial/` — 可复用模板组件
  - `_plugins/` — 插件集成模板
- `source/` — 客户端资源
  - `css/` — Stylus 样式
  - `js/` — JavaScript
    - `main.js` — 核心初始化
    - `plugins/` — 可选功能
    - `services/` — 数据服务
- `scripts/` — Hexo 构建期脚本
  - `helpers/` — 模板辅助函数
  - `generators/` — 页面生成器
  - `tags/` — 标签插件
  - `events/` — 构建事件处理

## 版本与分发

主题版本定义在两处：
- [_config.yml](../../../_config.yml) — `stellar.version`
- [package.json](../../../package.json) — `version` 字段

Stellar 通过 npm 以 `hexo-theme-stellar` 分发，采用 MIT 协议开源。

**参考源码**：[_config.yml](../../../_config.yml)、[package.json](../../../package.json)、[README.md](../../../README.md)

---

本文为理解 Stellar 架构提供了基础。更深入的子系统细节请参考后续各章节。
