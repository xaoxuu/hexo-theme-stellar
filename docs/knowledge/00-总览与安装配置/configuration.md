---
title: 配置系统
domain: 总览与安装配置
tags:
  - 配置
  - YAML
  - layout profiles
---

# 配置系统

Stellar v2 的公开主题配置只有一棵字段树。主题仓库的手写 [`_config.yml`](../../../_config.yml) 是字段、默认值、排列顺序、注释和示例的唯一来源；站点 `_config.stellar.yml` 使用完全相同的层级，只写需要覆盖的部分。

Collection YAML 与页面 Front Matter 是独立的内容配置边界，见[内容配置 Schema v2](../03-内容系统/content-schema-v2.md)。它们不会扩展主题配置的顶层字段。

## 单源配置

`_config.yml` 的主干按注释标题分区并直接使用顶层字段。低频且不参与内容级覆盖的 Appearance 与 Inject 保留各自命名空间，例如：

```yaml
brand:
  name: Stellar

profiles:
  post:
    active_menu: post
    leftbar:
      widgets: [related, recent]
    rightbar: [ghrepo, toc]

appearance:
  color_scheme: auto

search:
  provider: local

inject:
  head_end: ''
```

配置加载器先读取主题 `_config.yml`，再应用站点覆盖。对象按字段合并，数组整体替换，因此 `rightbar: []`、`topbar: []` 和 `leftbar.widgets: []` 都能显式关闭默认项。解析结果会深度冻结到 `hexo.stellar.config`。

YAML 使用 `snake_case`，运行时只进行 `snake_case` → `camelCase` 转换：

| YAML | JavaScript |
| --- | --- |
| `appearance.color_scheme` | `appearance.colorScheme` |
| `profiles.blog_index.active_menu` | `profiles.blogIndex.activeMenu` |
| `appearance.typography.font_size.root` | `appearance.typography.fontSize.root` |
| `services.site_info.site_info_api.endpoint` | `services.siteInfo.site_info_api.endpoint` |

Provider ID 属于业务值，不会被改写，例如 `provider: site_info_api` 仍是字符串 `site_info_api`。

## 字段与规则

普通字段树、默认值和基础类型直接从 `_config.yml` 推导。[`config-rules.js`](../../../scripts/schema/config-rules.js) 只补充 YAML 本身无法表达的约束：

- `null` 与联合类型；
- 枚举、数值范围和数组元素；
- 动态记录；
- 第三方参数袋；
- 特殊 validator 与少量运行时键名。

顶层和普通对象保持封闭，未知字段会在构建早期报告结构化错误。第三方参数袋按规则开放并原样保留参数。旧 `site/layout/content/seo/resources/extensions` 分组路径没有别名或双读兼容；Appearance 与 Inject 只接受当前子字段。

`null` 只有在规则明确允许时才保留业务语义，例如 `search.provider: null` 表示关闭搜索。其它空键视为没有覆盖，继续使用默认值。

完整叶子路径、运行时路径、推导类型与例外约束见[配置 Reference](../../../reference/v2-config.md)。修改 `_config.yml` 或规则后运行：

```sh
npm run schema:generate
npm run schema:check
```

`schema:generate` 只更新 Reference，不会重写 `_config.yml`。

## 顶层结构

| 注释分组 | 顶层键 |
| --- | --- |
| Site | `brand/menu/settings/footer` |
| Layout | `regions/profiles` |
| Content | `article/notebook` |
| Appearance | `appearance` |
| SEO | `canonical/open_graph/structured_data` |
| Resources | `preconnect/fallbacks/error_page` |
| Extensions | `search/comments/tags/features/services` |
| Trusted injection | `inject` |

主题名称、版本、仓库地址、核心资源、缓存和固定交互策略属于内部实现，不进入公开 YAML。模板通过 `stellar_info()` 读取主题元数据，通过 `stellar_data()` 读取构建派生数据。

## Layout 与 Region

`regions` 定义站点级 Region；`profiles` 只写页面类型相对全局的差异。Topbar 和 Rightbar 直接使用 Widget 数组，Leftbar 保留自己的状态与固定区域设置：

```yaml
regions:
  topbar: []
  leftbar:
    default_state: expanded
    enabled: true
    brand: site_brand
    menu: true
    footer_actions: true
    widgets: []
  rightbar: []

profiles:
  wiki:
    active_menu: wiki
    topbar: []
    leftbar:
      brand: collection_brand
      menu: false
      footer_actions: false
      widgets: [tree]
    rightbar: [ghrepo, toc]
```

Profile 省略某个 Region 时继承全局值；显式空数组表示关闭。Collection 与 Front Matter 的 Region 覆盖由内容解析器继续处理，最终统一进入冻结 PageViewModel。

## Provider 配置

Search、Comments、Feature 与 Service 不再使用 `providers` 中间层。选中的参数袋与 `provider` 同级：

```yaml
comments:
  provider: giscus
  giscus:
    data-repo: owner/repo
    data-mapping: pathname

services:
  site_info:
    provider: site_info_api
    site_info_api:
      endpoint: https://api.example.com/site_info?url={href}
```

参数袋由对应上游或适配器解释；切换 provider 不改变服务根结构。`provider: null` 仅在该能力允许关闭时有效。

## Appearance

公开 Appearance 默认值都写在 `_config.yml` 的 `appearance` 对象中。`appearance.preset` 只选择 `source/css/_appearances/` 下对应的 CSS 实现，不再触发 JavaScript 默认覆盖。Preset 专属、无需用户调整的视觉常量由各自 Stylus 文件拥有。

Stylus 使用扁平路径读取公开值：

```stylus
$root-font-size = hexo-config('appearance.typography.font_size.root')
$theme-color = hexo-config('appearance.colors.primary')
```

## 置顶内容轮播

置顶文章的展示方式由 `article.listing.pinned_layout` 选择 `carousel` 或 `flat`；封面比例由 `article.listing.cover_ratio` 控制。文章仍通过 Front Matter 的 `pin` 标记置顶。

## 页脚配置

`footer.actions`、`footer.sections` 与 `footer.content` 分别控制 Leftbar 操作、主内容页脚分栏和 Markdown 文本。显式空数组或空字符串可以关闭对应区域。

## 消费边界

EJS 与 Node.js 只读取冻结的 camelCase 配置：

```ejs
<% var menuId = stellar_config(`profiles.${profile}.activeMenu`) %>
```

```js
const wikiPath = hexo.stellar.config.profiles.wikiIndex.path;
const service = hexo.stellar.config.services.siteInfo;
```

不要从 `theme.config` 读取旧路径，也不要在消费者中再次做字段兼容、默认值补齐或 provider 归一化。热重载解析失败时继续使用上一次有效配置，并报告本次错误。

## 相关实现

- [`scripts/schema/config-schema.js`](../../../scripts/schema/config-schema.js)：从 YAML 与轻量规则构建运行时 Schema
- [`scripts/schema/config-rules.js`](../../../scripts/schema/config-rules.js)：例外约束
- [`scripts/lib/config-schema.js`](../../../scripts/lib/config-schema.js)：加载、合并、验证、投影与冻结
- [`scripts/schema/content-config-rules.js`](../../../scripts/schema/content-config-rules.js)：Collection / Front Matter 独立规则
- [`reference/v2-config.md`](../../../reference/v2-config.md)：生成的公开叶子 Reference
