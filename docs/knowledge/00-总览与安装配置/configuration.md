---
title: 配置系统
domain: 总览与安装配置
tags:
  - 配置
  - YAML
  - layout profiles
---

# 配置系统

> [!IMPORTANT]
> 本页保留部分 v1 配置示例用于说明系统组成。v2 的内容字段、页面 Front Matter 与命名规范以[内容配置 Schema v2](../03-内容系统/content-schema-v2.md)为准。

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

配置系统是驱动 Stellar 主题行为、外观与功能启用的核心控制机制。本文介绍 `_config.yml` 的结构、层级覆盖模式、配置值在渲染流水线中的流向，以及各子系统如何消费配置。

安装与初始化见[安装与启动](installation.md)，样式相关配置见[样式系统](../01-样式系统/styling-overview.md)，插件配置见[插件系统](../07-外部集成/plugin-system.md)。

## 配置架构

配置系统实现三级级联，值可以在越来越具体的范围内被覆盖：

```mermaid
graph TB
    subgraph "Configuration Sources"
        THEMECONFIG["_config.yml<br/>(Theme Root)"]
        PROJMETA["Collection YAML<br/>(wiki, topic, notebook)"]
        PAGEMETA["Page Front-matter<br/>(post/wiki/note files)"]
    end
    
    subgraph "Runtime Resolution"
        THEMESCHEMA["Theme Config Schema<br/>hexo.stellar.config"]
        CONTENTSCHEMA["Content Config Schema<br/>stellarConfig"]
    end
    
    subgraph "Consumption Points"
        LAYOUT["layout.ejs<br/>Page orchestration"]
        PARTIAL["Partial templates<br/>sidebar, navbar, etc"]
        CSSGEN["_custom.styl<br/>CSS variable generation"]
        JSLOAD["scripts/index.ejs<br/>Plugin loading"]
        DOCTREE["doc_tree.js<br/>Wiki processing"]
    end
    
    THEMECONFIG --> THEMESCHEMA
    PROJMETA --> CONTENTSCHEMA
    PAGEMETA --> CONTENTSCHEMA
    
    THEMESCHEMA --> LAYOUT
    THEMESCHEMA --> PARTIAL
    THEMESCHEMA --> CSSGEN
    THEMESCHEMA --> JSLOAD
    CONTENTSCHEMA --> LAYOUT
    CONTENTSCHEMA --> PARTIAL
    CONTENTSCHEMA --> JSLOAD
    CONTENTSCHEMA --> DOCTREE
    
    LAYOUT --> OUTPUT["Rendered HTML"]
    CSSGEN --> OUTPUT
    JSLOAD --> OUTPUT
```

**参考源码**：[_config.yml](../../../_config.yml)

### v2 配置迁移边界

Pre-alpha M1.5 已建立内部配置入口目录，并进一步把 v2 最终公开主题配置冻结为 `site`、`seo`、`layout`、`content`、`appearance`、`resources`、`extensions`、`inject` 八个职责根域。完整目标树、命名、级联和旧→新迁移矩阵见[最终配置契约](../../designs/2026-08-22-v2-config-target-contract/target-contract.md)。

head/SEO、site Shell、Layout Profile、内容默认值、Collection / Front Matter、Appearance、资源兜底、Extension 与服务纵向切片已把八根域的业务配置接入声明式 Schema。运行时与配置 Reference 只投影已交付节点；根级封闭和 `system` 内部化仍保持 `planned`。

已交付的主题字段从 Schema 与 `_config.stellar.yml` 解析到冻结的 `hexo.stellar.config`；Collection YAML 与 Front Matter 分别解析为冻结的 camelCase 对象，由生成器、数据树、ViewModel 与按需插件消费。Hexo 自有 Front Matter 保持原名，不进入 Stellar Reference。

## 配置文件结构

`_config.yml` 按逻辑小节组织，控制不同子系统：

| 小节 | 用途 |
|------|------|
| `stellar` | 主题元数据与资源路径 |
| `seo` | SEO、Canonical、Open Graph 与结构化数据（v2 已交付） |
| `site` | 站点 Brand、主菜单、左栏操作与页尾内容（v2 已交付） |
| `layout.profiles` | 13 类页面的路径、导航与左右侧栏默认值（v2 已交付） |
| `content.article` | 文章显示、列表、Footer 与相关内容默认值（v2 已交付） |
| `content.notebook` | 笔记本列表、标签图标与 Footer 默认值（v2 已交付） |
| `appearance` | 排版、形状、颜色、渐变、动效、代码块与页面背景（v2 已交付） |
| `resources` | 预连接提示与图片资源兜底（v2 已交付） |
| `extensions.search` | Local / Algolia 搜索 provider |
| `extensions.comments` | 评论 provider 与第三方参数袋 |
| `extensions.tags` | 标签 Extension 行为 |
| `extensions.features` | 可选 Feature 的注册式配置 |
| `extensions.services` | 业务端点与 GitHub 完整 URL |
| `extensions.cache` | 浏览器数据缓存策略 |
| `system` | 内部 Hexo 覆盖 |

**参考源码**：[_config.yml](../../../_config.yml)

`inject.head/script` 也已交付，但它是站点与页面级的可信逃生口，只从站点 `_config.stellar.yml` 和页面 Front Matter 读取，不是主题 `_config.yml` 的默认配置小节。

### 卡片 Hover 插件

`extensions.features.card_hover` 提供可复用的鼠标跟随光斑与 3D 倾斜，默认关闭：

```yaml
extensions:
  features:
    card_hover:
      enabled: false
      spotlight_color: 'rgba(255, 255, 255, 0.25)'
      max_tilt: 3
```

`spotlight_color` 控制光斑颜色；单个组件可用 CSS 变量 `--card-hover-spotlight-color` 覆盖。`max_tilt` 单位为度，无效值回退为 `3`，运行时限制在 `0`～`8` 的安全范围。插件采用 `.card-hover` 基础类与 `.card-hover--spotlight`、`.card-hover--tilt` 修饰类组合，关闭时这些类不会改变静态样式。完整的运行时接口与接入范围见[插件系统](../07-外部集成/plugin-system.md#card-hover卡片光效与倾斜)。

**参考源码**：[_config.yml](../../../_config.yml)、[layout/_plugins/card_hover.ejs](../../../layout/_plugins/card_hover.ejs)

## 层级覆盖系统

配置值的解析遵循「越具体的范围覆盖越宽泛的范围」：

```mermaid
graph LR
    subgraph "Resolution Order"
        direction LR
        GLOBAL["Global Config<br/>theme.*"]
        PROJECT["Project Config<br/>wiki.tree[proj].*, notebook yaml"]
        PAGE["Page Config<br/>page.menu_id, page.leftbar"]
    end
    
    subgraph "Example: active menu Resolution"
        direction TB
        CHECK1["Check page navigation override<br/>(front-matter)"]
        CHECK2["Check collection navigation<br/>(wiki or notebook YAML)"]
        CHECK3["Check layout.profiles.*<br/>.navigation.active_menu"]
        FALLBACK["Fallback: undefined"]
    end
    
    GLOBAL --> PROJECT
    PROJECT --> PAGE
    
    CHECK1 -->|"if undefined"| CHECK2
    CHECK2 -->|"if undefined"| CHECK3
    CHECK3 -->|"if undefined"| FALLBACK
```

**参考源码**：[_config.yml](../../../_config.yml)（`layout.profiles` 小节）

### 示例：导航高亮解析

对 wiki 页面，配置 Profile 的最终字段是 `navigation.active_menu`；Collection / Front Matter 的 `navigation.menu` 在声明式 Schema 边界冻结为 `navigation.menu`。解析顺序为：

1. **页面级**：`page.navigation.menu`（front-matter）
2. **集合级**：Collection YAML 的 `navigation.menu`
3. **布局级**：`hexo.stellar.config.layout.profiles.wiki.navigation.activeMenu`
4. **全局兜底**：`undefined`

### 示例：侧边栏小部件分配

侧边栏小部件遵循同样模式：

1. **页面级**：`page.sidebar.left.widgets` / `page.sidebar.right.widgets`（front-matter）
2. **笔记本级**：笔记页使用笔记本 YAML 中的 `note_defaults.sidebar.left/right.widgets`
3. **布局级**：`hexo.stellar.config.layout.profiles[profile].sidebar.left/right.widgets`
4. **默认**：空侧边栏

**参考源码**：[_config.yml](../../../_config.yml)（`layout.profiles` 小节）

## 核心配置小节

### Stellar 元数据

`stellar` 小节定义主题身份与核心资源路径：

```yaml
stellar:
  version: '1.39.1'
  homepage: 'https://xaoxuu.com/wiki/stellar/'
  repo: 'https://github.com/xaoxuu/hexo-theme-stellar'
  main_css: /css/main.css
  main_js: /js/main.js
```

这些值用于模板中的版本展示、资源加载与文档链接。

**参考源码**：[_config.yml](../../../_config.yml)

### SEO 与 meta 标签

`seo` 小节统一控制索引、分享与结构化数据：

- **`seo.canonical`**：通过 `host` 与 `allowed_hosts` 校验域名，检测并警告克隆站
- **`seo.open_graph`**：启用 Open Graph meta 标签，用于社交分享
- **`seo.structured_data`**：通过 `same_as` 为 JSON-LD 作者/组织提供公开身份链接

Pre-alpha M1.5 的声明式 Schema 定义默认值、类型、站点覆盖、规范化、消费方与 Reference 元数据，冻结结果位于 `hexo.stellar.config.seo`。YAML 使用 snake_case，JavaScript 使用 `openGraph/structuredData/allowedHosts/twitterId/sameAs`；已迁移旧根和旧子字段直接报迁移错误。

```yaml
seo:
  canonical:
    host: example.com
    allowed_hosts:
      - mirror.example.com
  open_graph:
    enabled: true
    twitter_id:
  structured_data:
    same_as:
      - https://github.com/example
```

`seo` 子树已封闭，配置根仍保持开放以容纳尚未迁移的其它域。`resources.preconnect` 数组由站点层完整替换；`inject.head/script` 是可信多行字符串。实现细节见[HTML Head 与 SEO 元数据](../02-布局系统/head-seo.md)和[Canonical URL 系统](../05-前端交互/canonical-url.md)。

**参考源码**：[_config.yml](../../../_config.yml)

### 站点 Shell：Brand、菜单与 Footer

`site` 小节统一承载站点外壳。Brand 的 `image.src/name/tagline` 省略时直接从 Hexo `avatar/title/subtitle` 派生，不再要求站点配置写 `{config.*}` 占位符：

```yaml
site:
  brand:
    image:
      variant: avatar
      url: /about/
    url: /
  menu:
    items:
      - id: post
        title: 博客
        icon: default:documents
        url: /
        accent: '#1BCDFC'
  footer:
    actions: {}
    sections: []
    content: |
```

Brand 图片展示变体使用 `image.variant`（`avatar/icon/plain`），图片和名称链接分别写入 `image.url` 与根级 `url`。菜单数组使用 `id/title/icon/url/accent`；站点层完整替换数组。Footer 的动态操作记录位于 `actions`，分栏链接位于 `sections`，版权或说明原文位于 `content`。旧主题根 `brand/menubar/footer` 及其 `style/theme/social/sitemap/type/onclick` 子字段不会兼容读取，而会报告目标路径。

解析后 JavaScript 只消费冻结的 `hexo.stellar.config.site`；菜单与 Footer 不再直接读取 `theme.menubar/footer`，Post 与 Topic 的全局 Brand 也不再从 `theme.brand` 推断。Collection 与 Front Matter 的 Brand 覆盖仍在内容边界适配，最终字段收敛留给后续切片。

**参考源码**：[_config.yml](../../../_config.yml)

### Layout Profile：页面默认布局

`layout.profiles` 是 v2 的页面布局契约。公开 YAML 固定使用 `home`、`blog_index`、`topic_index`、`wiki_index`、`post`、`topic`、`wiki`、`notebook_index`、`note_index`、`note`、`author`、`error`、`page` 十三个 Profile ID；解析后的 JavaScript ViewModel 使用 `blogIndex`、`wikiIndex` 等 camelCase 键。

每个 Profile 是封闭对象，可包含：

| 属性 | 类型 | 用途 |
|------|------|------|
| `path` | String / null | 生成页面的根相对路径；目录路径以 `/` 结尾 |
| `navigation.active_menu` | String / null | 要高亮的 `site.menu.items[].id` |
| `sidebar.left.widgets` | Array | 左栏小部件列表 |
| `sidebar.right.widgets` | Array | 右栏小部件列表 |
| `navigation.tabs` | Object | 次级导航标签（标题-URL 对） |

#### 示例：博客文章布局

```yaml
layout:
  profiles:
    post:
      navigation:
        active_menu: post
      sidebar:
        left:
          widgets: [related, recent]
        right:
          widgets: [ghrepo, toc]
```

所有博客文章（`layout: post`）将：

- 高亮 `post` 菜单栏项
- 左栏显示 `related`、`recent` 小部件
- 右栏显示 `ghrepo`、`toc` 小部件

**参考源码**：[_config.yml](../../../_config.yml)

#### 示例：Wiki 布局

```yaml
layout:
  profiles:
    wiki_index:
      path: /wiki/
      navigation:
        active_menu: wiki
        tabs: {}
      sidebar:
        left:
          widgets: [related, recent]
        right:
          widgets: []

    wiki:
      navigation:
        active_menu: wiki
      sidebar:
        left:
          widgets: [tree, related, recent]
        right:
          widgets: [ghrepo, toc]
```

`wiki_index` 定义 wiki 列表页，`wiki` 定义单个 wiki 页面。wiki 页面左栏的 `tree` 小部件用于展示项目结构。数组在站点层完整替换；`navigation.tabs` 按键合并。旧 `site_tree`、`base_dir`、`navigation.menu` 与旧 Profile ID 不保留兼容读取。

**参考源码**：[_config.yml](../../../_config.yml)

### 置顶内容轮播

置顶内容的展示样式由 `content.article.listing.pinned_layout` 控制：`carousel`（默认）为轮播；`flat`（平铺）时文章不进入轮播区，改为在首页第一页文章列表靠前展示（排序规则与轮播一致）。

`carousel`（默认）：所有带 navbar top 的博客类列表页（首页/归档/标签/分类/专栏等）上方自动展示置顶文章轮播，无需开关配置：只要有置顶内容即渲染，自动轮播间隔固定 5000ms；首页第一页列表不再重复展示置顶文章。

`flat`（平铺）：博客类列表页不渲染文章轮播；首页第一页文章列表顶部按轮播同款规则展示全部置顶文章（含超出单页切片的老文章），同页不重复；归档/分类/标签/首页第二页起的列表中置顶文章按日期正常出现。

- 置顶文章判定与排序（两种样式通用）：文章 front-matter `pin: true|number`，兼容 `sticky` 别名；只要设置即置顶，按数值降序排序，`true` 视作 1，0/负数同样参与，非数字视作 0，权重相同保持 `site.posts` 原顺序；
- wiki 列表放置顶 wiki 项目（数据文件 `pin: true|number`，规则同上），始终以轮播展示，不受 `content.article.listing.pinned_layout` 影响；
- 轮播区宽高比与非置顶文章统一，由 `content.article.listing.cover_ratio` 控制；
- 无置顶内容时不渲染；轮播进度按内容类型分组缓存到 localStorage（切换 tab 不重置）。

**参考源码**：[_config.yml](../../../_config.yml)、[layout/_partial/main/pin_slider.ejs](../../../layout/_partial/main/pin_slider.ejs)

### 笔记本配置

`content.notebook` 提供主题默认值，可被迁移期的单个笔记本 YAML 覆盖：

```yaml
content:
  notebook:
    listing:
      excerpt_length: 128
      per_page: null  # null 继承 Hexo 配置
      order_by: -updated
    tag_icons: {}
    footer:
      license: false
      share: false
```

这些冻结默认值进入 Notebook CollectionModel；当前笔记本 YAML 仍可用 `listing`、`footer`、`sidebar` 与 `note.sidebar` 覆盖，最终 Collection 命名留待后续切片。

**参考源码**：[_config.yml](../../../_config.yml)

### 文章配置

`content.article` 控制文章主题默认值；YAML 为 snake_case，冻结 JavaScript 为 camelCase：

| 字段 | 类型 | 默认 | 用途 |
|------|------|------|------|
| `type` | `tech` / `story` | `tech` | 布局风格（tech 紧凑、story 宽松） |
| `indent` | Boolean / null | `null` | null 保留 story 自动缩进；布尔值显式覆盖 |
| `listing.pinned_layout` | `carousel` / `flat` | `carousel` | 置顶文章布局 |
| `listing.cover_ratio` | 正数 | `2` | 文章卡片与置顶轮播封面宽高比 |
| `listing.card_layout` | `hero` / `classic` | `hero` | hero 全图文字封面；classic 普通卡片 |
| `banner.ratio` | 正数 | `2.5` | 文章横幅宽高比 |
| `listing.excerpt_length` | 非负数 | `128` | 自动摘要提取字符数 |
| `show_reading_time` | Boolean | `false` | 文章页显示字数与预计阅读时长 |
| `listing.show_tags` | Boolean | `false` | 文章卡片显示标签（最多 5 个） |
| `show_tags` | Boolean | `true` | 文章页末尾显示本文标签 |
| `ai_label` | Object | 四档默认 | 文章 AI 成分标签：`manual` / `polished` / `generated` / `reviewed` 的文字颜色（无底色）与可选 `icon`，front-matter 用 `ai_label` 字段选择；文案由多语言系统提供（`languages/*.yml` 的 `meta.ai_label.*`，缺失时不渲染）；`default` 为空时未标记文章不渲染，非空时未标记文章按默认档渲染；banner 含图片时文字用默认颜色 |
| `footer.license` | String/Boolean | 许可文本 | 文章默认许可声明 |
| `footer.share` | Boolean / Array | `false` | 分享按钮：`wechat`、`weibo`、`email`、`link` |
| `related_posts.enabled/limit` | Boolean / 非负数 | `false` / `5` | 相关文章开关与数量上限 |

主题级旧根 `article` / `notebook` 不再兼容读取。Collection / Front Matter 仍通过现有 `article`、`footer` 等局部覆盖进入模型，待后续统一 Schema 切片再改名。

**参考源码**：[_config.yml](../../../_config.yml)

### 页脚配置

`site.footer` 包含左栏底部操作、主内容区页脚分栏和 Markdown 文本：

| 字段 | 类型 | 用途 |
|------|------|------|
| `actions` | Object | 左栏底部操作；按 YAML 字段顺序显示 |
| `actions.*.icon` | String | 普通按钮或 dropdown 主按钮图标 |
| `actions.*.title` | String | 普通按钮 tooltip 或 dropdown 无障碍标签 |
| `actions.*.url` | String | 普通按钮链接 |
| `actions.*.action` | String | 普通按钮受信任点击脚本，与 `url` 二选一 |
| `actions.spacer` | Object | 弹性占位项；将其后的按钮推至同一行右侧 |
| `actions.*.variant` | `dropdown` | 将条目渲染为通用下拉菜单 |
| `actions.*.items` | Array | dropdown 子项列表；`title`、`url` 必填，`icon` 可选 |
| `sections` | Array | 主内容区页脚的分组链接 |
| `content` | String | 主内容区页脚的 Markdown 文本 |

dropdown 示例：

``@@BT@yaml
site:
  footer:
    actions:
      links:
        variant: dropdown
        icon: default:documents
        title: 更多链接
        items:
          - icon: default:documents
            title: 文档
            url: /wiki/
          - title: GitHub
            url: https://github.com/
``@@BT@

未设置 `variant` 的 action 保持普通链接或动作行为。若要在一组按钮中撑开中间空间，可在需要的位置加入 `spacer: {}`：

``@@BT@yaml
site:
  footer:
    actions:
      github:
        icon: default:github
        url: https://github.com/
      spacer: {}
      links:
        variant: dropdown
        icon: default:documents
        title: 更多链接
        items: []
``@@BT@

dropdown 子项图标可省略。菜单不关联语言或其它业务场景，也不支持嵌套；打开后挂载到 `body` 下的全局浮层，并根据触发按钮周围的可用空间自动调整上下和左右位置。菜单自身声明 glass surface，条目复用通用 collection list 的结构与交互样式。

**参考源码**：[_config.yml](../../../_config.yml)、[layout/_partial/sidebar/index_leftbar.ejs](../../../layout/_partial/sidebar/index_leftbar.ejs)、[layout/_partial/dropdown.ejs](../../../layout/_partial/dropdown.ejs)、[layout/_partial/main/footer.ejs](../../../layout/_partial/main/footer.ejs)

### Appearance 与资源兜底

`appearance` 小节定义视觉语义，`resources.fallbacks` 集中管理图片兜底；YAML 使用 snake_case，运行时由 Schema 投影为冻结的 camelCase：

```mermaid
graph TB
    subgraph "Appearance Configuration"
        STYLE["appearance section<br/>in _config.yml"]
        
        THEME["color_scheme: auto/light/dark"]
        FONTSIZE["typography.font_size"]
        FONTFAMILY["typography.font_family"]
        BORDER["shape.radius"]
        COLOR["colors: theme, accent, link"]
        LEFTBAR["backgrounds.sidebar/page"]
        GRADIENT["gradients"]
    end
    
    subgraph "CSS Variable Generation"
        CUSTOMSTYL["_custom.styl<br/>Design token layer"]
        CSSROOT[":root CSS variables<br/>--fs-root, --fs-content-base, --fs-content, --gap-*, --width-*"]
    end
    
    subgraph "Component Consumption"
        LAYOUT["Layout styles"]
        MDTEXT["Markdown content styles"]
        SIDEBAR["Sidebar styles"]
        CODEBLOCK["Code block styles"]
    end
    
    STYLE --> CUSTOMSTYL
    CUSTOMSTYL --> CSSROOT
    
    CSSROOT --> LAYOUT
    CSSROOT --> MDTEXT
    CSSROOT --> SIDEBAR
    CSSROOT --> CODEBLOCK
```

**参考源码**：[_config.yml](../../../_config.yml)（`appearance`、`resources` 小节）

关键样式配置：

1. **字号**：`appearance.typography.font_size.root` 设置桌面端根字号；行内代码与代码块分别使用 `inline_code` / `code_block`。
2. **圆角**：`appearance.shape.radius` 使用 `card_large/card/card_small` 与 `image_large/image/image_small` 的完整语义名。
3. **颜色**：`appearance.colors.theme/accent/link` 使用 HSL 值，便于精确调色。
4. **左栏外观**：支持纯色、渐变或带模糊效果的背景图
5. **资源兜底**：`resources.fallbacks` 按 `avatar/link_card/cover/project_icon/banner/topic_cover/image/error_page` 的实际角色命名。

完整样式细节见[设计令牌与 CSS 变量](../01-样式系统/design-tokens.md)。

**参考源码**：[_config.yml](../../../_config.yml)

### Extension 配置

可选能力位于 `extensions.features`，统一使用 `enabled`：

```yaml
extensions:
  features:
    lightbox:
      enabled: true
      provider: fancybox
      selector: .timenode p>img
    adaptive_text:
      enabled: true
```

官方 JavaScript、CSS 与 inject 资源由主题内部注册表所有，不是公开配置。Feature 只保留启用状态、provider 与业务行为参数。

`adaptive_text` 为内置能力（默认 `enabled: true`）：背景图/背景色上方的文字颜色随背景亮度自适应，页面存在 `[data-text-adaptive]` 元素时才加载计算脚本并写入 `--text-banner` / `--text-banner-theme`。

插件加载机制见[插件系统](../07-外部集成/plugin-system.md)。

**参考源码**：[_config.yml](../../../_config.yml)（`extensions.features` 小节）

### 数据服务配置

`extensions.services` 只定义公开业务端点；官方客户端模块由主题内部注册表按需加载：

```yaml
extensions:
  services:
    site_info:
      endpoint: https://api.xaox.cc/site_info/v1?url={href}
    rating:
      endpoint: https://star-vote.xaox.cc/api/rating
```

服务仅在对应标签插件或组件生成匹配 DOM 时加载。`js` 不再是公开字段；业务 URL 统一称 `endpoint`。

**参考源码**：[_config.yml](../../../_config.yml)（`extensions.services` 小节）

### 评论系统配置

`extensions.comments` 支持多种第三方 provider，采用单 provider 激活模型：

```yaml
extensions:
  comments:
    provider: beaudar
    title: 快来参与讨论吧~
    providers:
      beaudar: {}
```

每个 provider 的上游字段位于 `providers.<provider>` 参数袋。页面与 Collection 覆盖统一使用 `comments.provider/options`。

集成细节见[评论系统](../07-外部集成/comment-systems.md)。

**参考源码**：[_config.yml](../../../_config.yml)（`extensions.comments` 小节）

## 配置访问方式

### EJS 模板中

已交付的 Stellar 配置通过 `stellar_config()` 读取冻结运行时；`theme` 只保留尚未迁移的内部元数据：

```ejs
<% if (theme.stellar.version) { %>
  Version: <%= theme.stellar.version %>
<% } %>

<% const menuId = stellar_config(`layout.profiles.${profile}.navigation.activeMenu`) %>
```

### Stylus 文件中

`hexo-config()` 函数从 `_config.yml` 取值：

```stylus
$root-font-size = hexo-config('appearance.typography.font_size.root')
$theme-color = hexo-config('appearance.colors.theme')

:root
  font-size: $root-font-size
  --theme-color: $theme-color
```

**参考源码**：[source/css/_custom.styl](../../../source/css/_custom.styl)

### 数据处理脚本中

Node.js 脚本通过 Hexo 的 `config` 对象访问配置：

```javascript
// 在 scripts/events/lib/doc_tree.js 中
hexo.stellar.config.layout.profiles.wikiIndex.path
```

## 配置解析示例

下面是系统为 wiki 页面解析配置的过程：

```mermaid
flowchart TD
    START["Wiki page requested<br/>layout: wiki<br/>wiki_name: stellar"]
    
    CHECK_MENU["Resolve active menu"]
    PAGE_MENU{"page navigation<br/>override exists?"}
    PROJ_MENU{"wiki collection<br/>navigation exists?"}
    LAYOUT_MENU["Use layout.profiles.wiki<br/>.navigation.active_menu"]
    
    CHECK_SIDEBAR["Resolve leftbar widgets"]
    PAGE_LB{"page.leftbar<br/>exists?"}
    PROJ_LB{"wiki.tree[stellar]<br/>.leftbar exists?"}
    LAYOUT_LB["Use layout.profiles.wiki<br/>.sidebar.left.widgets"]
    
    RENDER["Render page with<br/>menu_id + leftbar"]
    
    START --> CHECK_MENU
    CHECK_MENU --> PAGE_MENU
    PAGE_MENU -->|"Yes"| CHECK_SIDEBAR
    PAGE_MENU -->|"No"| PROJ_MENU
    PROJ_MENU -->|"Yes"| CHECK_SIDEBAR
    PROJ_MENU -->|"No"| LAYOUT_MENU
    LAYOUT_MENU --> CHECK_SIDEBAR
    
    CHECK_SIDEBAR --> PAGE_LB
    PAGE_LB -->|"Yes"| RENDER
    PAGE_LB -->|"No"| PROJ_LB
    PROJ_LB -->|"Yes"| RENDER
    PROJ_LB -->|"No"| LAYOUT_LB
    LAYOUT_LB --> RENDER
```

**参考源码**：[_config.yml](../../../_config.yml)

## 默认资源配置

`resources.fallbacks` 为缺失资源提供兜底：

| 资源类型 | 用途 | 示例 |
|----------|------|------|
| `avatar` | 用户头像 | 默认头像 |
| `cover` | 文章封面 | 缺失封面的占位 |
| `banner` | 文章横幅 | 默认头图 |
| `link_card` | 链接卡片图标 | 站点信息不可用时显示 |
| `project_icon` | 项目图标 | Wiki/项目缺少图标时显示 |
| `image.content` | 正文图片错误兜底 | 普通内容图片加载失败时使用 |
| `image.tag_plugin` | 标签图片错误兜底 | 图片型标签加载失败时使用 |
| `error_page` | 错误页插图 | 404 页面资源兜底 |

这些默认值避免出现破图，保证资源缺失时的一致性体验。

**参考源码**：[_config.yml](../../../_config.yml)

## 系统配置

`system` 小节包含内部覆盖：

```yaml
system:
  override_pretty_urls: true
```

这确保 URL 格式化不受 Hexo `pretty_urls` 配置影响，减少边界情况、提升可靠性。

**参考源码**：[_config.yml](../../../_config.yml)

## 配置最佳实践

### 1. 覆盖层级策略

只在必要层级做覆盖：

- 全局默认值保证全站一致
- 项目级用于 wiki 或笔记本的专属行为
- 页面级仅用于个别例外

### 2. 菜单 ID 一致性

保持相关 Profile 的 `navigation.active_menu` 一致。例如所有博客相关页面都使用 `post`：

```yaml
layout:
  profiles:
    blog_index:
      navigation:
        active_menu: post
    post:
      navigation:
        active_menu: post
    topic:
      navigation:
        active_menu: post
```

**参考源码**：[_config.yml](../../../_config.yml)

### 3. 小部件分配模式

常见组合：

| 页面类型 | 左栏 | 右栏 |
|----------|------|------|
| 博客文章 | `related, recent` | `ghrepo, toc` |
| Wiki 页面 | `tree, related, recent` | `ghrepo, toc` |
| 笔记页 | `tagtree, recent` | `toc` |

### 4. 样式令牌使用

优先使用设计令牌而非硬编码值：

- 用 `appearance.colors.theme`、`appearance.colors.accent` 保持一致配色
- 用 `appearance.shape.radius.*` 保持统一圆角
- 用 `appearance.typography.font_size.*` 实现可伸缩排版

### 5. 插件按需启用

只启用需要的插件以优化性能。`enable: false` 的插件不会贡献任何代码。

**参考源码**：[_config.yml](../../../_config.yml)

---

配置系统的强大之处在于层级覆盖模式与各子系统的紧密集成。理解解析顺序与可用配置点，即可在不改主题代码的前提下实现精确定制。
