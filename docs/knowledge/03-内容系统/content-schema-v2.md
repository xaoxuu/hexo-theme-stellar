---
title: 内容配置 Schema v2
domain: 内容系统
tags:
  - schema
  - collection
  - front-matter
---

# 内容配置 Schema v2

Collection YAML 与 Page Front Matter 经过声明式 Schema 规范化后，作为冻结对象进入 CollectionModel 与 PageViewModel。模板不读取原始配置，也不兼容 v1 或 v2 预发布别名。

## Region 字段

Collection 和 Page 共享同形的 `regions`：

```yaml
regions:
  topbar:
    inherit: true
    widgets: [brand, spacer, menu, search, actions]
  leftbar:
    inherit: false
    widgets: [tree]
  rightbar:
    widgets: [ghrepo, toc]
```

每个 Region 只包含 `inherit` 与 `widgets`。`leftbar.default_state` 是站点级 Shell 策略，不能在内容层配置。Notebook 的 Note 默认布局使用 `note_defaults.regions`。

级联顺序固定为主题全局、Profile、Collection、Page；默认追加，`inherit: false` 重置，不去重、不排序。完整规则见 [Region 与 Leftbar 系统](../02-布局系统/sidebar-system.md)。

## Collection 主要字段

| 字段 | 作用 |
| --- | --- |
| `name/headline/tagline/description` | Collection 身份文案 |
| `identity.icon` | Wiki / Notebook 项目图标 |
| `route.path` | Collection 路由 |
| `hero` | Collection 首页 Hero |
| `card` / `listing` | 列表卡片与排序分页 |
| `regions` | Collection 页面 Region 覆盖 |
| `note_defaults.regions` | Notebook 内 Note 的 Region 覆盖 |
| `navigation` | 菜单、面包屑和树 |
| `article/footer/comments/source` | 内容与服务配置 |

## Page 主要字段

| 字段 | 作用 |
| --- | --- |
| `collection.profile/id` | 归属的 Wiki、Topic 或 Notebook |
| `card/banner` | 列表与内容头图 |
| `regions` | Page 级 Region 覆盖 |
| `navigation` | 菜单激活和面包屑 |
| `article/footer/comments` | 内容展示与页脚评论 |
| `visibility/listing` | 可见性与列表优先级 |
| `render/seo/inject` | 渲染、分享元数据与可信注入 |
| `source` | 源码仓库 |

Hexo 自有 Front Matter（如 `title/date/layout/tags/categories/permalink`）保持上游名称，不进入 Stellar 字段重命名。

## Widget 与业务数据边界

Region 数组只保存 Widget 引用。Brand、Menu、Search 与 Actions 的业务配置分别仍归 `site.brand`、`site.menu`、`extensions.search` 与 `site.footer.actions` 所有。Collection Identity 可以为 Wiki/Notebook 投影 Brand，但内容层不再使用位置绑定的 `sidebar.left.brand`。

Widget 的位置能力由类型 descriptor 声明，不允许实例扩大能力。能力不匹配只产生 warning 并跳过实例；Schema 错误、未知字段和旧字段则是构建错误。

## 迁移定位

| 旧字段 | 新字段 |
| --- | --- |
| `sidebar.left.widgets` | `regions.leftbar.widgets` |
| `sidebar.right.widgets` | `regions.rightbar.widgets` |
| `note_defaults.sidebar` | `note_defaults.regions` |
| `sidebar.left.search/menu/wiki_home` | 对应系统 Widget |
| `sidebar.left.brand` | `site.brand` + `brand` Widget |

Doctor 会输出来源文件、字段路径和迁移目标。最终字段、类型、默认值与 consumer 以 `reference/v2-config.md` 和 `reference/v2-models.md` 为准。

## 实现接缝

- 目标字段：`scripts/schema/config-target.js`
- Schema 投影：`scripts/schema/content-config-schema.js`
- 解析与冻结：`scripts/lib/content-config.js`
- Region 级联：`scripts/lib/regions.js`
- ViewModel：`scripts/lib/models/index.js`
- Doctor：`scripts/lib/doctor.js`
