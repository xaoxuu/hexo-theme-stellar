---
title: Stellar v2 Notebook 完整渲染消费链
date: 2026-08-23
status: 已完成
---

# Notebook 完整渲染消费链方案

## 1. 问题与目标

本切片是 Pre-alpha M2 的最后一个纵向交付。M1 已为 Note 挂载冻结的 `PageViewModel`，但根布局、Brand、侧栏、标签树、面包屑、Banner、日期、Footer、评论与 head 仍由 EJS 读取 `page`、`content_config()` 和 `stellar_data('notebooks').tree` 后推断最终状态；Notebook 总索引、单 Notebook 首页与标签分页也仍直接消费运行时树和 Hexo 页面对象。

目标是为 Notebook profile 增加必需的 `render` 投影，并让 Notebook 生成器提供显式、冻结的集合卡片、Note 列表、标签导航与分页 locals。输出保持现有 DOM、class、URL、样式、语言文案和浏览器行为等价；完成后 M2 标记完成，但 Alpha 1 仍由 M3–M5 阶段门禁约束。

## 2. 技术方案

### 2.1 Notebook render 投影

`PageViewModel:notebook` 保持 `collection/item` 顶层不变，增加必需的：

- `render.document`：语言、head 注入和根文档主题状态。
- `render.layout`：文章类型、缩进、页面背景、侧栏表面、最终 Notebook Brand、Notebook 总索引/集合首页、搜索范围、左右栏与面包屑。
- `render.seo`：title、description、keywords、robots、canonical、Open Graph 与 WebPage JSON-LD。
- `render.article`：Banner、创建/更新时间、Note 标签、Footer、评论与正文排版状态。
- `render.listing`：Note 卡片所需链接、标题、封面、摘要、标签、日期、优先级和可见性。

详情页复用既有 Shell、Region、Section、Item 与 Navigation 原语。Notebook 的现有行为不包含正文上下篇，因此不在本切片新增；Note 标签继续链接到既有层级标签 URL，Footer 与评论只消费最终模型。

### 2.2 两阶段 Notebook 数据流

生成前先解析 Front Matter 并登记纯对象输入；Notebook 运行时树完成后再建立冻结的 collection base、完整 Note ViewModel、集合卡片投影、标签树投影和 Note 列表投影。完成器只接收已归一化配置、当前页面纯对象和 collection base，不原地修改输入，并在 Schema 校验后深度冻结。

Notebook 生成器只接收显式投影：总索引使用集合卡片列表，单 Notebook 首页和标签分页使用集合布局状态、当前标签、标签树、已过滤 Note 卡片与分页信息。模板不再读取原始 Notebook 配置树，也不再从 Note 原始页面推断最终卡片字段。

## 3. 边界

- 迁移 Note 详情页 Shell、Brand、搜索、标签树、侧栏、面包屑、Banner、日期、Footer、评论和 head/JSON-LD。
- 迁移 `/notebooks/`、单 Notebook 首页与层级标签分页的卡片、筛选、置顶、分页和 tabs/导航消费链。
- 保留 `notebook_index`、`note_index`、`note` 公共 profile；不新增公开 profile。
- Post、Wiki 与 Topic 保持已交付新链；完成本切片后 M2 完成，Alpha 1 仍未完成。
- 不新增公开 YAML、Front Matter、URL、CSS、语言文案、浏览器 API 或依赖。
- 公开 Wiki、迁移跳转与索引策略为 N/A；本切片只迁移既有渲染消费边界。

## 4. 文档与验证

- 同步 `reference/v2-models.json`、内容模型、Notebook 内容系统、列表卡片、SEO、侧栏知识库与 `VERIFICATION.md`。
- 主工程只更新 Stellar v2 蓝图三份状态文档，不修改 `source/`、不提交或更新子模块指针。
- 模型测试覆盖 Schema、深冻结、级联、标签、Footer、评论、列表可见性与来源化错误；模板测试覆盖显式 locals、缺失 render 失败和其它 profile 隔离。
- 运行 Reference、主题全量检查、知识库核查、主工程生成和固定基线 Standards / Spec 双轨 review。
