---
title: Stellar v2 Topic 完整渲染消费链
date: 2026-08-23
status: 已完成
---

# Topic 完整渲染消费链方案

## 1. 问题与目标

本切片是 Pre-alpha M2 的 Topic 纵向交付。M1 已为 Topic 成员挂载冻结的 `PageViewModel`，但根布局、侧栏、面包屑、Banner、正文辅助区域、SEO、博客列表卡片、置顶轮播和 Topic 索引仍由 EJS 读取 `page`、`content_config()` 与 `stellar_data('topic').tree` 后推断最终状态。

目标是为 Topic profile 增加必需的 `render` 投影，并让 Topic 索引生成器提供显式列表投影。输出保持现有 DOM、class、URL、样式、语言文案和浏览器行为等价；Notebook 继续使用旧链。

## 2. 技术方案

### 2.1 Topic render 投影

`buildTopicPageViewModel()` 保持 `collection/item` 顶层不变，增加：

- `render.document`：语言、head 注入和根文档主题状态。
- `render.layout`：文章类型、缩进、背景、侧栏表面、最终 Brand、Topic 返回入口、面包屑与左右栏状态。
- `render.seo`：文章 title、description、keywords、robots、canonical、Open Graph 与 BlogPosting JSON-LD。
- `render.article`：最终 Banner、Footer、全站上下篇、相关文章、评论和正文排版状态。
- `render.listing`：博客卡片与置顶轮播所需链接、标题、说明、图像、分类、标签、作者、优先级、可见性和卡片样式。

Topic 复用 Post 的文章 SEO、Footer、评论和列表投影规则；Topic Hero 背景仅作为成员 Banner 的回退，Topic series 只服务侧栏专栏导航，不替换既有全站上下篇行为。所有字段由 Schema 校验并深度冻结，缺少合法 `render` 时按源文件构建失败。

### 2.2 两阶段 Topic 数据流

生成前先解析并冻结全部 Topic collection 与成员投影，建立只含最终 collection 的不可变 base 和索引投影；详情模型由 `completeTopicPageViewModel()` 以 base、当前页面投影和独立缓存的相关文章纯对象完成。`after_post_render` 与模板渲染边界复用同一 base，后者再纳入 Hexo 生成器补齐的全站上下篇；每次完成结果均通过 Schema 并重新深度冻结，登记输入不被原地修改。

Topic 索引投影包含 collection id、标题、说明、封面、最新成员、其余成员、排序时间和可见性。生成器把排序后的显式列表作为页面 local 传给 `index_topic.ejs`，卡片不再消费 `stellar_data('topic').tree`。Topic 索引继续使用通用 index Shell，不新增公开 profile。

## 3. 边界

- 迁移 Topic 详情页 Shell、Brand、侧栏、面包屑、Banner、Footer、上下篇、相关文章、评论、head/JSON-LD，以及博客列表卡片、置顶轮播和 Topic 索引卡片。
- Wiki 与普通 Post 保持已交付新链；Notebook 继续使用迁移期旧链，M2 与 Alpha 1 保持未完成。
- 不新增公开 YAML、Front Matter、URL、CSS、语言文案、浏览器 API 或依赖。
- 公开 Wiki、迁移跳转与索引策略为 N/A；本切片只迁移既有渲染消费边界。

## 4. 文档与验证

- 同步 `reference/v2-models.json`、内容模型、Topic 内容系统、SEO、侧栏知识库与 `VERIFICATION.md`。
- 主工程只更新 Stellar v2 蓝图三份状态文档，不修改 `source/`、不提交或更新子模块指针。
- 模型测试覆盖 Schema、深冻结、级联、Banner 回退、上下篇、评论、列表与来源化错误；模板测试覆盖显式 locals 和 Notebook 隔离。
- 运行 Reference、主题全量检查、知识库核查、主工程生成和固定基线 Standards / Spec 双轨 review。
