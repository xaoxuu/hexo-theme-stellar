---
title: 笔记本系统
domain: 内容系统
tags:
  - 笔记本
  - 笔记
  - 标签树
---

# 笔记本系统

<details>
<summary>相关源码文件</summary>

生成此页面时参考的主题源码文件：

- [.github/workflows/npm-publish.yml](../../../.github/workflows/npm-publish.yml)
- [.npmignore](../../../.npmignore)
- [LICENSE](../../../LICENSE)
- [README.md](../../../README.md)
- [_config.yml](../../../_config.yml)
- [package.json](../../../package.json)

</details>

## 目的与范围

笔记本系统为 Stellar 中的笔记与知识管理提供轻量、基于标签的组织结构。它实现三层架构：笔记本索引、笔记本内笔记列表、单条笔记页面。与[文档系统](wiki-docs.md)（使用层级小节树）不同，笔记本系统用扁平标签导航，组织更灵活。

---

## 三层架构

笔记本系统由三种页面类型构成层级导航结构：

```mermaid
graph TB
    subgraph "notebooks_layout"
        NOTEBOOKS["notebooks layout<br/>Path: /notebooks/<br/>Lists all notebooks"]
    end
    
    subgraph "notes_layout"
        NOTES["notes layout<br/>Path: /notebooks/{notebook}/<br/>Lists notes in a notebook"]
    end
    
    subgraph "note_layout"
        NOTE["note layout<br/>Individual note page"]
    end
    
    subgraph "Configuration Sources"
        GLOBAL["notebook: config<br/>_config.yml"]
        NOTEBOOKS_CFG["site_tree.notebooks"]
        NOTES_CFG["site_tree.notes"]
        NOTE_CFG["site_tree.note"]
        YAML["Notebook YAML file<br/>User-defined metadata"]
        FRONTMATTER["Note front-matter<br/>Per-note overrides"]
    end
    
    subgraph "Navigation Widgets"
        TAGTREE["tagtree widget<br/>Tag-based navigation"]
        RECENT["recent widget<br/>Recent notes"]
        TOC["toc widget<br/>Table of contents"]
    end
    
    NOTEBOOKS --> NOTES
    NOTES --> NOTE
    
    GLOBAL --> NOTEBOOKS_CFG
    GLOBAL --> NOTES_CFG
    GLOBAL --> NOTE_CFG
    
    YAML -.overrides.-> NOTES_CFG
    YAML -.overrides.-> NOTE_CFG
    FRONTMATTER -.overrides.-> NOTE_CFG
    
    NOTES_CFG --> TAGTREE
    NOTES_CFG --> RECENT
    NOTE_CFG --> TAGTREE
    NOTE_CFG --> RECENT
    NOTE_CFG --> TOC
```

**参考源码**：[_config.yml](../../../_config.yml)

---

## 页面类型配置

### 笔记本列表页

`notebooks` 布局以索引页形式显示全部笔记本，是笔记本系统的顶层入口。

| 配置键 | 默认值 | 说明 |
|--------|--------|------|
| `base_dir` | `notebooks` | 笔记本列表的 URL 路径；也是未设置自定义 `base_dir` 的笔记本的默认路径前缀 |
| `menu_id` | `notebooks` | 导航栏中高亮的菜单项 |
| `leftbar` | `recent` | 左栏显示跨全部笔记本的最近笔记 |
| `rightbar` | `null` | 默认空右栏 |

**参考源码**：[_config.yml](../../../_config.yml)

### 笔记列表页

`notes` 布局显示指定笔记本内的全部笔记，支持可选分页与标签过滤。

| 配置键 | 默认值 | 覆盖位置 | 说明 |
|--------|--------|----------|------|
| `menu_id` | `notebooks` | 笔记本 YAML：`menu_id`<br/>笔记 front-matter：`menu_id` | 高亮的菜单项 |
| `leftbar` | `tagtree, recent` | 笔记本 YAML：`leftbar` | 显示当前笔记本的标签树与最近笔记 |
| `rightbar` | `null` | 笔记本 YAML：`rightbar` | 右栏小部件 |

**参考源码**：[_config.yml](../../../_config.yml)

### 单条笔记页

`note` 布局渲染单条笔记，含完整内容与元数据。

| 配置键 | 默认值 | 覆盖位置 | 说明 |
|--------|--------|----------|------|
| `leftbar` | `tagtree, recent` | 笔记本 YAML：`note_leftbar`<br/>笔记 front-matter：`leftbar` | 显示标签树与最近笔记 |
| `rightbar` | `toc` | 笔记本 YAML：`note_rightbar`<br/>笔记 front-matter：`rightbar` | 默认显示目录 |

带 `tags` 的笔记在正文末尾渲染一行所属标签，点击跳转到笔记本标签过滤页；该行复用文章标签行的 `article-tags` 容器与胶囊样式，详见[文章页脚与元数据](article-footer-metadata.md)。

**参考源码**：[_config.yml](../../../_config.yml)、[layout/_partial/main/notebook/note_tags.ejs](../../../layout/_partial/main/notebook/note_tags.ejs)

---

## 配置层级与覆盖系统

笔记本系统实现三级配置级联，可精确控制行为与外观：

```mermaid
graph TD
    subgraph "Level 1: Global Defaults"
        GLOBAL_CFG["notebook:<br/>auto_excerpt: 128<br/>tagcons: {}<br/>per_page: null<br/>order_by: -updated<br/>license: false<br/>share: false"]
    end
    
    subgraph "Level 2: Notebook YAML"
        YAML_CFG["notebook.yml<br/>Can override:<br/>- menu_id<br/>- leftbar/rightbar<br/>- note_leftbar/note_rightbar<br/>- per_page<br/>- order_by<br/>- license<br/>- share"]
    end
    
    subgraph "Level 3: Front-matter"
        FM_CFG["note front-matter<br/>Can override:<br/>- menu_id<br/>- leftbar/rightbar<br/>- license<br/>- share<br/>- pin/sticky"]
    end
    
    subgraph "Runtime Behavior"
        RENDER["Note Rendering"]
        SIDEBAR["Sidebar Widgets"]
        SORT["Sorting Logic"]
        META["Metadata Display"]
    end
    
    GLOBAL_CFG --> YAML_CFG
    YAML_CFG --> FM_CFG
    
    FM_CFG --> RENDER
    FM_CFG --> SIDEBAR
    FM_CFG --> SORT
    FM_CFG --> META
```

**配置参数：**

| 参数 | 类型 | 全局默认 | 覆盖范围 | 说明 |
|------|------|----------|----------|------|
| `auto_excerpt` | `number` | `128` | 无 | 未指定 `excerpt` 与 `description` 时自动摘要的长度 |
| `tagcons` | `object` | `{ '': 'quot:hashtag' }` | 无 | 标签图标映射（显示在标签树中） |
| `per_page` | `number\|null` | `null` | 笔记本 YAML | 每页笔记数（0 = 不分页，null = 用 Hexo 配置） |
| `order_by` | `string` | `-updated` | 笔记本 YAML | 笔记排序（默认按更新时间降序） |
| `license` | `boolean\|string` | `false` | 笔记本 YAML、front-matter | 许可显示（false = 隐藏，true = 用主题许可，string = 自定义文本） |
| `share` | `boolean\|array` | `false` | 笔记本 YAML、front-matter | 分享按钮显示 |

**参考源码**：[_config.yml](../../../_config.yml)

---

## 标签树导航系统

笔记本系统用基于标签的导航替代层级小节。`tagtree` 小部件是主要导航机制：

```mermaid
graph LR
    subgraph "Tag Configuration"
        TAGCONS["tagcons:<br/>Icon mapping"]
    end
    
    subgraph "Tag Tree Widget"
        WIDGET["tagtree widget<br/>Renders tag hierarchy"]
        ICONS["Tag icons<br/>Default: quot:hashtag"]
    end
    
    subgraph "Note Metadata"
        TAGS["note.tags<br/>Array of tag names"]
    end
    
    subgraph "Rendered Output"
        TREE["Clickable tag tree<br/>Filters notes by tag"]
    end
    
    TAGCONS --> ICONS
    ICONS --> WIDGET
    TAGS --> WIDGET
    WIDGET --> TREE
```

标签可通过 `tagcons` 配置自定义图标：

```yaml
notebook:
  tagcons:
    'javascript': 'mdi:language-javascript'
    'python': 'mdi:language-python'
    '': 'quot:hashtag'  # 未匹配标签的默认图标
```

**参考源码**：[_config.yml](../../../_config.yml)

---

## 排序与置顶系统

笔记支持带优先级置顶的灵活排序：

```mermaid
flowchart TD
    NOTES["All notes in notebook"]
    CHECK_PIN{"Has pin or<br/>sticky in<br/>front-matter?"}
    PINNED["Pinned notes<br/>Sort by pin value"]
    UNPINNED["Unpinned notes<br/>Sort by order_by"]
    
    COMBINE["Combined list:<br/>Pinned first,<br/>then unpinned"]
    
    NOTES --> CHECK_PIN
    CHECK_PIN -->|"pin:true<br/>pin:number<br/>sticky:true<br/>sticky:number"| PINNED
    CHECK_PIN -->|"No pin"| UNPINNED
    
    PINNED --> COMBINE
    UNPINNED --> COMBINE
```

**置顶笔记：**

在笔记 front-matter 中设置 `pin` 或 `sticky`：

```yaml
---
pin: true      # 置顶
pin: 10        # 带优先级 10 置顶（越大越靠前）
sticky: true   # 同 pin:true
sticky: 5      # 同 pin:5
---
```

**排序：**

`order_by` 决定未置顶笔记的排序。默认 `-updated`（最近更新优先）。

**参考源码**：[_config.yml](../../../_config.yml)

---

## 分页配置

分页行为在笔记本级控制：

```mermaid
graph TD
    PER_PAGE["per_page config"]
    CHECK{"Value?"}
    
    ZERO["per_page: 0<br/>No pagination"]
    NULL["per_page: null<br/>Use Hexo config"]
    NUMBER["per_page: N<br/>N notes per page"]
    
    HEXO_CONFIG["hexo._config.yml<br/>per_page setting"]
    
    PER_PAGE --> CHECK
    CHECK -->|"0"| ZERO
    CHECK -->|"null"| NULL
    CHECK -->|"number > 0"| NUMBER
    
    NULL --> HEXO_CONFIG
```

**配置示例：**

```yaml
# 全局默认（应用于所有笔记本）
notebook:
  per_page: null  # 使用 Hexo 的分页配置
```

```yaml
# notebook.yml 中笔记本级覆盖
per_page: 20  # 每页 20 条笔记
```

```yaml
# 禁用某笔记本的分页
per_page: 0  # 全部笔记放在一页
```

**参考源码**：[_config.yml](../../../_config.yml)

---

## 元数据显示配置

笔记可显示许可信息与分享按钮，由三级层级控制：

| 特性 | 默认 | 覆盖位置 | 值 |
|------|------|----------|-----|
| `license` | `false` | 笔记本 YAML：`license`<br/>front-matter：`license` | `false` = 隐藏<br/>`true` = 用主题许可<br/>`"custom text"` = 自定义许可 |
| `share` | `false` | 笔记本 YAML：`share`<br/>front-matter：`share` | `false` = 隐藏<br/>`true` = 显示<br/>`[array]` = 指定服务 |

**示例配置：**

```yaml
# 全局默认：无许可与分享按钮
notebook:
  license: false
  share: false
```

```yaml
# 笔记本 YAML：对该笔记本内所有笔记启用
license: true
share: ['wechat', 'weibo', 'link']
```

```yaml
# Front-matter：单条笔记覆盖
---
license: "Custom license text for this note"
share: true
---
```

**参考源码**：[_config.yml](../../../_config.yml)

---

## 侧边栏小部件系统

笔记本系统使用标准小部件系统，常用三种小部件：

| 小部件 | 用途 | 典型位置 | 范围 |
|--------|------|----------|------|
| `tagtree` | 基于标签的导航 | 左栏 | 仅当前笔记本 |
| `recent` | 最近笔记列表 | 左栏 | 全部笔记本（notebooks 页）或当前笔记本（notes/note 页） |
| `toc` | 目录 | 右栏 | 仅当前笔记页 |

**小部件配置模式：**

```yaml
site_tree:
  notebooks:
    leftbar: recent  # 跨全部笔记本的最近笔记
  notes:
    leftbar: tagtree, recent  # 当前笔记本的标签树 + 最近笔记
  note:
    leftbar: tagtree, recent  # 同 notes 页
    rightbar: toc  # 当前笔记的目录
```

**参考源码**：[_config.yml](../../../_config.yml)

---

## 菜单集成

三种笔记本页面类型都可以高亮导航栏中的菜单项：

```mermaid
graph LR
    subgraph "Menu Configuration"
        MENUBAR["menubar.items"]
        ITEM["Menu item with<br/>id: notebooks"]
    end
    
    subgraph "Page Configuration"
        NB_MENU["notebooks.menu_id<br/>Default: notebooks"]
        NT_MENU["notes.menu_id<br/>Default: notebooks"]
        N_MENU["note.menu_id<br/>Can override"]
    end
    
    subgraph "Rendered Page"
        HIGHLIGHT["Highlighted menu item<br/>Active state applied"]
    end
    
    MENUBAR --> ITEM
    ITEM --> HIGHLIGHT
    
    NB_MENU --> HIGHLIGHT
    NT_MENU --> HIGHLIGHT
    N_MENU --> HIGHLIGHT
```

**覆盖层级：**

1. 全局默认：`site_tree.notebooks.menu_id`、`site_tree.notes.menu_id`
2. 笔记本 YAML：`menu_id`（影响 notes 与 note 页）
3. 笔记 front-matter：`menu_id`（仅影响该笔记）

**参考源码**：[_config.yml](../../../_config.yml)

---

## 自动摘要生成

笔记缺少显式 `excerpt` 或 `description` 字段时，系统自动生成摘要：

```mermaid
flowchart TD
    NOTE["Note content"]
    CHECK{"Has excerpt or<br/>description?"}
    USE_EXPLICIT["Use explicit value"]
    AUTO_GENERATE["Auto-generate excerpt"]
    
    LENGTH["Take first N characters<br/>N = auto_excerpt config"]
    
    DISPLAY["Display in note list"]
    
    NOTE --> CHECK
    CHECK -->|"Yes"| USE_EXPLICIT
    CHECK -->|"No"| AUTO_GENERATE
    
    AUTO_GENERATE --> LENGTH
    LENGTH --> DISPLAY
    USE_EXPLICIT --> DISPLAY
```

`auto_excerpt` 配置（默认 `128`）决定从笔记内容提取多少字符。

**参考源码**：[_config.yml](../../../_config.yml)

---

## 文件系统组织

笔记本系统期望以下目录结构：

```
source/
├── _data/
│   └── notebooks/
│       ├── notebook1.yml    # 笔记本元数据
│       └── notebook2.yml
└── notebooks/               # base_dir（可配置）
    ├── notebook1/
    │   ├── note1.md
    │   └── note2.md
    └── notebook2/
        └── note3.md
```

`_data/notebooks/` 中每个笔记本 YAML 定义笔记本元数据并可覆盖全局配置：

```yaml
# _data/notebooks/mynotebook.yml
title: My Notebook
menu_id: notebooks
leftbar: tagtree, recent
per_page: 15
order_by: -updated
license: true
share: ['link']
```

注意：笔记本数据在**用户站点**的 `source/_data/notebooks/`，不属于主题仓库。

**参考源码**：[_config.yml](../../../_config.yml)
