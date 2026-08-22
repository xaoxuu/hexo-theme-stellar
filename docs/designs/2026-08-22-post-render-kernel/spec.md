---
title: Stellar v2 普通 Post 渲染内核
date: 2026-08-22
status: 已完成（M2 部分交付）
---

# 普通 Post 渲染内核方案

## 1. 问题与目标

[#700](https://github.com/xaoxuu/hexo-theme-stellar/issues/700) 是 Pre-alpha M2 的首个纵向切片。M1 已在构建期为普通 Post 生成冻结的 `PageViewModel`，但根布局、侧栏导航、面包屑与 SEO 仍由 EJS 读取 `page`、`theme` 和 `site` 后自行推断优先级。

本切片为 Post profile 增加必需的 `render` 投影，并建立 Shell、Region、Section、Item、Navigation 五类布局原语。普通 Post 的根布局、左右侧栏、Brand、菜单、博客面包屑、head 与 JSON-LD 只消费已完成级联的 ViewModel；输出保持现有 DOM、class、CSS、URL 与视觉行为等价。

## 2. 技术方案

### 2.1 Post render 投影

`buildPostPageViewModel()` 继续输出既有 `collection` 与 `item`，并为 Post profile 增加：

- `render.document`：最终页面语言、页面级 head 注入和根文档主题状态。
- `render.layout`：内容页类型、文章类型、缩进、侧栏表面、Brand、博客路径与面包屑状态。
- `render.seo`：最终 title、description、keywords、robots、canonical、Open Graph 参数与 JSON-LD 对象。

Post 使用 profile 专属 `PageViewModel` Schema，`render` 为必填；Wiki、Topic、Notebook 继续使用 M1 的共享两字段结构。SEO 回退沿用现有契约：JSON-LD 图片为 card → banner → photos → 正文首图 → 默认封面，OG 图片为 card → banner → 正文首图 → 站点头像，description 与 keywords 保留当前优先级。

### 2.2 五类布局原语

五类 EJS 原语位于 `layout/_partial/primitives/`，只接收显式 locals，不读取或修改 `page`、`theme`、`site`：

| 原语 | 职责 | 输入边界 |
| --- | --- | --- |
| Shell | 组合文档 body 与页面根容器 | 已验证 ViewModel、显式 body/regions/scripts |
| Region | 输出 cover/left/main/right 区域的既有 DOM | 封闭 slot、显式 body/surface/class |
| Section | 组合区域内 brand/search/widgets/content/footer 等片段 | 封闭 slot、受信任内部 HTML |
| Item | 组合 section 内单个内部片段 | 封闭 kind、受信任内部 HTML |
| Navigation | 输出显式导航条目并声明 placement | 已投影 entries，不读取页面状态 |

未知 slot/kind 直接抛出可定位错误；原语不接受用户提供的动态 partial 路径。普通 Post 缺少合法 `render` 时根布局直接失败，不回读旧字段。尚未迁移的 profile 使用明确的 legacy 分支，不增加 v1 字段别名或配置 fallback。

## 3. 边界

- 本切片迁移普通 Post 的根布局、左右侧栏选择、Brand、菜单激活、博客面包屑、head 和 JSON-LD。
- 文章正文、标签、文章 Footer、评论、相关阅读、Post 列表，以及 Wiki/Topic/Notebook 的消费链不在本切片内。
- 不新增公开 YAML、URL、Stylus、浏览器 JS 或迁移规则；公开 Wiki 同步为 N/A。
- M2 在本切片完成后仍是部分交付，不能标记里程碑或 Alpha 1 完成。

## 4. 影响范围与复用

- 复用 `scripts/lib/seo.js` 的图片与描述规则、现有 PageViewModel 构建器和声明式 Schema。
- 复用现有 sidebar/widget、Brand、menu、breadcrumb 与 head partial；只将 Post 分支改为显式 locals。
- 新增 Post render Schema/构建函数、五类原语、行为测试与生成回归。
- 同步内容模型、布局、侧栏、head/SEO 知识库和 `VERIFICATION.md`。

## 5. 验证

- 模型测试覆盖 SEO 回退、显式空值、语言、canonical、robots、OG/JSON-LD、冻结和 Schema/Reference 漂移。
- 原语测试覆盖封闭 slot/kind、属性转义、受信任 body 与导航激活。
- 主工程构建后检查普通 Post `/blog/20260226/` 的布局、导航与 SEO，并抽查 Topic Post `/blog/20260815/` 和 Wiki 页面未改变。
- 运行主题 `npm run check`、知识库核查与主工程 `npm run g`。
