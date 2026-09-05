---
title: 内容配置 Schema v2
domain: 内容系统
tags:
  - schema
  - collection
  - front-matter
---

# 内容配置 Schema v2

Collection YAML 与 Page Front Matter 经过声明式 Schema 规范化后，作为冻结对象进入 CollectionModel 与 PageViewModel。模板不读取原始配置，也不兼容 v1 或 v2 预发布别名。确实存在于 1.44.0 的旧字段在拒绝时会给出人工迁移目标；v2 中间候选字段只按未知字段处理。

## Region 字段

Collection 和 Page 直接声明同形的三个 Region：

```yaml
topbar:
  enabled: true
  brand:
    name: Docs
  menu: []
  widgets: [spacer, menu, settings]
leftbar:
  brand:
    name: Docs
  menu: []
  footer:
    actions: []
  widgets: [tree]
rightbar:
  widgets: [ghrepo, toc]
```

三个 Region 都可覆盖 `enabled/widgets`；Topbar / Leftbar 还可覆盖各自的 `brand/menu`，Leftbar 可覆盖 `footer.actions`。`leftbar.default_state` 是站点级 Shell 策略，不能在内容层配置。

级联顺序固定为主题全局、Profile、Collection、Page；最后一个显式 `widgets` 数组整体替换，空数组清空，省略继承，不去重、不排序。完整规则见 [Region 与 Leftbar 系统](../02-布局系统/sidebar-system.md)。

## Collection 主要字段

| 字段 | 作用 |
| --- | --- |
| `name/headline/tagline/description` | Collection 身份文案 |
| `icon` | Collection 项目图标 |
| `cover` | Collection 入口卡片封面 |
| `route.path` | Collection 路由 |
| `hero` | 仅 Wiki Collection 首页 Hero |
| `banner` | Collection 内容页 Banner 默认值 |
| `listing` | 排序与分页 |
| `topbar/leftbar/rightbar` | Collection 页面 Region 覆盖 |
| `active_menu/breadcrumb` | 菜单激活和面包屑 |
| `navigation.tree` | 仅 Wiki Collection 的章节树 |
| `article/footer/comments/source` | 内容与服务配置 |

## Page 主要字段

| 字段 | 作用 |
| --- | --- |
| `collection.profile/id` | 归属的 Wiki、Topic 或 Notebook |
| `cover/banner` | 列表与内容头图 |
| `topbar/leftbar/rightbar` | Page 级 Region 覆盖 |
| `active_menu/breadcrumb` | 菜单激活和面包屑 |
| `article/footer/comments` | 内容展示与页脚评论 |
| `visibility/listing` | 可见性与列表优先级 |
| `render/seo/inject` | 渲染、分享元数据与可信注入 |
| `source` | 源码仓库 |

Hexo 自有 Front Matter（如 `title/date/layout/tags/categories/permalink`）保持上游名称，不进入 Stellar 字段重命名。

## Widget 与业务数据边界

Region 对象的 `widgets` 数组只保存可移动 Widget 引用。Brand 与 Menu 由 Topbar / Leftbar 各自配置，Actions 只属于 `leftbar.footer.actions`。Wiki 与 Notebook 默认把 Collection 的 `name/tagline/icon/route` 投影为 Leftbar Brand；Profile、Collection 或 Page 的显式 `leftbar.brand` 会按级联顺序覆盖，Topic 继续使用站点 Brand。

Collection 字段按实际消费者收窄：Wiki 只接受 `listing.priority/order`、`navigation.tree` 与 `hero`；Topic 只接受 `listing.excerpt_length/sort` 和 `route.start`；Notebook 只接受 `listing.order/excerpt_length/per_page/sort`。`route.path` 对三类 Collection 都有效。Page 的 `listing.priority` 只接受 Post、Topic 与 Notebook，归属可推导的页面会先解析归属再校验。

Widget 的位置能力由类型 descriptor 声明，不允许实例扩大能力。能力不匹配只产生 warning 并跳过实例；Schema 错误、未知字段和旧字段则是构建错误。

## 迁移定位

Doctor 只为 1.44.0 已发布的 Collection 与 Front Matter 字段输出来源文件、字段路径和人工迁移目标，例如 Collection `title` 指向 `name`、Front Matter `wiki` 指向 `collection.id`。v2 预发布候选中出现过的分组路径和中间字段作为普通未知字段处理，不保留专用墓碑或迁移表。

最终字段、类型与约束以内容/模型 Schema、解析器和对应测试为准。

## 实现接缝

- 轻量规则：`scripts/schema/content-config-rules.js`
- Schema 投影：`scripts/schema/content-config-schema.js`
- 解析与冻结：`scripts/lib/content-config.js`
- Region 级联：`scripts/lib/regions.js`
- ViewModel：`scripts/lib/models/index.js`
- Doctor：`scripts/lib/doctor.js`
