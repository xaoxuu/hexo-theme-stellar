---
title: Stellar v2 Wiki 完整渲染消费链
date: 2026-08-23
status: 已完成
---

# Wiki 完整渲染消费链方案

## 1. 问题与目标

[#713](https://github.com/xaoxuu/hexo-theme-stellar/issues/713) 是 Pre-alpha M2 的 Wiki 纵向切片。M1 已在 Wiki 树完成后挂载冻结的 `PageViewModel`，但根布局、Hero、侧栏、面包屑、正文辅助区域、SEO 与 Wiki 索引卡片仍由 EJS 读取 `page`、`stellar_data('wiki')` 和配置后推断最终状态。

本切片为 Wiki profile 增加必需的 `render` 投影，让 Wiki 详情页只从 ViewModel 消费最终布局和内容数据，并让 Wiki 索引生成器向模板提供显式的列表与标签导航数据。输出保持现有 DOM、class、URL、样式和浏览器行为等价。

## 2. 技术方案

### 2.1 Wiki render 投影

`buildWikiPageViewModel()` 保持 `collection/item` 顶层不变，增加：

- `render.document`：语言、head 注入和根文档主题状态。
- `render.layout`：页面类型、文章类型、缩进、页面背景、侧栏表面、最终 Brand、Wiki 返回入口、面包屑和左右栏状态。
- `render.seo`：title、description、keywords、robots、canonical、Open Graph 与 WebPage JSON-LD。
- `render.cover`：仅 Wiki 首页启用的 Hero、源码和 release 请求数据。
- `render.article`：Banner、README 占位、Footer、上下篇、评论与正文排版状态。
- `render.listing`：Wiki 卡片、筛选和置顶需要的标题、说明、图像、标签、仓库、排序和可见性。

所有字段由声明式 PageViewModel Schema 校验并深度冻结；缺少合法 `render` 的 Wiki 页面按源文件构建失败，不回读原始配置。

### 2.2 两阶段 Wiki 数据流

`doc_tree` 先完成所有 Wiki collection/item 基础模型，再建立跨项目 listing 索引和 related 投影，最后生成完整 Wiki PageViewModel。派生的 Wiki 索引数据保存于内部运行时数据，由生成器复制为页面显式 locals；EJS 不直接遍历原始 Wiki tree。

Wiki 索引页继续使用通用 index Shell，不新增公开 `wiki-index` profile。详情页复用现有 Shell、Region、Section、Item、Navigation 原语；Wiki 专用 partial 只接受显式 ViewModel locals。

## 3. 边界

- 迁移 Wiki 详情页根布局、Hero、Brand、搜索、tree、related、ghrepo、Banner、Footer、上下篇、评论、head/JSON-LD，以及 Wiki 索引卡片、筛选、置顶与 tabs。
- Topic 与 Notebook 继续使用迁移期旧链；M2 与 Alpha 1 保持未完成。
- 不新增公开 YAML、Front Matter、URL、CSS、语言文案、浏览器 API 或依赖。
- 公开 Wiki、迁移跳转与索引策略为 N/A；本切片只迁移既有输出的数据消费边界。

## 4. 复用与文档

- 复用 Post render 的 SEO、Footer、评论与 Shell 原语，以及现有 Wiki tree、remote README 和卡片 DOM。
- 同步 `content-schema-v2.md`、Wiki 内容系统/SEO/侧栏知识库与 `VERIFICATION.md`。
- 主工程只更新 Stellar v2 总蓝图，不提交主仓库或更新子模块指针。

## 5. 验证

- 模型测试覆盖 Schema、深冻结、级联、Hero、README、上下篇、评论、列表和来源化错误。
- 模板测试覆盖缺失 render 失败、显式 locals 与 Topic/Notebook 隔离。
- 主工程构建抽查 `/wiki/`、Wiki 标签页、`/wiki/stellar/` 和普通 Wiki 内页。
- 运行 Reference 检查、主题 `npm run check`、知识库核查和主工程 `npm run g`，并完成 Standards / Spec 双轨 review。
