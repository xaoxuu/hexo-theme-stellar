---
title: Stellar v2 Collection Pipeline 与 Notebook 复核
date: 2026-08-25
status: 已通过
issue: 723
---

# Stellar v2 Collection Pipeline 与 Notebook 复核方案

## 1. 问题与目标

M2 已让 Post、Wiki、Topic、Notebook 输出同构 ViewModel，但构建编排仍分散在 `content-config`、`doc_tree`、`topic_tree`、`notebooks` 四个事件模块中：同一批内容被多次遍历，profile 判断、输入登记、两阶段完成和索引投影没有统一生命周期；旧 `new-note` 又绕过 v2 CLI 与严格 Collection 契约。

本切片交付以下用户结果：

- 四种内容形态保留既有 URL、语义 HTML、DOM、视觉和产品旅程。
- 构建期只有一个 Collection Pipeline 入口，按“发现与规范化 → 唯一归属 → Collection 状态 → 基础 ViewModel → 聚合 → 最终 ViewModel → 路由投影”推进。
- profile 注册表是 Post、Wiki、Topic、Notebook 的唯一构建登记处；adapter 只描述各自的数据源、导航、排序、首页和路由差异。
- `npx hexo stellar new note --notebook <id> --title <title>` 可 dry-run 或安全创建 Note，拒绝未知 Notebook、非法标题、路径越界和已有目标。

## 2. 行为矩阵

| Profile | 内容来源 | 归属 | Collection 状态 | 导航差异 | 聚合 / 路由差异 |
| --- | --- | --- | --- | --- | --- |
| Post | `posts` | 无 Collection 时归入 `post` | 站点与 `layout.profiles.post/blog_index` | 分类、标签、全站上下篇 | Hexo 博客分页与既有 Post 路由 |
| Wiki | `pages` + `_data/wiki/*` | `collection.profile/id` | 手工章节树、homepage、shelf、相关项目 | tree 与项目首页 | Wiki 总索引、标签过滤；页面路由保持源文件结果 |
| Topic | `posts` + `_data/topic/*` | `collection.profile/id` | 成员按配置排序形成 series | series 只服务侧栏 | Topic 索引按最新文章排序；正文仍用 Hexo 全站上下篇 |
| Notebook | `pages` + `_data/notebooks/*` | `collection.profile/id` | 标签树、recent、隐藏项与置顶 | tag tree 与最近更新 | 总索引 → 单本/标签分页 → Note 详情三层路由 |

共享内核唯一负责：页面与数据配置解析、内容快照、profile/id 分组、来源与身份规范化、可见性、优先级、摘要、SEO、Footer、评论、列表冻结、稳定排序和过滤/分页输入。adapter 不重新解析 YAML 或 Front Matter，不直接渲染模板。

## 3. 技术方案

### 3.1 Pipeline 与注册表

- 新增 `scripts/lib/collection-pipeline/`：
  - `index.js`：唯一编排入口与阶段顺序。
  - `registry.js`：封闭的 `post/wiki/topic/notebook` profile 描述与 adapter 注册表。
  - `shared.js`：一次内容发现、分组、稳定排序、listed 过滤、标签投影和分页输入等纯函数。
  - `adapters/*.js`：调用现有纯模型、树构建和 runtime data 接缝，只实现 profile 差异。
- `scripts/events/index.js` 的 `before_generate` 只调用 Pipeline；旧四入口降为 adapter 内部实现或删除。
- `scripts/lib/models/index.js` 继续作为模型字段事实来源；共享 `ContentItemModel`、Post render core 与 Schema 不复制到 adapter。
- `scripts/lib/page-view-model-registry.js` 统一为按 profile 保存 input/base/final 的登记表，保留现有 helper/filter 的兼容函数作为内部薄封装，避免模板行为改变。

### 3.2 共享聚合原语

- 所有内容只在发现阶段遍历一次，产出普通对象快照与 `membersByProfile` / `membersByCollection`。
- Topic 和 Notebook 通过同一 two-stage 协议：先建立 Collection base 与成员 base，再生成集合级导航/列表聚合，最后完成详情 ViewModel。
- Wiki 与 Notebook 标签页复用同一“listed 过滤 + tag membership + 分页输入”纯函数；Wiki tree 与 Notebook tag tree 仍由各自 adapter 持有。
- 排序必须稳定：主排序相等时回退发现顺序；Notebook priority 始终先于 collection sort。

### 3.3 Notebook CLI

- 新增可单测的 `scripts/lib/new-note.js`，命令层只负责参数与输出。
- `stellar new note` 参数：`--notebook`、`--title`、可选 `--tags`、`--dry-run`。
- 从 `source/_data/notebooks/<id>.yml` 经 `parseCollectionConfig()` 验证 Notebook；文件计划固定为 `source/notebooks/<id>/<safe-title>.md`。
- 生成最小 Front Matter：`title`、`date`、可选 `tags`。路径已唯一确定归属，因此不写 `collection.profile/id`。
- dry-run 与真实写入消费同一深冻结计划；目标已存在时整体拒绝，不创建目录或残留文件。
- 删除旧顶层 `hexo new-note` 注册，不提供别名或兼容读取。

## 4. 影响范围

- `scripts/`：事件编排、Collection Pipeline、模型登记、Wiki/Topic/Notebook 生成投影、`stellar` CLI。
- `test/`：行为矩阵、Pipeline 阶段、线性发现、稳定排序/过滤、四类回归与 new note 端到端。
- `docs/knowledge/03-内容系统/`：内容总览、v2 Schema、Wiki、Notebook 与列表路由。
- `docs/knowledge/VERIFICATION.md`：登记 #723 的知识库与验证证据。
- 配置 Schema、URL、EJS、CSS、浏览器 JS、语言文案、npm 发布、tag、主仓库子模块指针：N/A；本切片不改变这些公开接缝。

## 5. 验收标准

- 注册表只有四个 profile，未知 profile 在构建期给出来源化错误。
- 同一 fixture 证明四类公开 URL、关键 ViewModel 与索引投影保持一致；关键模板输出契约测试通过。
- Pipeline 的内容发现和 Collection 分组为 O(P + C)，测试以访问计数证明不按 Collection 重扫全部内容。
- Topic/Notebook two-stage、Wiki/Notebook 标签过滤与分页输入共用真实纯函数接缝。
- `stellar new note` 覆盖 dry-run、真实写入、tags、未知 Notebook、冲突、路径安全、最小 Front Matter、doctor 与 generate。
- `npm run check`、`npm run integration:check`、知识库核查和主工程 `npm run g` 通过；Standards / Spec 复审无剩余 finding。
