---
title: 笔记本系统
domain: 内容系统
tags:
  - Notebook
  - Note
  - 标签树
---

# 笔记本系统

Notebook 是标签驱动的轻量知识系统。它保留“全部笔记本 → 单个笔记本/标签列表 → Note 详情”三层旅程，不是 Wiki 或 Topic 的视觉皮肤。公开字段以 [v2 内容配置契约](content-schema-v2.md)为准。

## 文件与归属

推荐目录：

```text
source/
├── _data/notebooks/
│   └── dev.yml
└── notebooks/
    └── dev/
        └── Node 入门.md
```

`source/_data/notebooks/<id>.yml` 定义 Notebook。`source/notebooks/<id>/*.md` 可由路径唯一确定相同 id 的 Notebook，不需要重复写 `collection.profile/id`；其它目录中的 Note 使用：

```yaml
collection:
  profile: notebook
  id: dev
```

路径推断只接受已存在的 `_data/notebooks/<id>.yml`。显式 `collection` 可为其它目录中的 Note 消歧，但必须指向注册项并与源码信号一致。Notebook 命名空间零候选、多候选或显式冲突时，构建与 doctor 都会报告来源、候选集合和最小修复方式；v2 不读取旧 `notebook`、`book`、layout 或任意目录名作为兼容归属。

## 创建 Note

使用统一 v2 CLI：

```bash
npx hexo stellar new note \
  --notebook dev \
  --title "Node 入门" \
  --tags "Node,tools/cli" \
  --dry-run
```

确认计划后去掉 `--dry-run` 写入。命令行为：

- 检查 `source/_data/notebooks/dev.yml` 并复用 Collection Schema；
- 计划 `source/notebooks/dev/Node 入门.md`，dry-run 与真实写入消费同一冻结计划；
- 目标已存在、Notebook 未知、标题包含路径/保留字符时整体拒绝；
- 只生成 `date`、`title` 与可选 `tags`，不写可由路径唯一推断的归属字段；
- 不覆盖文件，中途失败清理本次创建的文件与空目录。

旧 `hexo new-note` 已删除，不提供别名或兼容写入。

## Notebook Collection

最小 Collection：

```yaml
name: Dev Notes
route:
  path: notebooks/dev
```

常用 v2 字段：

```yaml
name: Dev Notes
headline: Development Notes
tagline: 持续整理
description: Node.js 与工具链笔记
identity:
  icon: /images/dev.svg
route:
  path: notebooks/dev
navigation:
  menu: notebooks
listing:
  order: 10
  excerpt_length: 128
  per_page: 10
  sort:
    field: updated
    direction: desc
note_defaults:
  leftbar:
    widgets: [tagtree, recent]
  rightbar:
    widgets: [toc]
footer:
  license: null
  share: null
```

- `listing.order` 控制 Notebook 总索引顺序。
- `listing.per_page: null` 继承 Hexo；`0` 表示不分页。
- `listing.sort.field` 为 `date` 或 `updated`，`direction` 为 `asc` 或 `desc`。
- `footer.license/share: null` 继承 Article 默认；`false` / `[]` 显式关闭。
- `navigation.menu`、Region、Article、Footer、Comments 继续按页面 → Collection → Profile → 全局的模型边界级联。

## Note Front Matter

```yaml
---
date: 2026-08-25 12:00
title: Node 入门
tags:
  - Node
  - tools/cli
listing:
  priority: 5
visibility:
  listed: true
  searchable: true
---
```

- 层级标签用 `/` 分隔；`tools/cli` 同时建立 `tools` 与 `tools/cli` 节点。
- `listing.priority` 越大越靠前；相同 priority 再按 Notebook `listing.sort` 稳定排序。
- `visibility.listed: false` 从单本列表、标签页和 recent 排除，不删除详情路由。
- `visibility.searchable: false` 只排除站内搜索。
- 页面还可覆盖 `card`、`banner`、`sidebar`、`navigation`、`article`、`footer`、`comments`、`render` 与 `seo`；不存在 `pin`、`sticky`、`order_by`、`tagcons`、`menu_id`、`leftbar` 等 v1 兼容读取。

## 三层路由与投影

| 层级 | 内部 layout | 输入投影 | 结果 |
| --- | --- | --- | --- |
| 全部笔记本 | `notebooks` | `notebookIndex.items/recentItems` | 上架 Notebook 与跨集合最近更新 |
| 单本/标签列表 | `notes` | `collection/tags/activeTag/items` | listed 过滤、标签 membership 与分页切片 |
| Note 详情 | `note` | `PageViewModel:notebook.render` | Brand、tag tree、recent、Banner、日期、标签、Footer、评论与 WebPage SEO |

生成器只消费冻结的 `hexo.stellar.data.notebookIndex` 投影。模板不读取原始 Notebook tree；标签页与 Wiki 标签页复用相同的 listed/tag 过滤原语，但 Wiki 保留章节 tree，Notebook 保留 tag tree。

## 两阶段构建

1. Collection Pipeline 单遍发现 Post/Page，并按 `notebook:<id>` 分组。
2. Notebook adapter 建立 collection base 与标签树；共享 two-stage 协议生成第一阶段 Note listing。
3. 聚合每个 Notebook 的排序列表、标签、recent 和总索引，并深度冻结 `notebookIndex`。
4. 把集合 `tagTree` 与 `recentItems` 写入最终 Note ViewModel，再执行模型 Schema 校验和冻结。
5. 生成器用同一 listed/tag 原语产生集合首页、标签页与分页 locals。

该流程保持线性发现与分组；不会为每个 Notebook 重扫全部页面。DOM、视觉、既有显式 Note URL 与客户端 API 不因 M7 改变。
